const fs = require('fs');

// ===== CSS 主题 =====
const css = `
:root {
  --bg: #ffffff; --bg2: #f8f9fa; --ink: #212529;
  --muted: #6c757d; --rule: #dee2e6; --accent: #0d6efd;
  --accent2: #198754; --warning: #ffc107; --danger: #dc3545;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Microsoft YaHei", sans-serif;
  --font-mono: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
}
[data-theme="dark"] {
  --bg: #1a1a2e; --bg2: #16213e; --ink: #e94560;
  --muted: #a0a0a0; --rule: #0f3460; --accent: #e94560;
}

* { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--font-sans);
  font-size: 15px; line-height: 1.7;
  color: var(--ink); background: var(--bg);
  margin: 0; padding: 0;
}

/* Layout */
.container { max-width: 960px; margin: 0 auto; padding: 2rem; }
.toc { position: fixed; left: 0; top: 0; width: 260px; height: 100vh;
  background: var(--bg2); border-right: 1px solid var(--rule);
  overflow-y: auto; padding: 1rem; z-index: 100; }
.toc h3 { font-size: 14px; margin: 0 0 0.75rem; color: var(--muted); text-transform: uppercase; }
.toc a { display: block; padding: 4px 8px; color: var(--ink); text-decoration: none;
  font-size: 13px; border-radius: 4px; }
.toc a:hover { background: var(--rule); }
.toc a.l1 { font-weight: 600; margin-top: 8px; }
.toc a.l2 { padding-left: 16px; color: var(--muted); }
.main { margin-left: 260px; }

/* Header */
.header { text-align: center; padding: 4rem 2rem; background: linear-gradient(135deg, var(--accent), #6610f2);
  color: white; margin-bottom: 2rem; }
.header h1 { font-size: 2.5rem; margin: 0; font-weight: 700; }
.header p { font-size: 1.1rem; opacity: 0.9; margin: 0.5rem 0 0; }

/* Typography */
h1 { font-size: 1.8rem; margin: 2.5rem 0 1rem; padding-bottom: 0.5rem;
  border-bottom: 3px solid var(--accent); }
h2 { font-size: 1.4rem; margin: 2rem 0 0.75rem; color: var(--accent); }
h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
p { margin: 0.75rem 0; }

/* Code */
pre {
  background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 8px;
  overflow-x: auto; font-family: var(--font-mono); font-size: 13px; line-height: 1.5;
}
code {
  background: var(--bg2); padding: 2px 6px; border-radius: 4px;
  font-family: var(--font-mono); font-size: 13px; color: var(--danger);
}
pre code { background: none; padding: 0; color: inherit; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 13px; }
th { background: #e8f4fd; padding: 10px; text-align: left; font-weight: 600;
  border: 1px solid var(--rule); }
td { padding: 10px; border: 1px solid var(--rule); vertical-align: top; }
tr:nth-child(even) { background: var(--bg2); }

/* Alerts */
.alert { padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid; }
.alert-info { background: #d1ecf1; border-color: #0c5460; }
.alert-warning { background: #fff3cd; border-color: #856404; }

/* Lists */
ul, ol { margin: 0.5rem 0; padding-left: 1.5rem; }
li { margin: 0.25rem 0; }

/* Responsive */
@media (max-width: 1024px) {
  .toc { display: none; }
  .main { margin-left: 0; }
}
@media (max-width: 600px) {
  .container { padding: 1rem; }
  table { display: block; overflow-x: auto; }
}
`;

// ===== 内容数据 =====
const sections = [];

function addSection(id, title, level, html) {
  sections.push({ id, title, level, html });
}

