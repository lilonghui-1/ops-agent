"""LLM 工厂 - 可插拔的模型后端管理"""

import logging
from typing import Optional

logger = logging.getLogger(__name__)


class LLMFactory:
    """LLM 工厂类 - 根据配置创建不同的 LLM 实例

    支持的 provider:
    - openai: OpenAI GPT 系列
    - qwen: 通义千问（通过 OpenAI 兼容 API）
    - deepseek: DeepSeek（通过 OpenAI 兼容 API）
    - 自定义: 任何兼容 OpenAI API 的服务（vLLM、Ollama 等）
    """

    # 不同 Agent 的默认模型配置覆盖
    AGENT_MODEL_OVERRIDES = {
        'master': {},      # Master Agent 使用默认配置
        'inspect': {},     # 巡检 Agent
        'diagnose': {},    # 诊断 Agent（建议使用较强模型）
        'log': {},         # 日志 Agent
        'heal': {},        # 自愈 Agent
    }

    @classmethod
    def create(cls, config, agent_name: str = "default") -> 'BaseChatModel':
        """根据配置创建 LLM 实例

        Args:
            config: AppConfig 配置实例
            agent_name: Agent 名称，用于获取特定 Agent 的模型配置

        Returns:
            LangChain BaseChatModel 实例
        """
        try:
            from langchain_openai import ChatOpenAI
        except ImportError:
            raise ImportError(
                "langchain-openai 未安装，请执行: pip install langchain-openai"
            )

        llm_config = config.llm

        # 获取 Agent 特定的模型覆盖配置
        overrides = cls.AGENT_MODEL_OVERRIDES.get(agent_name, {})

        model = overrides.get('model', llm_config.model)
        temperature = overrides.get('temperature', llm_config.temperature)
        max_tokens = overrides.get('max_tokens', llm_config.max_tokens)

        # 构建 ChatOpenAI 参数
        kwargs = {
            'model': model,
            'api_key': llm_config.api_key,
            'temperature': temperature,
            'max_tokens': max_tokens,
            'request_timeout': 120,
            'max_retries': 2,
        }

        # 如果配置了自定义 base_url，使用它（兼容本地模型）
        if llm_config.base_url:
            kwargs['base_url'] = llm_config.base_url

        llm = ChatOpenAI(**kwargs)
        logger.info(f"LLM created for [{agent_name}]: model={model}, temperature={temperature}")
        return llm

    @classmethod
    def create_for_agent(cls, config, agent_name: str) -> 'BaseChatModel':
        """为特定 Agent 创建 LLM（语义化接口）"""
        return cls.create(config, agent_name)


# 类型别名（用于类型提示）
try:
    from langchain_core.language_models import BaseChatModel
except ImportError:
    BaseChatModel = None  # type: ignore
