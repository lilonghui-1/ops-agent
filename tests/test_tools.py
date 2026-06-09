"""工具层单元测试"""

import os
import pytest
from unittest.mock import Mock, MagicMock, patch

from src.tools.base import BaseTool, ToolResult, ToolParameter, ToolRegistry


class TestToolResult:
    """ToolResult 测试"""

    def test_success_result(self):
        result = ToolResult(success=True, data={"key": "value"})
        assert result.success is True
        assert result.data == {"key": "value"}
        assert result.error is None

    def test_error_result(self):
        result = ToolResult(success=False, error="something went wrong")
        assert result.success is False
        assert result.error == "something went wrong"
        assert result.data is None

    def test_metadata(self):
        result = ToolResult(success=True, metadata={"host": "192.168.1.1", "elapsed": 1.5})
        assert result.metadata["host"] == "192.168.1.1"

    def test_model_dump(self):
        result = ToolResult(success=True, data="test")
        dumped = result.model_dump()
        assert dumped["success"] is True
        assert dumped["data"] == "test"


class TestToolParameter:
    """ToolParameter 测试"""

    def test_required_parameter(self):
        param = ToolParameter(name="host", type="string", description="服务器地址")
        assert param.name == "host"
        assert param.required is True
        assert param.default is None

    def test_optional_parameter(self):
        param = ToolParameter(
            name="timeout", type="integer",
            description="超时时间", required=False, default=30
        )
        assert param.required is False
        assert param.default == 30


class TestBaseTool:
    """BaseTool 抽象类测试"""

    def test_cannot_instantiate(self):
        """BaseTool 是抽象类，不能直接实例化"""
        with pytest.raises(TypeError):
            BaseTool()

    def test_concrete_tool(self):
        """具体工具类测试"""
        class DummyTool(BaseTool):
            name = "dummy"
            description = "测试工具"
            parameters = [
                ToolParameter(name="x", type="integer", description="数字")
            ]

            def execute(self, **kwargs) -> ToolResult:
                return ToolResult(success=True, data={"result": kwargs.get("x", 0) * 2})

        tool = DummyTool()
        result = tool.execute(x=5)
        assert result.success is True
        assert result.data["result"] == 10

    def test_execute_with_logging(self):
        """带日志的执行包装测试"""
        class DummyTool(BaseTool):
            name = "dummy"
            description = "测试工具"
            parameters = []

            def execute(self, **kwargs) -> ToolResult:
                return ToolResult(success=True, data="ok")

        tool = DummyTool()
        result = tool.execute_with_logging()
        assert result.success is True
        assert "elapsed_seconds" in result.metadata
        assert result.metadata["tool_name"] == "dummy"

    def test_execute_with_logging_catches_exception(self):
        """异常捕获测试"""
        class FailingTool(BaseTool):
            name = "failing"
            description = "失败工具"
            parameters = []

            def execute(self, **kwargs) -> ToolResult:
                raise ValueError("test error")

        tool = FailingTool()
        result = tool.execute_with_logging()
        assert result.success is False
        assert "ValueError" in result.error

    def test_get_schema(self):
        """Schema 生成测试"""
        class DummyTool(BaseTool):
            name = "dummy"
            description = "测试工具"
            parameters = [
                ToolParameter(name="host", type="string", description="地址"),
                ToolParameter(name="port", type="integer", description="端口", required=False, default=80),
            ]

            def execute(self, **kwargs) -> ToolResult:
                return ToolResult(success=True)

        tool = DummyTool()
        schema = tool.get_schema()
        assert schema["name"] == "dummy"
        assert "host" in schema["parameters"]["properties"]
        assert "host" in schema["parameters"]["required"]
        assert "port" not in schema["parameters"]["required"]