// Part 1
addSection("part1", "第一部分 概述与测试环境", 1, `
<h1 id="part1">第一部分 概述与测试环境</h1>

<h2 id="ch1">第1章 文档说明</h2>
<h3>1.1 文档目的与适用范围</h3>
<p>本文档是 ops-agent 智能运维 Agent 的测试说明手册，覆盖以下两大测试领域：</p>
<ul>
<li><strong>Grafana Loki + Promtail 日志平台测试</strong>：安装验证、配置检查、日志收集测试、LogQL 查询测试</li>
<li><strong>ops-agent 全功能测试</strong>：数据库巡检（MySQL/PostgreSQL/Oracle/达梦/人大金仓/Redis）、SSH 连接、系统指标采集、日志分析、自愈规则、LLM 集成、Agent 协作、定时调度</li>
</ul>
<p>适用对象：运维工程师、测试工程师、DevOps 团队。</p>

<h3>1.2 术语与缩略语</h3>
<table>
<tr><th>术语</th><th>说明</th></tr>
<tr><td>ops-agent</td><td>基于 LLM 的智能运维 Agent</td></tr>
<tr><td>Loki</td><td>Grafana 开源的轻量级日志聚合系统</td></tr>
<tr><td>Promtail</td><td>Loki 的日志采集代理</td></tr>
<tr><td>LogQL</td><td>Loki 的查询语言，类似 PromQL</td></tr>
<tr><td>LLM</td><td>大语言模型（如 GPT-4/通义千问/DeepSeek）</td></tr>
<tr><td>P0/P1/P2</td><td>测试用例优先级：P0=核心必测, P1=重要, P2=一般</td></tr>
</table>

<h3>1.3 测试环境要求</h3>
<table>
<tr><th>项目</th><th>要求</th></tr>
<tr><td>操作系统</td><td>Linux (Ubuntu 20.04+/CentOS 7+) 或 macOS</td></tr>
<tr><td>Python</td><td>3.11+（推荐 3.11 或 3.12）</td></tr>
<tr><td>Node.js</td><td>>= 18（用于 docx-js 生成脚本）</td></tr>
<tr><td>内存</td><td>最低 2GB，推荐 4GB+</td></tr>
<tr><td>网络</td><td>可访问目标服务器 SSH 端口和 LLM API</td></tr>
</table>

<h3>1.4 测试前置条件</h3>
<p>执行测试前需确保以下环境变量和配置已就绪：</p>
<pre><code># LLM API
export OPENAI_API_KEY="sk-xxxxxxxx"
export OPENAI_BASE_URL="https://api.openai.com/v1"

# SSH 认证
export SSH_PRIVATE_KEY_PATH="/home/ops/.ssh/id_rsa"

# 数据库密码
export MYSQL_PASSWORD="xxx"
export PG_PASSWORD="xxx"
export REDIS_PASSWORD="xxx"
export ORACLE_PASSWORD="xxx"
export DM_PASSWORD="xxx"
export KINGBASE_PASSWORD="xxx"

# Windows 服务器密码
export WIN_SERVER_PASSWORD="xxx"

# 日志平台
export ES_URL="http://192.168.1.50:9200"
export LOKI_URL="http://192.168.1.51:3100"

# 通知渠道
export WECOM_WEBHOOK="https://qyapi.weixin.qq.com/..."
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/..."</code></pre>

<h2 id="ch2">第2章 测试环境搭建</h2>
<h3>2.1 项目安装</h3>
<pre><code>cd /workspace/ops-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 按需安装国产数据库驱动
pip install oracledb>=2.0.0      # Oracle（纯 Python，无需客户端）
pip install dmPython>=2.4.0      # 达梦（需从官网下载 whl）
pip install ksycopg2>=2.8.0      # 人大金仓</code></pre>

<h3>2.2 配置文件准备</h3>
<p>确认以下配置文件已按实际环境修改：</p>
<ul>
<li><code>config/config.yaml</code>：LLM、通知渠道、日志平台、调度配置</li>
<li><code>config/servers.yaml</code>：目标服务器和数据库连接信息</li>
<li><code>config/rules.yaml</code>：自愈规则配置</li>
</ul>

<h3>2.3 运行单元测试验证环境</h3>
<pre><code>python -m pytest tests/ -v --tb=short</code></pre>
<div class="alert alert-info">所有 40 个测试应全部通过，方可进入后续功能测试。</div>
`);

