"""诊断 Agent - 故障自动诊断"""

import logging

from langchain_core.messages import HumanMessage

from ..models.llm_factory import LLMFactory
from ..models.prompts import DIAGNOSE_SYSTEM_PROMPT
from ..tools.base import ToolRegistry
from ..knowledge.knowledge_base import KnowledgeBase
from ..utils.logger import get_logger

logger = get_logger("diagnose_agent", agent_name="diagnose")


class DiagnoseAgent:
    """诊断 Agent - 负责分析故障原因并给出处理建议"""

    def __init__(self, config):
        self.config = config
        self.llm = LLMFactory.create_for_agent(config, "diagnose")
        self.knowledge_base = KnowledgeBase()

        # 诊断 Agent 需要所有信息收集工具
        tool_names = [
            "system_metrics", "db_status", "redis_info",
            "log_fetch", "log_analyze", "ssh_execute"
        ]
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

        # 增强的系统 Prompt（包含知识库检索指令和诊断报告格式）
        enhanced_prompt = DIAGNOSE_SYSTEM_PROMPT + """

## 知识库辅助
在诊断时，你可以参考运维知识库中的历史经验。
当你发现异常症状时，先思考可能的原因，然后使用工具验证。

## 诊断报告格式
请按以下 JSON 格式输出诊断结果：
```json
{
  "summary": "一句话总结故障",
  "symptoms": ["现象1", "现象2"],
  "root_cause": "根因分析",
  "impact": "影响范围",
  "severity": "critical|high|medium|low",
  "recommendations": ["建议1", "建议2"],
  "need_heal": true/false,
  "heal_actions": ["建议的自愈操作"]
}
```
"""
        self._agent = create_react_agent(
            model=self.llm,
            tools=langchain_tools,
            prompt=enhanced_prompt,
        )
        return self._agent

    async def run(self, task: str, context: str = None) -> dict:
        """执行诊断任务

        Args:
            task: 诊断任务描述
            context: 上下文信息（如巡检结果）

        Returns:
            包含诊断结果的字典
        """
        logger.info(f"开始诊断任务: {task}")
        agent = self._get_agent()

        try:
            # 构建完整的任务描述
            full_task = task
            if context:
                full_task = f"{task}\n\n## 已知信息\n{context}"

            # 查询知识库获取相关知识
            kb_context = self.knowledge_base.get_context_for_agent(task)
            if kb_context and "未找到" not in kb_context:
                full_task += f"\n\n## 参考知识\n{kb_context}"

            result = await agent.ainvoke(
                {"messages": [HumanMessage(content=full_task)]}
            )
            final_message = result["messages"][-1].content
            tool_calls = self._extract_tool_calls(result["messages"])

            logger.info(f"诊断完成，工具调用次数: {len(tool_calls)}")
            return {
                "agent": "diagnose",
                "task": task,
                "result": final_message,
                "tool_calls": tool_calls,
            }
        except Exception as e:
            logger.error(f"诊断任务失败: {e}")
            return {
                "agent": "diagnose",
                "task": task,
                "result": f"诊断失败: {type(e).__name__}: {e}",
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
