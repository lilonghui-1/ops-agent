"""SSH 远程执行工具 - 支持连接池、密钥/密码认证、超时控制"""

import threading
import logging
from typing import Optional

import paramiko

from .base import BaseTool, ToolResult, ToolParameter

logger = logging.getLogger(__name__)


class SSHConnectionPool:
    """SSH 连接池 - 按 host:port:username 缓存连接，线程安全"""

    _connections: dict = {}
    _lock = threading.Lock()

    @classmethod
    def get_connection(
        cls,
        host: str,
        port: int,
        username: str,
        password: str = None,
        private_key_path: str = None,
    ) -> paramiko.SSHClient:
        """获取或创建 SSH 连接"""
        key = f"{host}:{port}:{username}"

        if key in cls._connections:
            # 检查连接是否仍然活跃
            transport = cls._connections[key].get_transport()
            if transport and transport.is_active():
                return cls._connections[key]
            else:
                # 连接已断开，移除并重建
                try:
                    cls._connections[key].close()
                except Exception:
                    pass
                del cls._connections[key]

        with cls._lock:
            # 双重检查
            if key in cls._connections:
                return cls._connections[key]

            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

            connect_kwargs = {
                'hostname': host,
                'port': port,
                'username': username,
                'timeout': 10,
                'banner_timeout': 30,
                'auth_timeout': 30,
            }

            if private_key_path:
                try:
                    pkey = paramiko.RSAKey.from_private_key_file(private_key_path)
                    connect_kwargs['pkey'] = pkey
                except paramiko.ssh_exception.SSHException:
                    # 尝试 Ed25519 密钥
                    pkey = paramiko.Ed25519Key.from_private_key_file(private_key_path)
                    connect_kwargs['pkey'] = pkey
            elif password:
                connect_kwargs['password'] = password

            client.connect(**connect_kwargs)
            cls._connections[key] = client
            logger.info(f"SSH connection established: {key}")
            return client

    @classmethod
    def close_all(cls):
        """关闭所有连接"""
        with cls._lock:
            for key, client in cls._connections.items():
                try:
                    client.close()
                    logger.info(f"SSH connection closed: {key}")
                except Exception:
                    pass
            cls._connections.clear()

    @classmethod
    def close(cls, host: str, port: int, username: str):
        """关闭指定连接"""
        key = f"{host}:{port}:{username}"
        with cls._lock:
            if key in cls._connections:
                try:
                    cls._connections[key].close()
                except Exception:
                    pass
                del cls._connections[key]


class SSHExecuteTool(BaseTool):
    """SSH 远程命令执行工具"""

    name = "ssh_execute"
    description = "在远程服务器上执行 Shell 命令并返回输出结果。支持 sudo 权限提升。"
    parameters = [
        ToolParameter(name="host", type="string", description="服务器地址"),
        ToolParameter(name="command", type="string", description="要执行的 Shell 命令"),
        ToolParameter(name="timeout", type="integer", description="超时时间(秒)", required=False, default=30),
        ToolParameter(name="username", type="string", description="SSH 用户名（可选，默认使用配置中的用户）", required=False),
        ToolParameter(name="use_sudo", type="boolean", description="是否使用 sudo 执行", required=False, default=False),
    ]

    def __init__(self, config=None):
        self._config = config
        self._server_map = {}
        if config and hasattr(config, 'servers'):
            for s in config.servers:
                self._server_map[s.host] = s

    def _find_server(self, host: str):
        """查找服务器配置"""
        return self._server_map.get(host)

    def execute(self, **kwargs) -> ToolResult:
        host = kwargs['host']
        command = kwargs['command']
        timeout = kwargs.get('timeout', 30)
        use_sudo = kwargs.get('use_sudo', False)

        server = self._find_server(host)

        try:
            # 获取连接
            if server:
                conn = SSHConnectionPool.get_connection(
                    host=server.host,
                    port=server.port,
                    username=kwargs.get('username') or server.username,
                    password=server.password,
                    private_key_path=server.private_key_path,
                )
            else:
                # 没有配置时尝试使用默认参数
                conn = SSHConnectionPool.get_connection(
                    host=host,
                    port=22,
                    username=kwargs.get('username', 'root'),
                )

            if use_sudo:
                command = f"sudo {command}"

            # 执行命令
            stdin, stdout, stderr = conn.exec_command(command, timeout=timeout)

            # 并行读取 stdout 和 stderr 防止缓冲区阻塞
            out_lines = []
            err_lines = []

            def _read_stream(stream, lines):
                try:
                    for line in stream:
                        lines.append(line.rstrip('\n\r'))
                except Exception:
                    pass

            t_out = threading.Thread(target=_read_stream, args=(stdout, out_lines))
            t_err = threading.Thread(target=_read_stream, args=(stderr, err_lines))
            t_out.start()
            t_err.start()
            t_out.join(timeout=timeout + 5)
            t_err.join(timeout=timeout + 5)

            exit_code = stdout.channel.recv_exit_status()

            return ToolResult(
                success=(exit_code == 0),
                data={
                    "stdout": "\n".join(out_lines),
                    "stderr": "\n".join(err_lines),
                    "exit_code": exit_code,
                },
                metadata={"host": host, "command": command}
            )

        except paramiko.AuthenticationException as e:
            return ToolResult(success=False, error=f"SSH 认证失败: {e}", metadata={"host": host})
        except paramiko.SSHException as e:
            return ToolResult(success=False, error=f"SSH 连接错误: {e}", metadata={"host": host})
        except Exception as e:
            return ToolResult(success=False, error=f"命令执行失败: {type(e).__name__}: {e}", metadata={"host": host})