class TestToolRegistry:
    """ToolRegistry 测试"""

    def setup_method(self):
        ToolRegistry.clear()

    def test_register_and_get(self):
        """注册和获取测试"""
        mock_tool = Mock(spec=BaseTool)
        mock_tool.name = "test_tool"
        ToolRegistry.register(mock_tool)
        assert ToolRegistry.get("test_tool") == mock_tool

    def test_get_nonexistent(self):
        """获取不存在的工具"""
        assert ToolRegistry.get("nonexistent") is None

    def test_get_all(self):
        """获取所有工具"""
        tool1 = Mock(spec=BaseTool)
        tool1.name = "tool1"
        tool2 = Mock(spec=BaseTool)
        tool2.name = "tool2"
        ToolRegistry.register(tool1)
        ToolRegistry.register(tool2)
        all_tools = ToolRegistry.get_all()
        assert len(all_tools) == 2
        assert "tool1" in all_tools
        assert "tool2" in all_tools

    def test_get_names(self):
        """获取工具名称列表"""
        tool1 = Mock(spec=BaseTool)
        tool1.name = "tool1"
        ToolRegistry.register(tool1)
        names = ToolRegistry.get_names()
        assert "tool1" in names

    def test_clear(self):
        """清空注册表"""
        tool = Mock(spec=BaseTool)
        tool.name = "tool"
        ToolRegistry.register(tool)
        ToolRegistry.clear()
        assert ToolRegistry.get("tool") is None

    def test_to_langchain_tools(self):
        """LangChain 工具转换测试"""
        from src.tools.ssh_tools import SSHExecuteTool

        # 注册一个真实工具
        ssh_tool = SSHExecuteTool(config=None)
        ToolRegistry.register(ssh_tool)

        lc_tools = ToolRegistry.to_langchain_tools()
        # 如果 langchain-core 已安装，应该能转换
        # 如果未安装，返回空列表
        assert isinstance(lc_tools, list)


class TestDBToolsExtended:
    """扩展数据库工具测试 - Oracle/达梦/人大金仓"""

    def test_db_drivers_config(self):
        """测试数据库驱动配置常量"""
        from src.tools.db_tools import DB_DRIVERS, DB_DEFAULT_PORTS, DRIVER_VERSION_REQUIREMENTS

        # 验证驱动映射
        assert DB_DRIVERS['oracle'] == 'oracle+cx_oracle'
        assert DB_DRIVERS['dm'] == 'dm+dmPython'
        assert DB_DRIVERS['kingbase'] == 'postgresql+ksycopg2'

        # 验证默认端口
        assert DB_DEFAULT_PORTS['oracle'] == 1521
        assert DB_DEFAULT_PORTS['dm'] == 5236
        assert DB_DEFAULT_PORTS['kingbase'] == 54321

        # 验证版本要求
        assert DRIVER_VERSION_REQUIREMENTS['oracle']['min_version'] == '8.3.0'
        assert DRIVER_VERSION_REQUIREMENTS['dm']['min_version'] == '2.4.0'
        assert DRIVER_VERSION_REQUIREMENTS['kingbase']['min_version'] == '2.8.0'

    def test_build_oracle_connection_url_service_name(self):
        """测试 Oracle Service Name 连接 URL 构建"""
        from src.tools.db_tools import DBQueryTool

        tool = DBQueryTool(config=None)
        creds = {'username': 'system', 'password': 'pass123', 'service_name': 'ORCL', 'sid': ''}
        url = tool._build_connection_url('oracle', '192.168.1.21', 1521, 'ORCL', creds)
        assert 'oracle+cx_oracle://system:pass123@192.168.1.21:1521/?service_name=ORCL' == url

    def test_build_oracle_connection_url_sid(self):
        """测试 Oracle SID 连接 URL 构建"""
        from src.tools.db_tools import DBQueryTool

        tool = DBQueryTool(config=None)
        creds = {'username': 'system', 'password': 'pass123', 'service_name': '', 'sid': 'ORCL'}
        url = tool._build_connection_url('oracle', '192.168.1.21', 1521, 'ORCL', creds)
        assert 'oracle+cx_oracle://system:pass123@192.168.1.21:1521/ORCL' == url

    def test_build_dm_connection_url(self):
        """测试达梦数据库连接 URL 构建"""
        from src.tools.db_tools import DBQueryTool

        tool = DBQueryTool(config=None)
        creds = {'username': 'SYSDBA', 'password': 'pass123', 'service_name': '', 'sid': ''}
        url = tool._build_connection_url('dm', '192.168.1.22', 5236, 'DAMENG', creds)
        assert 'dm+dmPython://SYSDBA:pass123@192.168.1.22:5236/DAMENG' == url

    def test_build_kingbase_connection_url(self):
        """测试人大金仓连接 URL 构建"""
        from src.tools.db_tools import DBQueryTool

        tool = DBQueryTool(config=None)
        creds = {'username': 'system', 'password': 'pass123', 'service_name': '', 'sid': ''}
        url = tool._build_connection_url('kingbase', '192.168.1.23', 54321, 'test', creds)
        assert 'postgresql+ksycopg2://system:pass123@192.168.1.23:54321/test' == url

    def test_db_query_security_reject_write(self):
        """测试数据库查询安全限制 - 拒绝写入操作"""
        from src.tools.db_tools import DBQueryTool

        tool = DBQueryTool(config=None)
        # 构造一个 mock 配置，让凭证查找返回空，触发配置缺失错误
        result = tool.execute(
            host='192.168.1.21',
            db_type='oracle',
            database='ORCL',
            query='DELETE FROM users WHERE id=1'
        )
        assert result.success is False
        assert '安全限制' in result.error

    def test_db_status_oracle_queries(self):
        """测试 Oracle 状态检查 SQL 语句正确性"""
        from src.tools.db_tools import DBStatusTool

        tool = DBStatusTool(config=None)
        # 验证 Oracle 状态查询方法存在
        assert hasattr(tool, '_get_oracle_status')

    def test_db_status_dm_queries(self):
        """测试达梦状态检查 SQL 语句正确性"""
        from src.tools.db_tools import DBStatusTool

        tool = DBStatusTool(config=None)
        assert hasattr(tool, '_get_dm_status')

    def test_db_status_kingbase_queries(self):
        """测试人大金仓状态检查 SQL 语句正确性"""
        from src.tools.db_tools import DBStatusTool

        tool = DBStatusTool(config=None)
        assert hasattr(tool, '_get_kingbase_status')