// Part 2: Loki + Promtail
addSection("part2", "第二部分 Grafana Loki + Promtail 测试指南", 1, `
<h1 id="part2">第二部分 Grafana Loki + Promtail 测试指南</h1>

<h2 id="ch3">第3章 安装验证</h2>
<h3>3.1 Loki 安装验证</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-001</td><td>服务状态检查</td><td><code>docker ps | grep loki</code></td><td>容器状态为 Up</td></tr>
<tr><td>TC-LOKI-002</td><td>HTTP 就绪探测</td><td><code>curl http://localhost:3100/ready</code></td><td>返回 ready</td></tr>
<tr><td>TC-LOKI-003</td><td>构建信息查询</td><td><code>curl http://localhost:3100/loki/api/v1/status/buildinfo | jq</code></td><td>返回版本、revision、branch</td></tr>
</table>

<pre><code># Loki 就绪检查
curl -s http://localhost:3100/ready

# 构建信息
curl -s http://localhost:3100/loki/api/v1/status/buildinfo | jq .</code></pre>

<h3>3.2 Promtail 安装验证</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-004</td><td>服务状态检查</td><td><code>docker ps | grep promtail</code></td><td>容器状态为 Up</td></tr>
<tr><td>TC-LOKI-005</td><td>配置校验</td><td><code>promtail -config.file=/etc/promtail/config.yml -dry-run</code></td><td>无配置错误输出</td></tr>
<tr><td>TC-LOKI-006</td><td>日志查看</td><td><code>docker logs promtail | tail -20</code></td><td>无 ERROR/FATAL 级别日志</td></tr>
</table>

<h2 id="ch4">第4章 配置验证</h2>
<h3>4.1 Promtail 配置文件结构检查</h3>
<p>验证 <code>/etc/promtail/config.yml</code> 包含以下必要配置段：</p>
<pre><code>server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: system
    static_configs:
      - targets: [localhost]
        labels:
          job: system
          __path__: /var/log/*.log</code></pre>

<h3>4.2 配置热重载测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-009</td><td>配置热重载</td><td>1. 修改 promtail-config.yml<br>2. 执行 <code>killall -HUP promtail</code></td><td>Promtail 无异常重启，新 target 生效</td></tr>
</table>

<h3>4.3 Label 规范性检查</h3>
<table>
<tr><th>Label</th><th>必填</th><th>说明</th><th>示例</th></tr>
<tr><td>job</td><td>是</td><td>采集任务名称</td><td>nginx, app, system</td></tr>
<tr><td>app</td><td>推荐</td><td>应用名称</td><td>ops-agent, myapp</td></tr>
<tr><td>level</td><td>推荐</td><td>日志级别</td><td>ERROR, WARN, INFO, DEBUG</td></tr>
<tr><td>host</td><td>推荐</td><td>主机名</td><td>web-server-01</td></tr>
</table>

<h2 id="ch5">第5章 日志收集测试</h2>
<h3>5.1 单文件推送测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-010</td><td>单文件日志收集</td><td>1. 生成测试日志<br>2. 等待 30 秒<br>3. 查询 Loki</td><td>在 Grafana 或 curl 查询中可见该条日志</td></tr>
</table>
<pre><code># 生成测试日志
echo "$(date '+%Y-%m-%d %H:%M:%S') TEST_ENTRY promtail_log_delivery_ok" >> /var/log/test-app.log

# 查询验证（30秒后执行）
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="test"} |= "TEST_ENTRY"' \
  --data-urlencode "limit=10" \
  --data-urlencode "start=$(($(date +%s) - 300))000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq '.data.result[0].values[0]'</code></pre>

<h3>5.2 多 job 并行收集测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-011</td><td>多 job 并行</td><td>同时向 nginx/app/system 三个日志文件写入不同标识，通过 LogQL 分别查询</td><td>每个 job 的日志流独立，label 区分正确</td></tr>
</table>

<h3>5.3 大文件断点续传测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-012</td><td>日志轮转测试</td><td>模拟 logrotate: mv access.log access.log.1 && touch access.log</td><td>offset 正确更新，新文件从 0 开始，无重复/丢失</td></tr>
</table>

<h3>5.4 Windows Event Log 收集测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-013</td><td>Windows 事件日志</td><td>在 Windows 服务器配置 windows_events scrape_config，触发一个系统事件</td><td>Loki 中可查询到该事件，含 Event ID、Channel、Level label</td></tr>
</table>

<h2 id="ch6">第6章 LogQL 查询测试</h2>
<h3>6.1 基础查询语法验证</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>查询示例</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-014</td><td>按 job 过滤</td><td><code>{job="nginx"}</code></td><td>返回所有 nginx 日志</td></tr>
<tr><td>TC-LOKI-015</td><td>多 label 联合过滤</td><td><code>{app="ops-agent",level="ERROR"}</code></td><td>返回 ops-agent 的 ERROR 级别日志</td></tr>
<tr><td>TC-LOKI-016</td><td>行内容过滤</td><td><code>{job="app"} |= "panic"</code></td><td>返回包含 panic 的 app 日志</td></tr>
<tr><td>TC-LOKI-017</td><td>正则匹配</td><td><code>{job="nginx"} |~ "(404|500|502)"</code></td><td>返回匹配状态码的 nginx 日志</td></tr>
</table>

<h3>6.2 聚合查询测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>查询示例</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-018</td><td>按级别统计速率</td><td><code>sum(rate({job="app"}[1m])) by (level)</code></td><td>返回各级别每秒日志条数</td></tr>
<tr><td>TC-LOKI-019</td><td>TOP 10 错误来源</td><td><code>topk(10, sum(rate({job="nginx"} |= "500" [5m])))</code></td><td>返回错误率最高的 10 个来源</td></tr>
</table>

<h3>6.3 时间范围与偏移测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>查询示例</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-020</td><td>1小时范围</td><td><code>[1h]</code></td><td>返回最近1小时数据，查询时间 &lt; 1s</td></tr>
<tr><td>TC-LOKI-021</td><td>24小时范围</td><td><code>[24h]</code></td><td>返回最近24小时数据，查询时间 &lt; 5s</td></tr>
<tr><td>TC-LOKI-022</td><td>偏移查询</td><td><code>offset 1h</code></td><td>返回1小时前的数据</td></tr>
</table>

<h3>6.4 通过 ops-agent LogPlatformQueryTool 查询验证</h3>
<p>在 <code>config.yaml</code> 中配置 log_platforms 的 loki 条目后，通过 ops-agent CLI 执行查询：</p>
<pre><code># config.yaml 配置
log_platforms:
  - name: "loki"
    type: "loki"
    url: "\${LOKI_URL}"  # http://192.168.1.51:3100

# 通过 ops-agent 查询
python -m src.main --task "通过 Loki 查询 nginx 过去1小时的 ERROR 日志"</code></pre>
<table>
<tr><th>编号</th><th>测试项</th><th>验证方法</th><th>预期结果</th></tr>
<tr><td>TC-LOKI-023</td><td>LogPlatformQueryTool 查询</td><td>调用 _query_loki()</td><td>返回结构包含 logs[]、total、platform='loki'</td></tr>
<tr><td>TC-LOKI-024</td><td>时间戳转换</td><td>检查请求参数</td><td>start/end 转换为纳秒级 Unix 时间戳</td></tr>
<tr><td>TC-LOKI-025</td><td>LogQL 构建</td><td>检查 query 参数</td><td>正确构建为 {app='nginx'} |= 'ERROR' 格式</td></tr>
</table>
`);

