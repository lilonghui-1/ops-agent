"""通用辅助函数"""

import re
from datetime import datetime


def parse_size(size_str: str) -> int:
    """将人类可读的大小字符串转换为字节数

    Examples:
        >>> parse_size("10G")
        10737418240
        >>> parse_size("512M")
        536870912
        >>> parse_size("1024K")
        1048576
    """
    size_str = size_str.strip().upper()
    units = {'B': 1, 'K': 1024, 'M': 1024**2, 'G': 1024**3, 'T': 1024**4}
    match = re.match(r'([\d.]+)\s*([BKMGTP]?)', size_str)
    if not match:
        raise ValueError(f"无法解析大小: {size_str}")
    value = float(match.group(1))
    unit = match.group(2) or 'B'
    return int(value * units.get(unit, 1))


def format_timestamp(ts: str) -> str:
    """尝试将各种时间戳格式统一为标准格式"""
    formats = [
        '%Y-%m-%d %H:%M:%S',
        '%Y-%m-%dT%H:%M:%S',
        '%Y-%m-%dT%H:%M:%S.%f',
        '%Y-%m-%dT%H:%M:%SZ',
        '%Y-%m-%dT%H:%M:%S.%fZ',
        '%b %d %H:%M:%S',
        '%d/%b/%Y:%H:%M:%S',
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(ts.strip(), fmt)
            return dt.strftime('%Y-%m-%d %H:%M:%S')
        except ValueError:
            continue
    return ts


def truncate_text(text: str, max_length: int = 2000, suffix: str = "...(已截断)") -> str:
    """截断过长文本"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def safe_json_parse(text: str) -> dict:
    """安全解析 JSON 文本，解析失败返回空字典"""
    import json
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return {}
