"""数据库操作工具 - 支持 MySQL/PostgreSQL/Oracle/达梦/人大金仓 查询和状态检查，Redis 信息获取

安全设计：数据库凭证从配置文件内部读取，不通过 LLM 传递，防止密码泄露到外部 LLM 服务。
LLM 只需传递 host 和 db_type，工具内部根据配置匹配数据库连接信息。

支持的数据库类型：
- mysql: MySQL (pymysql)
- postgresql: PostgreSQL (psycopg2)
- oracle: Oracle (cx_Oracle)
- dm: 达梦数据库 (dmPython)
- kingbase: 人大金仓 (ksycopg2)
- redis: Redis
"""

import logging
from typing import Optional

from sqlalchemy import create_engine, text
from sqlalchemy.pool import QueuePool

try:
    import redis as redis_client
    HAS_REDIS = True
except ImportError:
    HAS_REDIS = False

from .base import BaseTool, ToolResult, ToolParameter

logger = logging.getLogger(__name__)

# 数据库类型到驱动的映射
DB_DRIVERS = {
    'mysql': 'mysql+pymysql',
    'postgresql': 'postgresql+psycopg2',
    'oracle': 'oracle+cx_oracle',
    'dm': 'dm+dmPython',
    'kingbase': 'postgresql+ksycopg2',
}

# 默认端口映射
DB_DEFAULT_PORTS = {
    'mysql': 3306,
    'postgresql': 5432,
    'oracle': 1521,
    'dm': 5236,
    'kingbase': 54321,
    'redis': 6379,
}

# 驱动版本要求（用于部署时检查）
DRIVER_VERSION_REQUIREMENTS = {
    'oracle': {'package': 'cx_Oracle', 'min_version': '8.3.0', 'note': '需要安装 Oracle Instant Client'},
    'dm': {'package': 'dmPython', 'min_version': '2.4.0', 'note': '需要安装达梦数据库客户端'},
    'kingbase': {'package': 'ksycopg2', 'min_version': '2.8.0', 'note': '人大金仓 Python 驱动'},
}


class _DBConfigMixin:
    """数据库配置查询混入类 - 从配置中查找数据库凭证，避免密码经过 LLM"""

    def __init__(self, config=None):
        self._config = config
        self._db_map = {}  # (host, port, db_type, db_name) -> {username, password, service_name, sid}
        self._redis_map = {}  # (host, port) -> {password}
        self._build_db_map()

    def _build_db_map(self):
        """从配置中构建数据库凭证索引"""
        if not self._config or not hasattr(self._config, 'servers'):
            return
        for server in self._config.servers:
            if not hasattr(server, 'databases'):
                continue
            for db in server.databases:
                if db.type == 'redis':
                    self._redis_map[(db.host, db.port)] = {
                        'password': getattr(db, 'password', None),
                    }
                else:
                    self._db_map[(db.host, db.port, db.type, db.name)] = {
                        'username': getattr(db, 'username', ''),
                        'password': getattr(db, 'password', ''),
                        'service_name': getattr(db, 'service_name', ''),
                        'sid': getattr(db, 'sid', ''),
                    }

    def _find_db_credentials(self, host: str, port: int, db_type: str, database: str) -> dict:
        """根据 host/port/type/name 查找数据库凭证"""
        # 精确匹配
        key = (host, port, db_type.lower(), database)
        creds = self._db_map.get(key)
        if creds:
            return creds

        # 模糊匹配：只按 host + db_type
        for k, v in self._db_map.items():
            if k[0] == host and k[2] == db_type.lower():
                return v

        return {}

    def _find_redis_credentials(self, host: str, port: int) -> dict:
        """查找 Redis 凭证"""
        return self._redis_map.get((host, port), {})