// Part 3: ops-agent 功能测试
addSection("part3", "第三部分 ops-agent 功能测试指南", 1, `
<h1 id="part3">第三部分 ops-agent 功能测试指南</h1>

<h2 id="ch7">第7章 工具层单元测试</h2>
<h3>7.1 BaseTool 与 ToolRegistry 测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-001</td><td>抽象类不可实例化</td><td><code>pytest tests/test_tools.py::TestBaseTool::test_cannot_instantiate -v</code></td><td>抛出 TypeError</td></tr>
<tr><td>TC-TOOL-002</td><td>工具注册与获取</td><td><code>pytest tests/test_tools.py::TestToolRegistry -v</code></td><td>返回所有工具</td></tr>
<tr><td>TC-TOOL-003</td><td>Schema 生成</td><td><code>pytest tests/test_tools.py::TestToolRegistry::test_to_json_schema -v</code></td><td>返回 JSON Schema 对象</td></tr>
</table>

<h3>7.2 数据库驱动配置常量验证</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-004</td><td>驱动映射</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_db_drivers_config -v</code></td><td>oracle->oracle+oracledb, dm->dm+dmPython, kingbase->postgresql+ksycopg2</td></tr>
<tr><td>TC-TOOL-005</td><td>默认端口</td><td>同上</td><td>oracle=1521, dm=5236, kingbase=54321</td></tr>
<tr><td>TC-TOOL-006</td><td>版本要求</td><td>同上</td><td>oracledb>=2.0.0, dmPython>=2.4.0, ksycopg2>=2.8.0</td></tr>
</table>

<h3>7.3 数据库连接 URL 构建测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-007</td><td>Oracle Service Name</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_build_oracle_connection_url_service_name -v</code></td><td>oracle+oracledb://.../?service_name=ORCL</td></tr>
<tr><td>TC-TOOL-008</td><td>Oracle SID</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_build_oracle_connection_url_sid -v</code></td><td>oracle+oracledb://.../ORCL</td></tr>
<tr><td>TC-TOOL-009</td><td>达梦 URL</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_build_dm_connection_url -v</code></td><td>dm+dmPython://SYSDBA:pass@host:5236/DAMENG</td></tr>
<tr><td>TC-TOOL-010</td><td>人大金仓 URL</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_build_kingbase_connection_url -v</code></td><td>postgresql+ksycopg2://system:pass@host:54321/test</td></tr>
</table>

<h3>7.4 数据库查询安全限制测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-011</td><td>拒绝写入操作</td><td><code>pytest tests/test_tools.py::TestDBToolsExtended::test_db_query_security_reject_write -v</code></td><td>DELETE/UPDATE/INSERT/DROP 被拦截，返回安全限制错误</td></tr>
</table>

<h3>7.5 日志分析工具测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-012</td><td>应用日志分析</td><td><code>pytest tests/test_tools.py::TestLogToolsExtended::test_log_analyze_app_patterns -v</code></td><td>识别 NullPointerException、连接池耗尽、500 错误等</td></tr>
<tr><td>TC-TOOL-013</td><td>数据库日志分析</td><td><code>pytest tests/test_tools.py::TestLogToolsExtended::test_log_analyze_db_patterns -v</code></td><td>识别 ORA-01555、DM-00123、死锁等</td></tr>
</table>

<h3>7.6 日志平台查询工具测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-TOOL-014</td><td>初始化验证</td><td><code>pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_query_init -v</code></td><td>工具名 log_platform_query，支持 ES/Loki</td></tr>
<tr><td>TC-TOOL-015</td><td>时间范围解析</td><td><code>pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_parse_time_range -v</code></td><td>返回 ISO 8601 + Z 格式</td></tr>
<tr><td>TC-TOOL-016</td><td>无配置错误处理</td><td><code>pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_no_config -v</code></td><td>success=False，错误信息包含"未找到"</td></tr>
</table>

<h2 id="ch8">第8章 数据库巡检功能测试</h2>
<h3>8.1 测试前置条件</h3>
<p>确保 <code>config/servers.yaml</code> 中已配置目标数据库，且对应驱动已安装。</p>

<h3>8.2 MySQL 数据库巡检</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-001</td><td>MySQL 状态检查</td><td><code>python -m src.main --task "检查 MySQL 192.168.1.10 的状态"</code></td><td>返回 threads_connected、max_connections、slow_queries、uptime_seconds、replication</td></tr>
<tr><td>TC-DB-002</td><td>MySQL 慢查询</td><td><code>python -m src.main --task "查询 MySQL 慢查询数量"</code></td><td>slow_queries 为整数</td></tr>
<tr><td>TC-DB-003</td><td>MySQL 主从状态</td><td><code>python -m src.main --task "检查 MySQL 主从复制状态"</code></td><td>replication.configured=true/false，如配置则含 Slave_IO_Running 等</td></tr>
</table>

<h3>8.3 PostgreSQL 数据库巡检</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-004</td><td>PG 状态检查</td><td><code>python -m src.main --task "检查 PostgreSQL 连接数"</code></td><td>返回 active_connections、max_connections、connections_by_state、long_running_queries、database_size</td></tr>
</table>

<h3>8.4 Oracle 数据库巡检</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-005</td><td>Oracle 状态检查</td><td><code>python -m src.main --task "检查 Oracle 192.168.1.21 的表空间使用率"</code></td><td>返回 user_sessions、max_processes、active_sessions、database_size_gb、tablespace_usage、top_wait_events</td></tr>
</table>

<h3>8.5 达梦数据库巡检</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-006</td><td>达梦状态检查</td><td><code>python -m src.main --task "检查达梦数据库连接数"</code></td><td>返回 active_sessions、max_sessions、database_size_mb、tablespace_usage、slow_sql_top5</td></tr>
</table>

<h3>8.6 人大金仓数据库巡检</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-007</td><td>人大金仓状态检查</td><td><code>python -m src.main --task "检查人大金仓数据库状态"</code></td><td>返回 active_connections、max_connections、connections_by_state、database_size、long_running_queries</td></tr>
</table>

<h3>8.7 Redis 信息获取测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-008</td><td>Redis 信息</td><td><code>python -m src.main --task "检查 Redis 192.168.1.10 的内存使用情况"</code></td><td>返回 version、uptime_seconds、connected_clients、used_memory_human、maxmemory_human、memory_usage_percent、hit_rate_percent、instantaneous_ops_per_sec</td></tr>
</table>

<h3>8.8 数据库查询安全测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-DB-009</td><td>拒绝写入</td><td><code>python -c "from src.tools.db_tools import DBQueryTool; print(DBQueryTool(None).execute(host='h',db_type='mysql',database='d',query='DELETE FROM t'))"</code></td><td>success=False，错误信息含安全限制</td></tr>
</table>

<h2 id="ch9">第9章 SSH 连接测试</h2>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-SSH-001</td><td>密钥认证</td><td><code>python -m src.main --task "SSH 执行 192.168.1.10 whoami"</code></td><td>返回当前用户名，exit_code=0</td></tr>
<tr><td>TC-SSH-002</td><td>密码认证（Windows）</td><td><code>python -m src.main --task "SSH 执行 win-server-01 whoami"</code></td><td>返回 administrator，exit_code=0</td></tr>
<tr><td>TC-SSH-003</td><td>连接池复用</td><td>连续对同一 host 执行 10 次命令</td><td>连接复用，无重复建立连接</td></tr>
<tr><td>TC-SSH-004</td><td>超时处理</td><td>执行 sleep 60 命令并设置 timeout=5</td><td>超时后返回错误信息</td></tr>
<tr><td>TC-SSH-005</td><td>sudo 权限</td><td><code>python -m src.main --task "SSH 执行 192.168.1.10 systemctl status nginx use_sudo=true"</code></td><td>命令前缀追加 sudo</td></tr>
</table>

<h2 id="ch10">第10章 系统指标采集测试</h2>
<h3>10.1 Linux 系统指标测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-SYS-001</td><td>CPU 指标</td><td><code>python -m src.main --task "采集 192.168.1.10 的 CPU 指标"</code></td><td>返回 Load Average、CPU Usage、CPU Cores、Process Count</td></tr>
<tr><td>TC-SYS-002</td><td>内存指标</td><td><code>python -m src.main --task "采集 192.168.1.10 的内存指标"</code></td><td>返回 free -h 输出、Top Memory Processes</td></tr>
<tr><td>TC-SYS-003</td><td>磁盘指标</td><td><code>python -m src.main --task "采集 192.168.1.10 的磁盘指标"</code></td><td>返回 df -h、Inode Usage、iostat</td></tr>
<tr><td>TC-SYS-004</td><td>网络指标</td><td><code>python -m src.main --task "采集 192.168.1.10 的网络指标"</code></td><td>返回 ss -s、ss -tlnp、ip addr</td></tr>
<tr><td>TC-SYS-005</td><td>全量采集</td><td><code>python -m src.main --task "巡检 192.168.1.10"</code></td><td>返回字典包含 cpu、memory、disk、network</td></tr>
</table>

<h3>10.2 Windows 系统指标测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-SYS-006</td><td>Windows CPU</td><td><code>python -m src.main --task "采集 win-server-01 的 CPU"</code></td><td>返回 LoadPercentage、NumberOfLogicalProcessors</td></tr>
<tr><td>TC-SYS-007</td><td>Windows 内存</td><td><code>python -m src.main --task "采集 win-server-01 的内存"</code></td><td>返回 Total/Used/Free GB 及百分比</td></tr>
<tr><td>TC-SYS-008</td><td>Windows 磁盘</td><td><code>python -m src.main --task "采集 win-server-01 的磁盘"</code></td><td>返回各盘符 Total/Free/Used%</td></tr>
<tr><td>TC-SYS-009</td><td>Windows 网络</td><td><code>python -m src.main --task "采集 win-server-01 的网络"</code></td><td>返回 Get-NetTCPConnection、Get-NetIPAddress</td></tr>
</table>

<h3>10.3 自动 OS 类型识别</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-SYS-010</td><td>自动识别</td><td>1. servers.yaml 中配置 os_type: windows<br>2. 执行 system_metrics 不传入 os_type</td><td>内部通过 _get_os_type() 自动识别为 Windows</td></tr>
</table>

<h2 id="ch11">第11章 日志分析功能测试</h2>
<h3>11.1 远程日志获取测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-LOG-001</td><td>tail 模式</td><td><code>python -m src.main --task "读取 192.168.1.10 /var/log/nginx/error.log 末尾200行"</code></td><td>返回 content、line_count、file_path、mode=tail</td></tr>
<tr><td>TC-LOG-002</td><td>grep 模式</td><td><code>python -m src.main --task "在 192.168.1.10 /var/log/nginx/error.log 中搜索 500|502|503"</code></td><td>返回匹配行</td></tr>
</table>

<h3>11.2 日志平台 API 查询测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-LOG-003</td><td>ES 查询</td><td><code>python -m src.main --task "从 ES 查询 status:500 最近1小时"</code></td><td>返回 logs[] 含 timestamp、message、level、app</td></tr>
<tr><td>TC-LOG-004</td><td>Loki 查询</td><td><code>python -m src.main --task "从 Loki 查询 nginx ERROR 最近6小时"</code></td><td>LogQL 正确构建，返回 logs[]、total</td></tr>
</table>

<h3>11.3 日志内容分析测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-LOG-005</td><td>应用日志分析</td><td><code>python -m src.main --task "分析以下日志: [含 NullPointerException 的日志文本]"</code></td><td>app_issues 包含内存溢出、连接池耗尽、服务端错误</td></tr>
<tr><td>TC-LOG-006</td><td>数据库日志分析</td><td><code>python -m src.main --task "分析数据库日志: [含 ORA-01555 的日志文本]"</code></td><td>error_line_count >= 2，severity 正确评估</td></tr>
</table>

<h2 id="ch12">第12章 自愈规则测试</h2>
<h3>12.1 规则加载验证</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-HEAL-001</td><td>规则加载</td><td><code>python -c "from src.agent.heal_agent import HealAgent; print(len(HealAgent(None)._load_rules()))"</code></td><td>加载 11 条规则</td></tr>
</table>

<h3>12.2 低风险自动执行规则测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-HEAL-002</td><td>Nginx 自动重启</td><td>1. systemctl stop nginx<br>2. 触发巡检<br>3. 观察自愈</td><td>service_control 执行 restart，confirm_required=false 直接执行</td></tr>
<tr><td>TC-HEAL-003</td><td>清理日志</td><td>模拟磁盘使用率 &gt; 85%</td><td>执行 journalctl --vacuum-time=3d</td></tr>
</table>

<h3>12.3 高风险需确认规则测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-HEAL-004</td><td>清理 apt 缓存</td><td>模拟磁盘使用率 &gt; 90%</td><td>Agent 说明风险并要求确认（confirm_required=true）</td></tr>
<tr><td>TC-HEAL-005</td><td>终止长查询</td><td>MySQL 存在长查询</td><td>Agent 要求确认后执行 kill</td></tr>
</table>

<h2 id="ch13">第13章 Agent 协作与 LLM 集成测试</h2>
<h3>13.1 LLM 工厂测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-AGENT-001</td><td>工厂创建</td><td><code>pytest tests/test_agents.py::TestLLMFactory -v</code></td><td>返回 ChatOpenAI 实例</td></tr>
<tr><td>TC-AGENT-002</td><td>base_url 生效</td><td>配置本地模型地址</td><td>请求发往本地地址</td></tr>
</table>

<h3>13.2 Prompt 模板测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-AGENT-003</td><td>Prompt 加载</td><td><code>pytest tests/test_agents.py::TestPrompts -v</code></td><td>5 套系统 Prompt 完整加载</td></tr>
</table>

<h3>13.3 各 Agent 测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-AGENT-004</td><td>巡检 Agent</td><td><code>pytest tests/test_agents.py::TestInspectAgent -v</code></td><td>返回 agent=inspect、result、tool_calls</td></tr>
<tr><td>TC-AGENT-005</td><td>诊断 Agent</td><td><code>pytest tests/test_agents.py::TestDiagnoseAgent -v</code></td><td>知识库上下文注入，返回诊断报告</td></tr>
<tr><td>TC-AGENT-006</td><td>Master Agent</td><td><code>pytest tests/test_agents.py::TestMasterAgent -v</code></td><td>任务路由正确，报告汇总完整</td></tr>
</table>

<h3>13.4 完整协作链路测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-AGENT-007</td><td>完整链路</td><td>1. 输入：巡检所有服务器<br>2. Master → Inspect → （异常）→ Diagnose → （建议自愈）→ Heal</td><td>最终报告包含巡检、诊断、自愈三部分结果</td></tr>
</table>

<h2 id="ch14">第14章 知识库测试</h2>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-KB-001</td><td>YAML 加载</td><td><code>pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_load -v</code></td><td>成功加载 knowledge/ 目录下 YAML</td></tr>
<tr><td>TC-KB-002</td><td>关键词搜索</td><td><code>pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_search -v</code></td><td>搜索 CPU 返回 system 分类结果</td></tr>
<tr><td>TC-KB-003</td><td>分类过滤</td><td><code>pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_search_with_category -v</code></td><td>category=system 仅返回系统相关</td></tr>
<tr><td>TC-KB-004</td><td>Agent 上下文</td><td><code>pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_get_context -v</code></td><td>返回症状、原因、诊断步骤、解决方案</td></tr>
<tr><td>TC-KB-005</td><td>空知识库</td><td><code>pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_empty -v</code></td><td>len(kb.entries) == 0，get_context 返回未找到</td></tr>
</table>

<h2 id="ch15">第15章 定时调度与通知测试</h2>
<h3>15.1 调度器配置测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-SCH-001</td><td>Cron 解析</td><td><code>pytest tests/ -k scheduler -v</code></td><td>0 */6 * * * 正确解析为每6小时</td></tr>
<tr><td>TC-SCH-002</td><td>任务参数</td><td>检查 scheduler.py</td><td>coalesce=True、max_instances=1、misfire_grace_time=300</td></tr>
</table>

<h3>15.2 定时巡检任务测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试步骤</th><th>预期结果</th></tr>
<tr><td>TC-SCH-003</td><td>定时触发</td><td>1. 设置 cron=*/1 * * * *，enabled=true<br>2. 启动 daemon</td><td>日志中每分钟出现巡检任务开始</td></tr>
</table>

<h3>15.3 通知渠道测试</h3>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-SCH-004</td><td>企业微信</td><td>触发告警通知</td><td>Markdown 格式消息发送成功</td></tr>
<tr><td>TC-SCH-005</td><td>钉钉</td><td>触发告警通知</td><td>Markdown 格式消息发送成功</td></tr>
<tr><td>TC-SCH-006</td><td>重试机制</td><td>断开网络后恢复</td><td>tenacity 重试后最终成功</td></tr>
</table>

<h2 id="ch16">第16章 主程序与 CLI 测试</h2>
<table>
<tr><th>编号</th><th>测试项</th><th>测试命令</th><th>预期结果</th></tr>
<tr><td>TC-CLI-001</td><td>CLI 交互</td><td><code>python -m src.main</code></td><td>help、tools、servers、jobs 命令正常输出</td></tr>
<tr><td>TC-CLI-002</td><td>守护进程</td><td><code>python -m src.main --mode daemon</code></td><td>调度器启动，定时任务注册成功</td></tr>
<tr><td>TC-CLI-003</td><td>单次执行</td><td><code>python -m src.main --task "巡检 192.168.1.10"</code></td><td>任务执行后程序正常退出</td></tr>
<tr><td>TC-CLI-004</td><td>信号处理</td><td>启动 daemon 后发送 SIGINT</td><td>优雅关闭：调度器停止、SSH 连接池清空</td></tr>
<tr><td>TC-CLI-005</td><td>配置加载</td><td>检查环境变量替换</td><td>\${OPENAI_API_KEY} 被替换为实际值</td></tr>
</table>
`);

