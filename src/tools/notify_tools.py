"""通知工具 - 支持企业微信和钉钉 Webhook"""

import logging
from typing import Optional

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from .base import BaseTool, ToolResult, ToolParameter

logger = logging.getLogger(__name__)


class NotifyTool(BaseTool):
    """通知发送工具 - 企业微信/钉钉 Webhook"""

    name = "send_notification"
    description = "发送告警通知到企业微信或钉钉（支持 Markdown 格式）"
    parameters = [
        ToolParameter(name="title", type="string", description="通知标题"),
        ToolParameter(name="content", type="string", description="通知内容（支持 Markdown 格式）"),
        ToolParameter(
            name="level",
            type="string",
            description="告警级别: info, warning, error, critical",
            required=False,
            default="warning"
        ),
        ToolParameter(
            name="channel",
            type="string",
            description="通知渠道: wecom(企业微信), dingtalk(钉钉), all(全部)",
            required=False,
            default="all"
        ),
    ]

    # 级别对应的颜色标记
    LEVEL_EMOJI = {
        'info': 'ℹ️',
        'warning': '⚠️',
        'error': '❌',
        'critical': '🔴',
    }

    def __init__(self, config=None):
        self._wecom_webhook = None
        self._dingtalk_webhook = None
        if config and hasattr(config, 'notify'):
            self._wecom_webhook = config.notify.wecom_webhook
            self._dingtalk_webhook = config.notify.dingtalk_webhook

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    )
    def _send_wecom(self, title: str, content: str, level: str) -> bool:
        """发送企业微信通知"""
        if not self._wecom_webhook:
            logger.warning("企业微信 Webhook 未配置")
            return False

        emoji = self.LEVEL_EMOJI.get(level, '')
        payload = {
            "msgtype": "markdown",
            "markdown": {
                "content": f"## {emoji} {title}\n\n{content}"
            }
        }

        try:
            resp = httpx.post(
                self._wecom_webhook,
                json=payload,
                timeout=10,
            )
            result = resp.json()
            if result.get('errcode') != 0:
                logger.error(f"企业微信通知失败: {result.get('errmsg')}")
                return False
            return True
        except Exception as e:
            logger.error(f"企业微信通知异常: {e}")
            raise  # 让 tenacity 重试

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, max=10),
        retry=retry_if_exception_type((httpx.TimeoutException, httpx.ConnectError)),
    )
    def _send_dingtalk(self, title: str, content: str, level: str) -> bool:
        """发送钉钉通知"""
        if not self._dingtalk_webhook:
            logger.warning("钉钉 Webhook 未配置")
            return False

        emoji = self.LEVEL_EMOJI.get(level, '')
        payload = {
            "msgtype": "markdown",
            "markdown": {
                "title": f"{emoji} {title}",
                "text": f"## {emoji} {title}\n\n{content}",
            },
        }

        try:
            resp = httpx.post(
                self._dingtalk_webhook,
                json=payload,
                timeout=10,
            )
            result = resp.json()
            if result.get('errcode') != 0:
                logger.error(f"钉钉通知失败: {result.get('errmsg')}")
                return False
            return True
        except Exception as e:
            logger.error(f"钉钉通知异常: {e}")
            raise

    def execute(self, **kwargs) -> ToolResult:
        title = kwargs['title']
        content = kwargs['content']
        level = kwargs.get('level', 'warning')
        channel = kwargs.get('channel', 'all')

        results = {}

        if channel in ('wecom', 'all'):
            try:
                results['wecom'] = self._send_wecom(title, content, level)
            except Exception as e:
                results['wecom'] = False
                logger.error(f"企业微信通知最终失败: {e}")

        if channel in ('dingtalk', 'all'):
            try:
                results['dingtalk'] = self._send_dingtalk(title, content, level)
            except Exception as e:
                results['dingtalk'] = False
                logger.error(f"钉钉通知最终失败: {e}")

        all_success = all(results.values()) if results else False
        return ToolResult(
            success=all_success,
            data={"results": results, "level": level},
            metadata={"title": title, "channel": channel}
        )