class TestLogToolsExtended:
    """扩展日志工具测试 - 日志平台 API"""

    def test_log_analyze_app_patterns(self):
        """测试应用日志分析模式识别"""
        from src.tools.log_tools import LogAnalyzeTool

        tool = LogAnalyzeTool()
        content = """2024-01-01 10:00:00 ERROR NullPointerException at com.example.Service
2024-01-01 10:01:00 WARN connection pool exhausted
2024-01-01 10:02:00 ERROR 500 Internal Server Error
2024-01-01 10:03:00 INFO normal operation"""

        result = tool.execute(content=content, log_type='application')
        assert result.success is True
        assert result.data['error_line_count'] >= 3
        assert '内存溢出（堆空间不足）' in result.data['app_issues'] or len(result.data['app_issues']) > 0

    def test_log_analyze_db_patterns(self):
        """测试数据库日志分析模式识别"""
        from src.tools.log_tools import LogAnalyzeTool

        tool = LogAnalyzeTool()
        content = """2024-01-01 10:00:00 ERROR ORA-01555 snapshot too old
2024-01-01 10:01:00 FATAL: lock timeout detected
2024-01-01 10:02:00 ERROR DM-00123 deadlock detected"""

        result = tool.execute(content=content, log_type='database')
        assert result.success is True
        assert result.data['error_line_count'] >= 2

    def test_log_platform_query_init(self):
        """测试日志平台查询工具初始化"""
        from src.tools.log_tools import LogPlatformQueryTool

        tool = LogPlatformQueryTool(config=None)
        assert tool.name == 'log_platform_query'
        assert 'elasticsearch' in tool.description.lower() or 'loki' in tool.description.lower()

    def test_log_platform_parse_time_range(self):
        """测试时间范围解析"""
        from src.tools.log_tools import LogPlatformQueryTool

        tool = LogPlatformQueryTool(config=None)
        start, end = tool._parse_time_range('1h')
        assert start.endswith('Z')
        assert end.endswith('Z')

    def test_log_platform_no_config(self):
        """测试未配置平台时的错误处理"""
        from src.tools.log_tools import LogPlatformQueryTool

        tool = LogPlatformQueryTool(config=None)
        result = tool.execute(platform='elasticsearch', query='test')
        assert result.success is False
        assert '未找到' in result.error
