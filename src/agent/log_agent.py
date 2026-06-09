"""日志分析 Agent - 日志收集与异常检测"""

import logging

from langchain_core.messages import HumanMessage

from ..models.llm_factory import LLMFactory
from ..models.prompts import LOG_AGENT_SYSTEM_PROMPT
from ..tools.base import ToolRegistry
from ..utils.logger import get_logger

logger = get_logger("log_agent", agent_name="log")


class LogAgent:
    """日志分析 Agent - 负责日志收集、错误模式识别和异常检测"""

    def __init__(self, config):
        self.config = config
        self.llm = LLMFactory.create_for_agent(config, "log")

        # 日志 Agent 需要日志相关工具
        tool_names = ["log_fetch", "log_analyze", "ssh_execute"]
        self.tools = [ToolRegistry.get(name) for name in tool_names]
        self.tools = [t for t in self.tools if t is not None]

        self._agent = None

    def _get_agent(self):
        """延迟初始化 Agent"""
        if self._agent is not None:
            return self._agent

        try:
            from langgraph.prebuilt import create_react_agent
        except ImportError:
            raise ImportError("langgraph 未安装，请执行: pip install langgraph")

        langchain_tools = []
        for tool in self.tools:
            lc_tool = ToolRegistry._convert_single_tool(tool)
            if lc_tool:
                langchain_tools.append(lc_tool)

        self._agent = create_react_agent(
            model=self.llm,
            tools=langchain_tools,
            prompt=LOG_AGENT_SYSTEM_PROMPT,
        )
        return self._agent

    async def run(self, task: str) -> dict:
        """执行日志分析任务

        Args:
            task: 日志分析任务描述

        Returns:
            包含分析结果的字典
        """
        logger.info(f"开始日志分析任务: {task}")
        agent = self._get_agent()

        try:
            result = await agent.ainvoke(
                {"messages": [HumanMessage(content=task)]}
            )
            final_message = result["messages"][-1].content
            tool_calls = self._extract_tool_calls(result["messages"])

            logger.info(f"日志分析完成，工具调用次数: {len(tool_calls)}")
            return {
                "agent": "log",
                "task": task,
                "result": final_message,
                "tool_calls": tool_calls,
            }
        except Exception as e:
            logger.error(f"日志分析任务失败: {e}")
            return {
                "agent": "log",
                "task": task,
                "result": f"日志分析失败: {type(e).__name__}: {e}",
                "tool_calls": [],
                "error": str(e),
            }

    def _extract_tool_calls(self, messages) -> list:
        """提取工具调用记录"""
        calls = []
        for msg in messages:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    calls.append({
                        "tool": tc.get('name', 'unknown'),
                        "args": tc.get('args', {}),
                    })
        return calls
