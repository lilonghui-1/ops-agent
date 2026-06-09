"""结构化日志模块 - 支持 JSON 格式文件输出 + 控制台彩色输出"""

import logging
import sys
from pathlib import Path

try:
    from pythonjsonlogger import jsonlogger
    HAS_JSON_LOGGER = True
except ImportError:
    HAS_JSON_LOGGER = False


class AgentLogFormatter(logging.Formatter):
    """自定义日志格式器，增加 agent_name 字段"""

    COLORS = {
        'DEBUG': '\033[36m',     # 青色
        'INFO': '\033[32m',      # 绿色
        'WARNING': '\033[33m',   # 黄色
        'ERROR': '\033[31m',     # 红色
        'CRITICAL': '\033[35m',  # 紫色
    }
    RESET = '\033[0m'

    def format(self, record):
        # 添加 agent_name 字段
        agent_name = getattr(record, 'agent_name', None)
        agent_str = f"[{agent_name}] " if agent_name else ""

        # 颜色
        color = self.COLORS.get(record.levelname, '')
        level_str = f"{color}{record.levelname}{self.RESET}"

        # 格式化时间
        time_str = self.formatTime(record, self.datefmt)

        # 构建 log_id（取 logger name 的最后部分）
        log_id = record.name.split('.')[-1] if '.' in record.name else record.name

        formatted = f"{time_str} {level_str:8s} {log_id:20s} {agent_str}{record.getMessage()}"
        if record.exc_info and record.exc_info[0] is not None:
            formatted += "\n" + self.formatException(record.exc_info)
        return formatted


class JsonLogFormatter:
    """JSON 格式日志格式器（仅在 python-json-logger 可用时使用）"""

    def __init__(self):
        if HAS_JSON_LOGGER:
            self._formatter = jsonlogger.JsonFormatter(
                '%(asctime)s %(levelname)s %(name)s %(message)s',
                rename_fields={'asctime': 'timestamp', 'levelname': 'level', 'name': 'logger'},
                datefmt='%Y-%m-%dT%H:%M:%S',
            )
        else:
            self._formatter = logging.Formatter(
                '%(asctime)s [%(levelname)s] %(name)s: %(message)s',
                datefmt='%Y-%m-%dT%H:%M:%S',
            )

    def format(self, record):
        # 添加 agent_name
        agent_name = getattr(record, 'agent_name', None)
        if agent_name:
            record.agent_name = agent_name
        return self._formatter.format(record)


def setup_logging(log_level: str = "INFO", log_dir: str = "logs"):
    """初始化日志系统"""
    log_path = Path(log_dir)
    log_path.mkdir(parents=True, exist_ok=True)

    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # 清除已有 handler（避免重复）
    root_logger.handlers.clear()

    # 控制台 handler（彩色人类可读格式）
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(AgentLogFormatter(datefmt='%Y-%m-%d %H:%M:%S'))
    root_logger.addHandler(console_handler)

    # 文件 handler（JSON 格式）
    file_handler = logging.FileHandler(log_path / "ops-agent.log", encoding='utf-8')
    json_fmt = JsonLogFormatter()
    file_handler.setFormatter(json_fmt)
    root_logger.addHandler(file_handler)


def get_logger(name: str, agent_name: str = None) -> logging.Logger:
    """获取 logger 实例，可选携带 agent_name 标识"""
    logger = logging.getLogger(name)
    if agent_name:
        logger = logging.LoggerAdapter(logger, {'agent_name': agent_name})
    return logger