class DBQueryTool(_DBConfigMixin, BaseTool):
    """数据库查询工具 - 仅允许 SELECT/SHOW/DESCRIBE/EXPLAIN

    安全说明：username 和 password 从配置内部读取，LLM 无需传递密码。
    LLM 只需传递 host、db_type、database、query 即可。

    支持的数据库类型: mysql, postgresql, oracle, dm(达梦), kingbase(人大金仓)
    """

    name = "db_query"
    description = "在数据库上执行 SQL 查询语句（仅支持 SELECT/SHOW/DESCRIBE/EXPLAIN）。支持 MySQL/PostgreSQL/Oracle/达梦/人大金仓。凭证从配置自动读取，无需传递密码。"
    parameters = [
        ToolParameter(name="host", type="string", description="数据库地址"),
        ToolParameter(name="db_type", type="string", description="数据库类型: mysql, postgresql, oracle, dm, kingbase"),
        ToolParameter(name="database", type="string", description="数据库名（Oracle/SID 或 Service Name）"),
        ToolParameter(name="query", type="string", description="SQL 查询语句"),
        ToolParameter(name="port", type="integer", description="数据库端口（默认自动匹配）", required=False, default=0),
        ToolParameter(name="timeout", type="integer", description="查询超时(秒)", required=False, default=30),
    ]

    def __init__(self, config=None):
        _DBConfigMixin.__init__(self, config)

    def _build_connection_url(self, db_type: str, host: str, port: int, database: str, creds: dict) -> str:
        """构建数据库连接 URL，适配不同数据库类型"""
        username = creds.get('username', '')
        password = creds.get('password', '')
        dialect = DB_DRIVERS.get(db_type, 'mysql+pymysql')

        if db_type == 'oracle':
            # Oracle 使用 SID 或 Service Name
            service_name = creds.get('service_name', '')
            sid = creds.get('sid', '')
            if service_name:
                # Service Name 模式: oracle+cx_oracle://user:pass@host:port/?service_name=xxx
                return f"{dialect}://{username}:{password}@{host}:{port}/?service_name={service_name}"
            elif sid:
                # SID 模式: oracle+cx_oracle://user:pass@host:port/sid
                return f"{dialect}://{username}:{password}@{host}:{port}/{sid}"
            else:
                # 使用 database 作为 SID
                return f"{dialect}://{username}:{password}@{host}:{port}/{database}"

        elif db_type in ('dm', 'kingbase'):
            # 达梦和人大金仓使用类似 PostgreSQL 的连接方式
            return f"{dialect}://{username}:{password}@{host}:{port}/{database}"

        else:
            # MySQL / PostgreSQL 标准连接
            return f"{dialect}://{username}:{password}@{host}:{port}/{database}"

    def execute(self, **kwargs) -> ToolResult:
        db_type = kwargs['db_type'].lower()
        query = kwargs['query'].strip().upper()
        host = kwargs['host']
        database = kwargs['database']
        port = kwargs.get('port', DB_DEFAULT_PORTS.get(db_type, 3306))

        # 安全检查：仅允许只读查询
        allowed_prefixes = ("SELECT", "SHOW", "DESCRIBE", "DESC", "EXPLAIN")
        # Oracle/DM/Kingbase 额外支持一些查询前缀
        if db_type in ('oracle', 'dm', 'kingbase'):
            allowed_prefixes += ("WITH", "VALUES")
        if not any(query.startswith(prefix) for prefix in allowed_prefixes):
            return ToolResult(
                success=False,
                error="安全限制：仅允许 SELECT/SHOW/DESCRIBE/EXPLAIN 查询"
            )

        # 从配置中查找凭证
        creds = self._find_db_credentials(host, port, db_type, database)
        username = creds.get('username', '')
        password = creds.get('password', '')

        if not username:
            return ToolResult(
                success=False,
                error=f"未找到数据库 {host}:{port}/{database} 的连接配置，请在 servers.yaml 中配置",
                metadata={"db_type": db_type, "host": host}
            )

        try:
            url = self._build_connection_url(db_type, host, port, database, creds)
            engine = create_engine(
                url,
                poolclass=QueuePool,
                pool_size=2,
                max_overflow=2,
                pool_recycle=300,
                pool_pre_ping=True,
                echo=False,
            )

            with engine.connect() as conn:
                result = conn.execute(
                    text(kwargs['query']),
                    execution_options={'timeout': kwargs.get('timeout', 30)}
                )
                rows = [dict(row._mapping) for row in result.fetchmany(1000)]
                return ToolResult(
                    success=True,
                    data={"rows": rows, "row_count": len(rows)},
                    metadata={"db_type": db_type, "host": host}
                )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"数据库查询失败: {type(e).__name__}: {e}",
                metadata={"db_type": db_type, "host": host}
            )


