"""巡检 Agent - 服务器和数据库状态巡检"""

import logging

from langchain_core.messages import HumanMessage

from ..models.llm_factory import LLMFactory
from ..models.prompts import INSPECT_SYSTEM_PROMPT
from ..tools.base import ToolRegistry
from ..utils.logger import get_logger

logger = get_logger("inspect_agent", agent_name="inspect")


class InspectAgent:
    """巡检 Agent - 负责服务器和数据库的运行状态检查"""

    def __init__(self, config):
        self.config = config
        self.llm = LLMFactory.create_for_agent(config, "inspect")

        # 巡检 Agent 只需要巡检相关的工具
        tool_names = ["system_metrics", "db_status", "redis_info"]
        self.tools = [ToolRegistry.get(name) for name in tool_names]
        self.tools = [t for t in self.tools if t is not None]

        self._agent = None

    def _get_agent(self):
        """延迟初始化 Agent（避免在导入时依赖 LangChain）"""
        if self._agent is not None:
            return self._agent

        try:
            from langgraph.prebuilt import create_react_agent
        except ImportError:
            raise ImportError("langgraph 未安装，请执行: pip install langgraph")

        # 将 BaseTool 转换为 LangChain 工具
        langchain_tools = []
        for tool in self.tools:
            lc_tool = ToolRegistry._convert_single_tool(tool)
            if lc_tool:
                langchain_tools.append(lc_tool)

        self._agent = create_react_agent(
            model=self.llm,
            tools=langchain_tools,
            prompt=INSPECT_SYSTEM_PROMPT,
        )
        return self._agent

    async def run(self, task: str) -> dict:
        """执行巡检任务

        Args:
            task: 巡检任务描述，如 "巡检服务器 192.168.1.10"

        Returns:
            包含巡检结果的字典
        """
        logger.info(f"开始巡检任务: {task}")
        agent = self._get_agent()

        try:
            result = await agent.ainvoke(
                {"messages": [HumanMessage(content=task)]}
            )
            final_message = result["messages"][-1].content
            tool_calls = self._extract_tool_calls(result["messages"])

            logger.info(f"巡检完成，工具调用次数: {len(tool_calls)}")
            return {
                "agent": "inspect",
                "task": task,
                "result": final_message,
                "tool_calls": tool_calls,
            }
        except Exception as e:
            logger.error(f"巡检任务失败: {e}")
            return {
                "agent": "inspect",
                "task": task,
                "result": f"巡检失败: {type(e).__name__}: {e}",
                "tool_calls": [],
                "error": str(e),
            }

    def _extract_tool_calls(self, messages) -> list:
        """提取 Agent 执行过程中的工具调用记录"""
        calls = []
        for msg in messages:
            if hasattr(msg, 'tool_calls') and msg.tool_calls:
                for tc in msg.tool_calls:
                    calls.append({
                        "tool": tc.get('name', 'unknown'),
                        "args": tc.get('args', {}),
                    })
        return calls