// Appendix
addSection("appendix", "附录", 1, `
<h1 id="appendix">附录</h1>

<h2>附录 A：测试用例总览表</h2>
<table>
<tr><th>章节</th><th>P0</th><th>P1</th><th>P2</th><th>对应源码</th></tr>
<tr><td>第3-6章 Loki/Promtail</td><td>4</td><td>6</td><td>3</td><td>log_tools.py, config.yaml</td></tr>
<tr><td>第7章 工具层</td><td>6</td><td>8</td><td>4</td><td>test_tools.py, base.py</td></tr>
<tr><td>第8章 数据库巡检</td><td>8</td><td>10</td><td>4</td><td>db_tools.py</td></tr>
<tr><td>第9章 SSH</td><td>4</td><td>4</td><td>2</td><td>ssh_tools.py</td></tr>
<tr><td>第10章 系统指标</td><td>4</td><td>4</td><td>2</td><td>system_tools.py</td></tr>
<tr><td>第11章 日志分析</td><td>4</td><td>6</td><td>3</td><td>log_tools.py</td></tr>
<tr><td>第12章 自愈规则</td><td>3</td><td>6</td><td>3</td><td>rules.yaml, heal_agent.py</td></tr>
<tr><td>第13章 Agent/LLM</td><td>5</td><td>6</td><td>3</td><td>test_agents.py, llm_factory.py</td></tr>
<tr><td>第14章 知识库</td><td>2</td><td>3</td><td>2</td><td>test_knowledge_base.py</td></tr>
<tr><td>第15章 调度/通知</td><td>3</td><td>4</td><td>2</td><td>scheduler.py, notify_tools.py</td></tr>
<tr><td>第16章 CLI/主程序</td><td>3</td><td>3</td><td>2</td><td>main.py, config_loader.py</td></tr>
</table>

<h2>附录 B：工具注册清单</h2>
<table>
<tr><th>序号</th><th>工具名</th><th>说明</th></tr>
<tr><td>1</td><td>ssh_execute</td><td>SSH 远程命令执行</td></tr>
<tr><td>2</td><td>db_query</td><td>数据库只读查询（6种数据库）</td></tr>
<tr><td>3</td><td>db_status</td><td>数据库状态检查（6种数据库）</td></tr>
<tr><td>4</td><td>redis_info</td><td>Redis 信息获取</td></tr>
<tr><td>5</td><td>log_fetch</td><td>远程日志文件获取（SSH）</td></tr>
<tr><td>6</td><td>log_platform_query</td><td>日志平台 API 查询（ES/Loki）</td></tr>
<tr><td>7</td><td>log_analyze</td><td>日志内容分析</td></tr>
<tr><td>8</td><td>system_metrics</td><td>系统指标采集（Linux/Windows）</td></tr>
<tr><td>9</td><td>service_control</td><td>服务管理（启动/停止/重启/状态）</td></tr>
<tr><td>10</td><td>send_notification</td><td>通知发送（企微/钉钉）</td></tr>
</table>

<h2>附录 C：Loki + Promtail 测试命令速查</h2>
<pre><code># Loki 就绪检查
curl -s http://localhost:3100/ready

# Loki 构建信息
curl -s http://localhost:3100/loki/api/v1/status/buildinfo | jq

# Promtail 配置校验
promtail -config.file=/etc/promtail/config.yml -dry-run

# 推送测试日志
curl -X POST http://localhost:3100/loki/api/v1/push \
  -H "Content-Type: application/json" \
  -d '{"streams":[{"stream":{"job":"test"},"values":[["'$(date +%s%N)'","manual test log"]]}]}'

# LogQL 查询
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode "query={job=\"nginx\"} |= \"error\"" \
  --data-urlencode "limit=100" \
  --data-urlencode "start=$(($(date +%s) - 3600))000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq

# 查看 label 列表
curl -s "http://localhost:3100/loki/api/v1/label/job/values" | jq</code></pre>

<h2>附录 D：pytest 测试命令速查</h2>
<pre><code># 运行全部测试
python -m pytest tests/ -v --tb=short

# 按模块运行
pytest tests/test_tools.py -v
pytest tests/test_agents.py -v
pytest tests/test_knowledge_base.py -v

# 按测试类运行
pytest tests/test_tools.py::TestBaseTool -v
pytest tests/test_tools.py::TestDBToolsExtended -v
pytest tests/test_tools.py::TestLogToolsExtended -v
pytest tests/test_agents.py::TestMasterAgent -v
pytest tests/test_agents.py::TestInspectAgent -v

# 按关键词过滤
pytest tests/ -k "mysql or redis" -v
pytest tests/ -k "oracle or dm or kingbase" -v
pytest tests/ -k "loki or log_platform" -v</code></pre>
`);

// ===== 构建 HTML =====
function buildTOC() {
    let html = '<div class="toc">';
    html += '<h3>目录</h3>';
    for (const sec of sections) {
        const cls = sec.level === 1 ? 'l1' : 'l2';
        html += `<a href="#${sec.id}" class="${cls}">${sec.title}</a>`;
    }
    html += '</div>';
    return html;
}

function buildMain() {
    let html = '<div class="main">';
    html += '<div class="header">';
    html += '<h1>ops-agent 测试说明手册</h1>';
    html += '<p>版本 v1.0.0 | 2026-06-27</p>';
    html += '</div>';
    html += '<div class="container">';
    for (const sec of sections) {
        html += sec.html;
    }
    html += '</div></div>';
    return html;
}

const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ops-agent 测试说明手册</title>
<style>${css}</style>
</head>
<body>
${buildTOC()}
${buildMain()}
</body>
</html>`;

// ===== 写入文件 =====
const outDir = '/workspace/ops-agent/docs/test-manual/dist/html-report';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(`${outDir}/index.html`, htmlContent, 'utf8');
console.log(`HTML 报告已生成: ${outDir}/index.html`);