class DBStatusTool(_DBConfigMixin, BaseTool):
    """数据库状态检查工具 - 获取连接数、慢查询、主从状态等

    安全说明：凭证从配置内部读取，LLM 无需传递密码。
    支持的数据库类型: mysql, postgresql, oracle, dm(达梦), kingbase(人大金仓)
    """

    name = "db_status"
    description = "获取数据库运行状态信息（连接数、慢查询、主从复制状态等）。支持 MySQL/PostgreSQL/Oracle/达梦/人大金仓。凭证从配置自动读取。"
    parameters = [
        ToolParameter(name="host", type="string", description="数据库地址"),
        ToolParameter(name="db_type", type="string", description="数据库类型: mysql, postgresql, oracle, dm, kingbase"),
        ToolParameter(name="database", type="string", description="数据库名"),
        ToolParameter(name="port", type="integer", description="数据库端口（默认自动匹配）", required=False, default=0),
    ]

    def __init__(self, config=None):
        _DBConfigMixin.__init__(self, config)

    def _build_connection_url(self, db_type: str, host: str, port: int, database: str, creds: dict) -> str:
        """构建数据库连接 URL，适配不同数据库类型"""
        username = creds.get('username', '')
        password = creds.get('password', '')
        dialect = DB_DRIVERS.get(db_type, 'mysql+pymysql')

        if db_type == 'oracle':
            service_name = creds.get('service_name', '')
            sid = creds.get('sid', '')
            if service_name:
                return f"{dialect}://{username}:{password}@{host}:{port}/?service_name={service_name}"
            elif sid:
                return f"{dialect}://{username}:{password}@{host}:{port}/{sid}"
            else:
                return f"{dialect}://{username}:{password}@{host}:{port}/{database}"
        elif db_type in ('dm', 'kingbase'):
            return f"{dialect}://{username}:{password}@{host}:{port}/{database}"
        else:
            return f"{dialect}://{username}:{password}@{host}:{port}/{database}"

    def _get_mysql_status(self, conn) -> dict:
        """获取 MySQL 状态"""
        status = {}
        r = conn.execute(text("SHOW STATUS LIKE 'Threads_connected'"))
        row = r.fetchone()
        status['threads_connected'] = int(row[1]) if row else 0

        r = conn.execute(text("SHOW VARIABLES LIKE 'max_connections'"))
        row = r.fetchone()
        status['max_connections'] = int(row[1]) if row else 0

        r = conn.execute(text("SHOW STATUS LIKE 'Slow_queries'"))
        row = r.fetchone()
        status['slow_queries'] = int(row[1]) if row else 0

        r = conn.execute(text("SHOW STATUS LIKE 'Uptime'"))
        row = r.fetchone()
        status['uptime_seconds'] = int(row[1]) if row else 0

        try:
            r = conn.execute(text("SHOW SLAVE STATUS"))
            slave_rows = r.fetchall()
            if slave_rows:
                slave_status = dict(slave_rows[0]._mapping)
                status['replication'] = {
                    'configured': True,
                    'slave_io_running': slave_status.get('Slave_IO_Running'),
                    'slave_sql_running': slave_status.get('Slave_SQL_Running'),
                    'seconds_behind_master': slave_status.get('Seconds_Behind_Master'),
                }
            else:
                status['replication'] = {'configured': False}
        except Exception:
            status['replication'] = {'configured': False, 'error': '无法获取复制状态'}
        return status

    def _get_postgresql_status(self, conn) -> dict:
        """获取 PostgreSQL 状态"""
        status = {}
        r = conn.execute(text("SELECT count(*) FROM pg_stat_activity"))
        status['active_connections'] = r.scalar()

        r = conn.execute(text("SHOW max_connections"))
        status['max_connections'] = r.scalar()

        r = conn.execute(text(
            "SELECT state, count(*) as cnt FROM pg_stat_activity "
            "GROUP BY state ORDER BY cnt DESC"
        ))
        status['connections_by_state'] = [dict(row._mapping) for row in r.fetchall()]

        r = conn.execute(text(
            "SELECT count(*) FROM pg_stat_activity "
            "WHERE state = 'active' AND now() - query_start > interval '5 minutes'"
        ))
        status['long_running_queries'] = r.scalar()

        r = conn.execute(text(
            "SELECT pg_size_pretty(pg_database_size(current_database()))"
        ))
        status['database_size'] = r.scalar()
        return status

    def _get_oracle_status(self, conn) -> dict:
        """获取 Oracle 状态"""
        status = {}
        # 连接数
        r = conn.execute(text(
            "SELECT COUNT(*) FROM v$session WHERE type = 'USER'"
        ))
        status['user_sessions'] = r.scalar()

        # 最大连接数
        r = conn.execute(text(
            "SELECT VALUE FROM v$parameter WHERE NAME = 'processes'"
        ))
        status['max_processes'] = r.scalar()

        # 活跃会话
        r = conn.execute(text(
            "SELECT COUNT(*) FROM v$session WHERE status = 'ACTIVE' AND type = 'USER'"
        ))
        status['active_sessions'] = r.scalar()

        # 数据库大小
        r = conn.execute(text(
            "SELECT ROUND(SUM(bytes)/1024/1024/1024, 2) FROM dba_segments"
        ))
        status['database_size_gb'] = r.scalar()

        # 表空间使用率
        r = conn.execute(text(
            "SELECT tablespace_name, ROUND(used_space*8192/1024/1024, 2) as used_mb, "
            "ROUND(tablespace_size*8192/1024/1024, 2) as total_mb, "
            "ROUND((used_space/tablespace_size)*100, 2) as used_pct "
            "FROM dba_tablespace_usage_metrics WHERE ROUND((used_space/tablespace_size)*100, 2) > 0"
        ))
        status['tablespace_usage'] = [dict(row._mapping) for row in r.fetchall()]

        # 等待事件 TOP 5
        r = conn.execute(text(
            "SELECT event, total_waits, round(total_waits/sum(total_waits) over()*100, 2) as pct "
            "FROM v$system_event WHERE wait_class != 'Idle' "
            "ORDER BY total_waits DESC FETCH FIRST 5 ROWS ONLY"
        ))
        status['top_wait_events'] = [dict(row._mapping) for row in r.fetchall()]
        return status

    def _get_dm_status(self, conn) -> dict:
        """获取达梦数据库状态"""
        status = {}
        # 连接数
        r = conn.execute(text(
            "SELECT COUNT(*) FROM V$SESSIONS WHERE STATE = 'ACTIVE'"
        ))
        status['active_sessions'] = r.scalar()

        # 最大连接数
        r = conn.execute(text(
            "SELECT PARA_VALUE FROM V$DM_INI WHERE PARA_NAME = 'MAX_SESSIONS'"
        ))
        status['max_sessions'] = r.scalar()

        # 数据库大小
        r = conn.execute(text(
            "SELECT ROUND(SUM(TOTAL_SIZE)/1024/1024, 2) FROM V$TABLESPACE"
        ))
        status['database_size_mb'] = r.scalar()

        # 表空间使用率
        r = conn.execute(text(
            "SELECT NAME, ROUND(TOTAL_SIZE*PAGE_SIZE/1024/1024, 2) as total_mb, "
            "ROUND(FREE_SIZE*PAGE_SIZE/1024/1024, 2) as free_mb, "
            "ROUND((TOTAL_SIZE-FREE_SIZE)/TOTAL_SIZE*100, 2) as used_pct "
            "FROM V$TABLESPACE WHERE TOTAL_SIZE > 0"
        ))
        status['tablespace_usage'] = [dict(row._mapping) for row in r.fetchall()]

        # 慢 SQL TOP 5
        r = conn.execute(text(
            "SELECT SQL_TEXT, EXEC_TIME FROM V$SQL_HISTORY "
            "ORDER BY EXEC_TIME DESC LIMIT 5"
        ))
        status['slow_sql_top5'] = [dict(row._mapping) for row in r.fetchall()]
        return status

    def _get_kingbase_status(self, conn) -> dict:
        """获取人大金仓状态"""
        status = {}
        # 连接数
        r = conn.execute(text("SELECT count(*) FROM sys_stat_activity"))
        status['active_connections'] = r.scalar()

        # 最大连接数
        r = conn.execute(text("SHOW max_connections"))
        status['max_connections'] = r.scalar()

        # 按状态分组
        r = conn.execute(text(
            "SELECT state, count(*) as cnt FROM sys_stat_activity "
            "GROUP BY state ORDER BY cnt DESC"
        ))
        status['connections_by_state'] = [dict(row._mapping) for row in r.fetchall()]

        # 数据库大小
        r = conn.execute(text(
            "SELECT sys_size_pretty(sys_database_size(current_database()))"
        ))
        status['database_size'] = r.scalar()

        # 长事务
        r = conn.execute(text(
            "SELECT count(*) FROM sys_stat_activity "
            "WHERE state = 'active' AND now() - query_start > interval '5 minutes'"
        ))
        status['long_running_queries'] = r.scalar()
        return status

    def execute(self, **kwargs) -> ToolResult:
        db_type = kwargs['db_type'].lower()
        host = kwargs['host']
        database = kwargs['database']
        port = kwargs.get('port', DB_DEFAULT_PORTS.get(db_type, 3306))

        # 从配置中查找凭证
        creds = self._find_db_credentials(host, port, db_type, database)
        username = creds.get('username', '')
        password = creds.get('password', '')

        if not username:
            return ToolResult(
                success=False,
                error=f"未找到数据库 {host}:{port}/{database} 的连接配置，请在 servers.yaml 中配置",
                metadata={"db_type": db_type, "host": host}
            )

        try:
            url = self._build_connection_url(db_type, host, port, database, creds)
            engine = create_engine(
                url,
                poolclass=QueuePool,
                pool_size=2,
                max_overflow=2,
                pool_recycle=300,
                pool_pre_ping=True,
            )

            status = {}
            with engine.connect() as conn:
                if db_type == "mysql":
                    status = self._get_mysql_status(conn)
                elif db_type == "postgresql":
                    status = self._get_postgresql_status(conn)
                elif db_type == "oracle":
                    status = self._get_oracle_status(conn)
                elif db_type == "dm":
                    status = self._get_dm_status(conn)
                elif db_type == "kingbase":
                    status = self._get_kingbase_status(conn)
                else:
                    status['warning'] = f"暂不支持 {db_type} 的详细状态查询"

            return ToolResult(
                success=True,
                data=status,
                metadata={"db_type": db_type, "host": host}
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"获取数据库状态失败: {type(e).__name__}: {e}",
                metadata={"db_type": db_type, "host": host}
            )


