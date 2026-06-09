# 运维 Agent (Ops Agent)

基于 LLM 的智能运维 Agent，实现服务器/数据库巡检、故障自动诊断、日志分析、简单问题自愈处理。

## 架构设计

```
用户/定时任务/API
       |
  Master Agent (任务理解、分解、调度)
       |
  ┌────┼────────┬────────┐
  |    |        |        |
巡检  诊断    日志     自愈
Agent Agent  Agent   Agent
  |    |        |        |
  └────┴────────┴────────┘
       |
  Tool Layer (标准化工具接口)
       |
  SSH / DB / System / Notify
```

## 功能特性

- **服务器巡检**：CPU、内存、磁盘、网络指标采集，关键服务状态检查
- **数据库巡检**：MySQL/PostgreSQL 连接数、慢查询、主从状态；Redis 内存、命中率
- **故障诊断**：基于 LLM 的多维度关联分析（指标 + 日志 + 知识库）
- **日志分析**：远程日志获取、错误模式识别、异常频率统计、时间分布分析
- **自愈处理**：预定义规则驱动的安全自愈（重启服务、清理磁盘等）
- **智能调度**：巡检异常→自动诊断→需要时自愈的完整链路
- **定时任务**：可配置的 cron 定时巡检和日志分析
- **告警通知**：企业微信/钉钉 Webhook 告警

## 技术栈

| 组件 | 选型 |
|------|------|
| Agent 框架 | LangGraph + LangChain |
| LLM | ChatOpenAI（兼容 OpenAI/Qwen/DeepSeek/vLLM） |
| SSH | Paramiko（连接池） |
| 数据库 | SQLAlchemy + redis-py |
| 调度 | APScheduler 3.10.x |
| 配置 | PyYAML + Pydantic |
| 通知 | httpx + tenacity |

## 快速开始

### 1. 环境准备

```bash
# Python 3.11+
python --version

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置

复制并编辑配置文件：

```bash
# 编辑主配置
vim config/config.yaml

# 编辑服务器列表
vim config/servers.yaml

# 编辑自愈规则
vim config/rules.yaml
```

#### 环境变量

```bash
# LLM 配置（必填）
export OPENAI_API_KEY="your-api-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 或本地模型地址

# SSH 配置
export SSH_PRIVATE_KEY_PATH="/path/to/private/key"

# 数据库配置
export MYSQL_PASSWORD="your-mysql-password"
export PG_PASSWORD="your-pg-password"
export REDIS_PASSWORD="your-redis-password"

# 通知配置（可选）
export WECOM_WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx"
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/robot/send?access_token=xxx"
```

### 3. 启动

```bash
# CLI 交互模式
python -m src.main

# 守护进程模式（定时任务）
python -m src.main --mode daemon

# 单次执行任务
python -m src.main --task "巡检所有服务器"
python -m src.main --task "诊断 192.168.1.10 的 CPU 异常"
python -m src.main --task "分析 nginx 错误日志"
```

## 配置说明

### config.yaml - 主配置

```yaml
llm:
  provider: "openai"           # openai / qwen / deepseek
  api_key: "${OPENAI_API_KEY}"
  base_url: "${OPENAI_BASE_URL}"
  model: "gpt-4"
  temperature: 0.1
  max_tokens: 4096

notify:
  wecom_webhook: "${WECOM_WEBHOOK}"
  dingtalk_webhook: "${DINGTALK_WEBHOOK}"

log_level: "INFO"

schedule:
  inspection:
    cron: "0 */6 * * *"       # 每6小时巡检
    enabled: true
  log_analysis:
    cron: "0 */2 * * *"       # 每2小时分析日志
    enabled: true
```

### servers.yaml - 服务器配置

```yaml
servers:
  - name: "web-server-01"
    host: "192.168.1.10"
    port: 22
    username: "ops"
    private_key_path: "${SSH_PRIVATE_KEY_PATH}"
    tags: ["web", "production"]
    databases:
      - type: "mysql"
        host: "127.0.0.1"
        port: 3306
        username: "monitor"
        password: "${MYSQL_PASSWORD}"
        name: "app_db"
```

### rules.yaml - 自愈规则

```yaml
heal_rules:
  - name: "restart_nginx"
    condition: "nginx_status == 'stopped'"
    actions:
      - tool: "service_control"
        params:
          service_name: "nginx"
          action: "restart"
        confirm_required: false    # 低风险，自动执行
    description: "Nginx 停止时自动重启"

  - name: "clean_disk"
    condition: "disk_usage_percent > 90"
    actions:
      - tool: "ssh_execute"
        params:
          command: "sudo apt-get clean"
        confirm_required: true     # 高风险，需确认
    description: "磁盘使用率超过90%时清理"
```

## CLI 命令

在交互模式中可使用以下命令：

| 命令 | 说明 |
|------|------|
| `help` | 显示帮助信息 |
| `tools` | 查看已注册的工具 |
| `servers` | 查看已配置的服务器 |
| `jobs` | 查看定时任务 |
| `quit` | 退出程序 |

## 任务示例

```
🤖 > 巡检服务器 192.168.1.10
🤖 > 对所有服务器进行完整巡检
🤖 > 诊断数据库连接异常
🤖 > 分析 192.168.1.10 的 nginx 错误日志
🤖 > 检查 Redis 内存使用情况
🤖 > MySQL 慢查询数量异常，请诊断原因
```

## 开发指南

### 添加新工具

1. 在 `src/tools/` 下创建新文件
2. 继承 `BaseTool`，实现 `execute()` 方法
3. 在 `src/tools/__init__.py` 中注册

```python
from .base import BaseTool, ToolResult, ToolParameter

class MyTool(BaseTool):
    name = "my_tool"
    description = "我的工具"
    parameters = [
        ToolParameter(name="param1", type="string", description="参数1"),
    ]

    def execute(self, **kwargs) -> ToolResult:
        # 实现工具逻辑
        return ToolResult(success=True, data={"result": "ok"})
```

### 添加新 Agent

1. 在 `src/agent/` 下创建新文件
2. 使用 `create_react_agent` 创建 ReAct Agent
3. 在 `MasterAgent` 中注册并添加路由

### 扩展知识库

在 `knowledge/` 目录下添加 YAML 文件：

```yaml
entries:
  - category: network
    symptom: DNS 解析失败
    possible_causes:
      - DNS 服务器故障
      - 网络配置错误
    diagnosis_steps:
      - nslookup 测试
      - 检查 /etc/resolv.conf
    solutions:
      - 更换 DNS 服务器
      - 修复网络配置
    severity: high
```

## 项目结构

```
ops-agent/
├── config/          # 配置文件
├── src/
│   ├── agent/       # Agent 实现
│   ├── tools/       # 工具层
│   ├── models/      # LLM 和 Prompt
│   ├── knowledge/   # 知识库
│   ├── utils/       # 工具函数
│   ├── main.py      # 入口
│   └── scheduler.py # 调度器
├── knowledge/       # 知识库数据
├── tests/           # 测试
├── requirements.txt
└── README.md
```

## 安全说明

- 数据库工具仅允许只读查询（SELECT/SHOW/DESCRIBE/EXPLAIN）
- 自愈操作严格遵循预定义规则，高风险操作需确认
- 敏感信息通过环境变量注入，不硬编码
- SSH 优先使用密钥认证
- 所有操作记录审计日志

## License

MIT