class RedisInfoTool(_DBConfigMixin, BaseTool):
    """Redis 信息获取工具

    安全说明：密码从配置内部读取，LLM 无需传递密码。
    """

    name = "redis_info"
    description = "获取 Redis 运行状态信息（内存、连接、命中率等）。凭证从配置自动读取。"
    parameters = [
        ToolParameter(name="host", type="string", description="Redis 地址"),
        ToolParameter(name="port", type="integer", description="Redis 端口", required=False, default=6379),
        ToolParameter(name="db", type="integer", description="数据库编号", required=False, default=0),
    ]

    def __init__(self, config=None):
        _DBConfigMixin.__init__(self, config)

    def execute(self, **kwargs) -> ToolResult:
        if not HAS_REDIS:
            return ToolResult(success=False, error="redis 包未安装，请执行: pip install redis")

        host = kwargs['host']
        port = kwargs.get('port', 6379)

        # 从配置中查找凭证
        creds = self._find_redis_credentials(host, port)
        password = creds.get('password') or None

        try:
            client = redis_client.Redis(
                host=host,
                port=port,
                password=password,
                db=kwargs.get('db', 0),
                decode_responses=True,
                socket_timeout=10,
                socket_connect_timeout=10,
            )

            # 测试连接
            client.ping()

            info = client.info(section="default")
            memory_info = client.info(section="memory")

            # 计算命中率
            hits = info.get('keyspace_hits', 0)
            misses = info.get('keyspace_misses', 0)
            total = hits + misses
            hit_rate = round(hits / total * 100, 2) if total > 0 else 0.0

            # 计算内存使用率
            used_memory = memory_info.get('used_memory', 0)
            max_memory = memory_info.get('maxmemory', 0)
            memory_usage_percent = round(used_memory / max_memory * 100, 2) if max_memory > 0 else -1

            key_metrics = {
                'version': info.get('redis_version'),
                'uptime_seconds': info.get('uptime_in_seconds'),
                'connected_clients': info.get('connected_clients'),
                'used_memory_human': memory_info.get('used_memory_human'),
                'maxmemory_human': memory_info.get('maxmemory_human'),
                'memory_usage_percent': memory_usage_percent,
                'keyspace_hits': hits,
                'keyspace_misses': misses,
                'hit_rate_percent': hit_rate,
                'total_commands_processed': info.get('total_commands_processed'),
                'instantaneous_ops_per_sec': info.get('instantaneous_ops_per_sec'),
                'blocked_clients': info.get('blocked_clients'),
            }

            return ToolResult(
                success=True,
                data=key_metrics,
                metadata={"host": host}
            )

        except Exception as e:
            return ToolResult(
                success=False,
                error=f"Redis 连接失败: {type(e).__name__}: {e}",
                metadata={"host": host}
            )
