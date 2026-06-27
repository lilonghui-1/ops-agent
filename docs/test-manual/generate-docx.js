const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageBreak, LevelFormat } = require('docx');
const fs = require('fs');

// ===== 样式常量 =====
const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

const FONT = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Microsoft YaHei" };
const FONT_BOLD = { ascii: "Calibri", hAnsi: "Calibri", eastAsia: "Microsoft YaHei", bold: true };

// ===== 辅助函数 =====
function cell(text, opts = {}) {
    const children = [new Paragraph({
        children: [new TextRun({ text, bold: opts.bold || false, size: opts.size || 18, font: opts.font || FONT })]
    })];
    return new TableCell({
        borders,
        width: { size: opts.width || 4680, type: WidthType.DXA },
        shading: opts.shading ? { fill: opts.shading, type: ShadingType.CLEAR } : undefined,
        margins: { top: 60, bottom: 60, left: 100, right: 100 },
        children,
    });
}

function codeCell(text, opts = {}) {
    return new TableCell({
        borders,
        width: { size: opts.width || 9360, type: WidthType.DXA },
        shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: text.split('\n').map(line => new Paragraph({
            spacing: { before: 0, after: 0 },
            children: [new TextRun({ text: line, size: 16, font: { ascii: "Consolas", hAnsi: "Consolas", eastAsia: "Microsoft YaHei" } })]
        })),
    });
}

function h1(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        children: [new TextRun({ text, bold: true, size: 32, font: FONT_BOLD })]
    });
}

function h2(text) {
    return new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 160 },
        children: [new TextRun({ text, bold: true, size: 28, font: FONT_BOLD })]
    });
}

function h3(text) {
    return new Paragraph({
        spacing: { before: 200, after: 120 },
        children: [new TextRun({ text, bold: true, size: 24, font: FONT_BOLD })]
    });
}

function p(text, opts = {}) {
    return new Paragraph({
        spacing: { before: opts.before || 80, after: opts.after || 80 },
        children: [new TextRun({ text, size: opts.size || 21, font: opts.font || FONT })]
    });
}

function pb() {
    return new Paragraph({ children: [new PageBreak()] });
}

function codeBlock(text) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [9360],
        rows: [new TableRow({ cantSplit: true, children: [codeCell(text)] })]
    });
}

function warn(text) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [9360],
        rows: [new TableRow({
            cantSplit: true,
            children: [new TableCell({
                borders,
                width: { size: 9360, type: WidthType.DXA },
                shading: { fill: "FFF3CD", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                    children: [new TextRun({ text: "注意: " + text, size: 20, bold: true, font: FONT })]
                })],
            })]
        })]
    });
}

function info(text) {
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [9360],
        rows: [new TableRow({
            cantSplit: true,
            children: [new TableCell({
                borders,
                width: { size: 9360, type: WidthType.DXA },
                shading: { fill: "D1ECF1", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                    children: [new TextRun({ text: "提示: " + text, size: 20, font: FONT })]
                })],
            })]
        })]
    });
}

function bullet(text) {
    return new Paragraph({
        numbering: { reference: "bullets", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 21, font: FONT })]
    });
}

function num(text) {
    return new Paragraph({
        numbering: { reference: "numbers", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text, size: 21, font: FONT })]
    });
}

function testCaseTable(rows) {
    const headerCells = [
        cell("编号", { bold: true, shading: "E8F4FD", width: 1200 }),
        cell("测试项", { bold: true, shading: "E8F4FD", width: 2400 }),
        cell("测试命令/步骤", { bold: true, shading: "E8F4FD", width: 3400 }),
        cell("预期结果", { bold: true, shading: "E8F4FD", width: 2360 }),
    ];
    const tableRows = [new TableRow({ cantSplit: true, children: headerCells })];
    for (const r of rows) {
        tableRows.push(new TableRow({
            cantSplit: true,
            children: [
                cell(r[0], { width: 1200 }),
                cell(r[1], { width: 2400 }),
                cell(r[2], { width: 3400 }),
                cell(r[3], { width: 2360 }),
            ]
        }));
    }
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        columnWidths: [1200, 2400, 3400, 2360],
        rows: tableRows
    });
}

// ===== 构建文档 =====
const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: FONT, size: 21 }
            }
        },
        paragraphStyles: [
            { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 32, bold: true, font: FONT_BOLD },
                paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0, keepNext: false, keepLines: false } },
            { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
                run: { size: 28, bold: true, font: FONT_BOLD },
                paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 1, keepNext: false, keepLines: false } },
        ]
    },
    numbering: {
        config: [
            { reference: "bullets",
                levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
            { reference: "numbers",
                levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
                    style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        ]
    },
    sections: [{
        properties: {
            page: {
                size: { width: 12240, height: 15840 },
                margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
            }
        },
        headers: {
            default: new Header({
                children: [new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    children: [new TextRun({ text: "ops-agent 测试说明手册 v1.0", size: 18, color: "999999", font: FONT })]
                })]
            })
        },
        footers: {
            default: new Footer({
                children: [new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                        new TextRun({ text: "第 ", size: 18, color: "999999" }),
                        new TextRun({ children: [{ type: "pageNumber" }], size: 18, color: "999999" }),
                        new TextRun({ text: " 页", size: 18, color: "999999" })
                    ]
                })]
            })
        },
        children: [
            // ===== 封面 =====
            new Paragraph({ spacing: { before: 3000 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "ops-agent", bold: true, size: 56, font: FONT_BOLD })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 300 },
                children: [new TextRun({ text: "测试说明手册", bold: true, size: 44, font: FONT_BOLD })]
            }),
            new Paragraph({ spacing: { before: 600 } }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "版本: v1.0.0", size: 24, color: "666666", font: FONT })]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
                children: [new TextRun({ text: "日期: 2026-06-27", size: 24, color: "666666", font: FONT })]
            }),
            pb(),

            // ===== 第一部分: 概述与测试环境 =====
            h1("第一部分 概述与测试环境"),

            h2("第1章 文档说明"),
            h3("1.1 文档目的与适用范围"),
            p("本文档是 ops-agent 智能运维 Agent 的测试说明手册，覆盖以下两大测试领域："),
            bullet("Grafana Loki + Promtail 日志平台测试：安装验证、配置检查、日志收集测试、LogQL 查询测试"),
            bullet("ops-agent 全功能测试：数据库巡检（MySQL/PostgreSQL/Oracle/达梦/人大金仓/Redis）、SSH 连接、系统指标采集、日志分析、自愈规则、LLM 集成、Agent 协作、定时调度"),
            p("适用对象：运维工程师、测试工程师、DevOps 团队。"),

            h3("1.2 术语与缩略语"),
            testCaseTable([
                ["术语", "说明", "", ""],
                ["ops-agent", "基于 LLM 的智能运维 Agent", "", ""],
                ["Loki", "Grafana 开源的轻量级日志聚合系统", "", ""],
                ["Promtail", "Loki 的日志采集代理", "", ""],
                ["LogQL", "Loki 的查询语言，类似 PromQL", "", ""],
                ["LLM", "大语言模型（如 GPT-4/通义千问/DeepSeek）", "", ""],
                ["P0/P1/P2", "测试用例优先级：P0=核心必测, P1=重要, P2=一般", "", ""],
            ]),

            h3("1.3 测试环境要求"),
            testCaseTable([
                ["项目", "要求", "", ""],
                ["操作系统", "Linux (Ubuntu 20.04+/CentOS 7+) 或 macOS", "", ""],
                ["Python", "3.11+（推荐 3.11 或 3.12）", "", ""],
                ["Node.js", ">= 18（用于 docx-js 生成脚本）", "", ""],
                ["内存", "最低 2GB，推荐 4GB+", "", ""],
                ["网络", "可访问目标服务器 SSH 端口和 LLM API", "", ""],
            ]),

            h3("1.4 测试前置条件"),
            p("执行测试前需确保以下环境变量和配置已就绪："),
            codeBlock(`# LLM API
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
export DINGTALK_WEBHOOK="https://oapi.dingtalk.com/..."`),

            h2("第2章 测试环境搭建"),
            h3("2.1 项目安装"),
            codeBlock(`cd /workspace/ops-agent
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 按需安装国产数据库驱动
pip install oracledb>=2.0.0      # Oracle（纯 Python，无需客户端）
pip install dmPython>=2.4.0      # 达梦（需从官网下载 whl）
pip install ksycopg2>=2.8.0      # 人大金仓`),

            h3("2.2 配置文件准备"),
            p("确认以下配置文件已按实际环境修改："),
            bullet("config/config.yaml：LLM、通知渠道、日志平台、调度配置"),
            bullet("config/servers.yaml：目标服务器和数据库连接信息"),
            bullet("config/rules.yaml：自愈规则配置"),

            h3("2.3 运行单元测试验证环境"),
            codeBlock("python -m pytest tests/ -v --tb=short"),
            info("所有 40 个测试应全部通过，方可进入后续功能测试。"),

            pb(),

            // ===== 第二部分: Grafana Loki + Promtail 测试指南 =====
            h1("第二部分 Grafana Loki + Promtail 测试指南"),

            h2("第3章 安装验证"),
            h3("3.1 Loki 安装验证"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-LOKI-001", "服务状态检查", "docker ps | grep loki", "容器状态为 Up"],
                ["TC-LOKI-002", "HTTP 就绪探测", "curl http://localhost:3100/ready", "返回 ready"],
                ["TC-LOKI-003", "构建信息查询", "curl http://localhost:3100/loki/api/v1/status/buildinfo | jq", "返回版本、revision、branch"],
            ]),
            codeBlock(`# Loki 就绪检查
curl -s http://localhost:3100/ready

# 构建信息
curl -s http://localhost:3100/loki/api/v1/status/buildinfo | jq .`),

            h3("3.2 Promtail 安装验证"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-LOKI-004", "服务状态检查", "docker ps | grep promtail", "容器状态为 Up"],
                ["TC-LOKI-005", "配置校验", "promtail -config.file=/etc/promtail/config.yml -dry-run", "无配置错误输出"],
                ["TC-LOKI-006", "日志查看", "docker logs promtail | tail -20", "无 ERROR/FATAL 级别日志"],
            ]),
            codeBlock(`# Promtail 配置校验（非 Docker 方式）
sudo promtail -config.file=/etc/promtail/config.yml -dry-run

# Docker 方式查看日志
docker logs promtail | tail -20`),

            h2("第4章 配置验证"),
            h3("4.1 Promtail 配置文件结构检查"),
            p("验证 /etc/promtail/config.yml（或 Docker 挂载路径）包含以下必要配置段："),
            codeBlock(`server:
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
          __path__: /var/log/*.log`),
            testCaseTable([
                ["编号", "测试项", "验证方法", "预期结果"],
                ["TC-LOKI-007", "clients 段配置", "检查 url 指向正确的 Loki 地址", "url: http://loki:3100/loki/api/v1/push"],
                ["TC-LOKI-008", "scrape_configs 段", "确认至少有一个 job 配置", "job_name、targets、labels、__path__ 齐全"],
            ]),

            h3("4.2 配置热重载测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-LOKI-009", "配置热重载", "1. 修改 promtail-config.yml 增加新 target\n2. 执行 killall -HUP promtail", "Promtail 无异常重启，新 target 生效"],
            ]),

            h3("4.3 Label 规范性检查"),
            p("每条日志流应包含以下 label，便于后续查询和过滤："),
            testCaseTable([
                ["Label", "必填", "说明", "示例"],
                ["job", "是", "采集任务名称", "nginx, app, system"],
                ["app", "推荐", "应用名称", "ops-agent, myapp"],
                ["level", "推荐", "日志级别", "ERROR, WARN, INFO, DEBUG"],
                ["host", "推荐", "主机名", "web-server-01"],
            ]),

            h2("第5章 日志收集测试"),
            h3("5.1 单文件推送测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-LOKI-010", "单文件日志收集", "1. 生成测试日志: echo \"$(date '+%Y-%m-%d %H:%M:%S') TEST_ENTRY promtail_ok\" >> /var/log/test-app.log\n2. 等待 30 秒\n3. 查询 Loki", "在 Grafana 或 curl 查询中可见该条日志"],
            ]),
            codeBlock(`# 生成测试日志
echo "$(date '+%Y-%m-%d %H:%M:%S') TEST_ENTRY promtail_log_delivery_ok" >> /var/log/test-app.log

# 查询验证（30秒后执行）
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="test"} |= "TEST_ENTRY"' \
  --data-urlencode "limit=10" \
  --data-urlencode "start=$(($(date +%s) - 300))000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq '.data.result[0].values[0]'`),

            h3("5.2 多 job 并行收集测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-LOKI-011", "多 job 并行", "1. 同时向 nginx、app、system 三个日志文件写入不同标识\n2. 通过 LogQL 分别查询", "每个 job 的日志流独立，label 区分正确"],
            ]),
            codeBlock(`# 同时写入不同日志
echo "$(date '+%Y-%m-%d %H:%M:%S') NGINX_TEST_OK" >> /var/log/nginx/access.log
echo "$(date '+%Y-%m-%d %H:%M:%S') APP_TEST_OK" >> /opt/apps/myapp/logs/app.log
echo "$(date '+%Y-%m-%d %H:%M:%S') SYS_TEST_OK" >> /var/log/syslog

# 分别查询验证
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="nginx"} |= "NGINX_TEST_OK"' ...
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="app"} |= "APP_TEST_OK"' ...`),

            h3("5.3 大文件断点续传测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-LOKI-012", "日志轮转测试", "1. 模拟 logrotate: mv access.log access.log.1 && touch access.log\n2. 检查 positions.yaml", "offset 正确更新，新文件从 0 开始，无重复/丢失"],
            ]),

            h3("5.4 Windows Event Log 收集测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-LOKI-013", "Windows 事件日志", "1. 在 Windows 服务器配置 windows_events scrape_config\n2. 触发一个系统事件", "Loki 中可查询到该事件，含 Event ID、Channel、Level label"],
            ]),

            h2("第6章 LogQL 查询测试"),
            h3("6.1 基础查询语法验证"),
            testCaseTable([
                ["编号", "测试项", "查询示例", "预期结果"],
                ["TC-LOKI-014", "按 job 过滤", '{job="nginx"}', "返回所有 nginx 日志"],
                ["TC-LOKI-015", "多 label 联合过滤", '{app="ops-agent",level="ERROR"}', "返回 ops-agent 的 ERROR 级别日志"],
                ["TC-LOKI-016", "行内容过滤", '{job="app"} |= "panic"', "返回包含 panic 的 app 日志"],
                ["TC-LOKI-017", "正则匹配", '{job="nginx"} |~ "(404|500|502)"', "返回匹配状态码的 nginx 日志"],
            ]),
            codeBlock(`# 基础查询
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="nginx"} |= "error"' \
  --data-urlencode "limit=100" \
  --data-urlencode "start=$(($(date +%s) - 3600))000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq '.data.result | length'`),

            h3("6.2 聚合查询测试"),
            testCaseTable([
                ["编号", "测试项", "查询示例", "预期结果"],
                ["TC-LOKI-018", "按级别统计速率", 'sum(rate({job="app"}[1m])) by (level)', "返回各级别每秒日志条数"],
                ["TC-LOKI-019", "TOP 10 错误来源", 'topk(10, sum(rate({job="nginx"} |= "500" [5m])))', "返回错误率最高的 10 个来源"],
            ]),

            h3("6.3 时间范围与偏移测试"),
            testCaseTable([
                ["编号", "测试项", "查询示例", "预期结果"],
                ["TC-LOKI-020", "1小时范围", '[1h]', "返回最近1小时数据，查询时间 < 1s"],
                ["TC-LOKI-021", "24小时范围", '[24h]', "返回最近24小时数据，查询时间 < 5s"],
                ["TC-LOKI-022", "偏移查询", 'offset 1h', "返回1小时前的数据"],
            ]),

            h3("6.4 通过 ops-agent LogPlatformQueryTool 查询验证"),
            p("在 config.yaml 中配置 log_platforms 的 loki 条目后，通过 ops-agent CLI 执行查询："),
            codeBlock(`# config.yaml 配置
log_platforms:
  - name: "loki"
    type: "loki"
    url: "\${LOKI_URL}"  # http://192.168.1.51:3100

# 通过 ops-agent 查询
python -m src.main --task "通过 Loki 查询 nginx 过去1小时的 ERROR 日志"`),
            testCaseTable([
                ["编号", "测试项", "验证方法", "预期结果"],
                ["TC-LOKI-023", "LogPlatformQueryTool 查询", "调用 LogPlatformQueryTool._query_loki()", "返回结构包含 logs[]、total、platform='loki'"],
                ["TC-LOKI-024", "时间戳转换", "检查请求参数", "start/end 转换为纳秒级 Unix 时间戳"],
                ["TC-LOKI-025", "LogQL 构建", "检查 query 参数", "正确构建为 {app='nginx'} |= 'ERROR' 格式"],
            ]),

            pb(),

            // ===== 第三部分: ops-agent 功能测试指南 =====
            h1("第三部分 ops-agent 功能测试指南"),

            h2("第7章 工具层单元测试"),
            h3("7.1 BaseTool 与 ToolRegistry 测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-001", "抽象类不可实例化", "pytest tests/test_tools.py::TestBaseTool::test_cannot_instantiate -v", "抛出 TypeError"],
                ["TC-TOOL-002", "工具注册与获取", "pytest tests/test_tools.py::TestToolRegistry -v", "ToolRegistry.get_all() 返回所有工具"],
                ["TC-TOOL-003", "Schema 生成", "pytest tests/test_tools.py::TestToolRegistry::test_to_json_schema -v", "返回 JSON Schema 对象"],
            ]),

            h3("7.2 数据库驱动配置常量验证"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-004", "驱动映射", "pytest tests/test_tools.py::TestDBToolsExtended::test_db_drivers_config -v", "oracle->oracle+oracledb, dm->dm+dmPython, kingbase->postgresql+ksycopg2"],
                ["TC-TOOL-005", "默认端口", "同上", "oracle=1521, dm=5236, kingbase=54321"],
                ["TC-TOOL-006", "版本要求", "同上", "oracledb>=2.0.0, dmPython>=2.4.0, ksycopg2>=2.8.0"],
            ]),

            h3("7.3 数据库连接 URL 构建测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-007", "Oracle Service Name", "pytest tests/test_tools.py::TestDBToolsExtended::test_build_oracle_connection_url_service_name -v", "oracle+oracledb://.../?service_name=ORCL"],
                ["TC-TOOL-008", "Oracle SID", "pytest tests/test_tools.py::TestDBToolsExtended::test_build_oracle_connection_url_sid -v", "oracle+oracledb://.../ORCL"],
                ["TC-TOOL-009", "达梦 URL", "pytest tests/test_tools.py::TestDBToolsExtended::test_build_dm_connection_url -v", "dm+dmPython://SYSDBA:pass@host:5236/DAMENG"],
                ["TC-TOOL-010", "人大金仓 URL", "pytest tests/test_tools.py::TestDBToolsExtended::test_build_kingbase_connection_url -v", "postgresql+ksycopg2://system:pass@host:54321/test"],
            ]),

            h3("7.4 数据库查询安全限制测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-011", "拒绝写入操作", "pytest tests/test_tools.py::TestDBToolsExtended::test_db_query_security_reject_write -v", "DELETE/UPDATE/INSERT/DROP 被拦截，返回安全限制错误"],
            ]),

            h3("7.5 日志分析工具测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-012", "应用日志分析", "pytest tests/test_tools.py::TestLogToolsExtended::test_log_analyze_app_patterns -v", "识别 NullPointerException、连接池耗尽、500 错误等"],
                ["TC-TOOL-013", "数据库日志分析", "pytest tests/test_tools.py::TestLogToolsExtended::test_log_analyze_db_patterns -v", "识别 ORA-01555、DM-00123、死锁等"],
            ]),

            h3("7.6 日志平台查询工具测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-TOOL-014", "初始化验证", "pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_query_init -v", "工具名 log_platform_query，支持 ES/Loki"],
                ["TC-TOOL-015", "时间范围解析", "pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_parse_time_range -v", "返回 ISO 8601 + Z 格式"],
                ["TC-TOOL-016", "无配置错误处理", "pytest tests/test_tools.py::TestLogToolsExtended::test_log_platform_no_config -v", "success=False，错误信息包含未找到"],
            ]),

            h2("第8章 数据库巡检功能测试"),
            h3("8.1 测试前置条件"),
            p("确保 config/servers.yaml 中已配置目标数据库，且对应驱动已安装。"),

            h3("8.2 MySQL 数据库巡检"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-001", "MySQL 状态检查", "python -m src.main --task \"检查 MySQL 192.168.1.10 的状态\"", "返回 threads_connected、max_connections、slow_queries、uptime_seconds、replication"],
                ["TC-DB-002", "MySQL 慢查询", "python -m src.main --task \"查询 MySQL 慢查询数量\"", "slow_queries 为整数"],
                ["TC-DB-003", "MySQL 主从状态", "python -m src.main --task \"检查 MySQL 主从复制状态\"", "replication.configured=true/false，如配置则含 Slave_IO_Running 等"],
            ]),

            h3("8.3 PostgreSQL 数据库巡检"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-004", "PG 状态检查", "python -m src.main --task \"检查 PostgreSQL 连接数\"", "返回 active_connections、max_connections、connections_by_state、long_running_queries、database_size"],
            ]),

            h3("8.4 Oracle 数据库巡检"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-005", "Oracle 状态检查", "python -m src.main --task \"检查 Oracle 192.168.1.21 的表空间使用率\"", "返回 user_sessions、max_processes、active_sessions、database_size_gb、tablespace_usage、top_wait_events"],
            ]),

            h3("8.5 达梦数据库巡检"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-006", "达梦状态检查", "python -m src.main --task \"检查达梦数据库连接数\"", "返回 active_sessions、max_sessions、database_size_mb、tablespace_usage、slow_sql_top5"],
            ]),

            h3("8.6 人大金仓数据库巡检"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-007", "人大金仓状态检查", "python -m src.main --task \"检查人大金仓数据库状态\"", "返回 active_connections、max_connections、connections_by_state、database_size、long_running_queries"],
            ]),

            h3("8.7 Redis 信息获取测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-008", "Redis 信息", "python -m src.main --task \"检查 Redis 192.168.1.10 的内存使用情况\"", "返回 version、uptime_seconds、connected_clients、used_memory_human、maxmemory_human、memory_usage_percent、hit_rate_percent、instantaneous_ops_per_sec"],
            ]),

            h3("8.8 数据库查询安全测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-DB-009", "拒绝写入", "python -c \"from src.tools.db_tools import DBQueryTool; print(DBQueryTool(None).execute(host='h',db_type='mysql',database='d',query='DELETE FROM t'))\"", "success=False，错误信息含安全限制"],
            ]),

            h2("第9章 SSH 连接测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-SSH-001", "密钥认证", "python -m src.main --task \"SSH 执行 192.168.1.10 whoami\"", "返回当前用户名，exit_code=0"],
                ["TC-SSH-002", "密码认证（Windows）", "python -m src.main --task \"SSH 执行 win-server-01 whoami\"", "返回 administrator，exit_code=0"],
                ["TC-SSH-003", "连接池复用", "连续对同一 host 执行 10 次命令", "连接复用，无重复建立连接"],
                ["TC-SSH-004", "超时处理", "执行 sleep 60 命令并设置 timeout=5", "超时后返回错误信息"],
                ["TC-SSH-005", "sudo 权限", "python -m src.main --task \"SSH 执行 192.168.1.10 systemctl status nginx use_sudo=true\"", "命令前缀追加 sudo"],
            ]),

            h2("第10章 系统指标采集测试"),
            h3("10.1 Linux 系统指标测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-SYS-001", "CPU 指标", "python -m src.main --task \"采集 192.168.1.10 的 CPU 指标\"", "返回 Load Average、CPU Usage、CPU Cores、Process Count"],
                ["TC-SYS-002", "内存指标", "python -m src.main --task \"采集 192.168.1.10 的内存指标\"", "返回 free -h 输出、Top Memory Processes"],
                ["TC-SYS-003", "磁盘指标", "python -m src.main --task \"采集 192.168.1.10 的磁盘指标\"", "返回 df -h、Inode Usage、iostat"],
                ["TC-SYS-004", "网络指标", "python -m src.main --task \"采集 192.168.1.10 的网络指标\"", "返回 ss -s、ss -tlnp、ip addr"],
                ["TC-SYS-005", "全量采集", "python -m src.main --task \"巡检 192.168.1.10\"", "返回字典包含 cpu、memory、disk、network"],
            ]),

            h3("10.2 Windows 系统指标测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-SYS-006", "Windows CPU", "python -m src.main --task \"采集 win-server-01 的 CPU\"", "返回 LoadPercentage、NumberOfLogicalProcessors"],
                ["TC-SYS-007", "Windows 内存", "python -m src.main --task \"采集 win-server-01 的内存\"", "返回 Total/Used/Free GB 及百分比"],
                ["TC-SYS-008", "Windows 磁盘", "python -m src.main --task \"采集 win-server-01 的磁盘\"", "返回各盘符 Total/Free/Used%"],
                ["TC-SYS-009", "Windows 网络", "python -m src.main --task \"采集 win-server-01 的网络\"", "返回 Get-NetTCPConnection、Get-NetIPAddress"],
            ]),

            h3("10.3 自动 OS 类型识别"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-SYS-010", "自动识别", "1. servers.yaml 中配置 os_type: windows\n2. 执行 system_metrics 不传入 os_type", "内部通过 _get_os_type() 自动识别为 Windows"],
            ]),

            h2("第11章 日志分析功能测试"),
            h3("11.1 远程日志获取测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-LOG-001", "tail 模式", "python -m src.main --task \"读取 192.168.1.10 /var/log/nginx/error.log 末尾200行\"", "返回 content、line_count、file_path、mode=tail"],
                ["TC-LOG-002", "grep 模式", "python -m src.main --task \"在 192.168.1.10 /var/log/nginx/error.log 中搜索 500|502|503\"", "返回匹配行"],
            ]),

            h3("11.2 日志平台 API 查询测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-LOG-003", "ES 查询", "python -m src.main --task \"从 ES 查询 status:500 最近1小时\"", "返回 logs[] 含 timestamp、message、level、app"],
                ["TC-LOG-004", "Loki 查询", "python -m src.main --task \"从 Loki 查询 nginx ERROR 最近6小时\"", "LogQL 正确构建，返回 logs[]、total"],
            ]),

            h3("11.3 日志内容分析测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-LOG-005", "应用日志分析", "python -m src.main --task \"分析以下日志: [含 NullPointerException 的日志文本]\"", "app_issues 包含内存溢出、连接池耗尽、服务端错误"],
                ["TC-LOG-006", "数据库日志分析", "python -m src.main --task \"分析数据库日志: [含 ORA-01555 的日志文本]\"", "error_line_count >= 2，severity 正确评估"],
            ]),

            h2("第12章 自愈规则测试"),
            h3("12.1 规则加载验证"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-HEAL-001", "规则加载", "python -c \"from src.agent.heal_agent import HealAgent; print(len(HealAgent(None)._load_rules()))\"", "加载 11 条规则"],
            ]),

            h3("12.2 低风险自动执行规则测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-HEAL-002", "Nginx 自动重启", "1. systemctl stop nginx\n2. 触发巡检\n3. 观察自愈", "service_control 执行 restart，confirm_required=false 直接执行"],
                ["TC-HEAL-003", "清理日志", "模拟磁盘使用率 > 85%", "执行 journalctl --vacuum-time=3d"],
            ]),

            h3("12.3 高风险需确认规则测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-HEAL-004", "清理 apt 缓存", "模拟磁盘使用率 > 90%", "Agent 说明风险并要求确认（confirm_required=true）"],
                ["TC-HEAL-005", "终止长查询", "MySQL 存在长查询", "Agent 要求确认后执行 kill"],
            ]),

            h2("第13章 Agent 协作与 LLM 集成测试"),
            h3("13.1 LLM 工厂测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-AGENT-001", "工厂创建", "pytest tests/test_agents.py::TestLLMFactory -v", "返回 ChatOpenAI 实例"],
                ["TC-AGENT-002", "base_url 生效", "配置本地模型地址", "请求发往本地地址"],
            ]),

            h3("13.2 Prompt 模板测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-AGENT-003", "Prompt 加载", "pytest tests/test_agents.py::TestPrompts -v", "5 套系统 Prompt 完整加载"],
            ]),

            h3("13.3 各 Agent 测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-AGENT-004", "巡检 Agent", "pytest tests/test_agents.py::TestInspectAgent -v", "返回 agent=inspect、result、tool_calls"],
                ["TC-AGENT-005", "诊断 Agent", "pytest tests/test_agents.py::TestDiagnoseAgent -v", "知识库上下文注入，返回诊断报告"],
                ["TC-AGENT-006", "Master Agent", "pytest tests/test_agents.py::TestMasterAgent -v", "任务路由正确，报告汇总完整"],
            ]),

            h3("13.4 完整协作链路测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-AGENT-007", "完整链路", "1. 输入：巡检所有服务器\n2. Master -> Inspect -> （异常）-> Diagnose -> （建议自愈）-> Heal", "最终报告包含巡检、诊断、自愈三部分结果"],
            ]),

            h2("第14章 知识库测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-KB-001", "YAML 加载", "pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_load -v", "成功加载 knowledge/ 目录下 YAML"],
                ["TC-KB-002", "关键词搜索", "pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_search -v", "搜索 CPU 返回 system 分类结果"],
                ["TC-KB-003", "分类过滤", "pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_search_with_category -v", "category=system 仅返回系统相关"],
                ["TC-KB-004", "Agent 上下文", "pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_get_context -v", "返回症状、原因、诊断步骤、解决方案"],
                ["TC-KB-005", "空知识库", "pytest tests/test_knowledge_base.py::TestKnowledgeBase::test_empty -v", "len(kb.entries) == 0，get_context 返回未找到"],
            ]),

            h2("第15章 定时调度与通知测试"),
            h3("15.1 调度器配置测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-SCH-001", "Cron 解析", "pytest tests/ -k scheduler -v", "0 */6 * * * 正确解析为每6小时"],
                ["TC-SCH-002", "任务参数", "检查 scheduler.py", "coalesce=True、max_instances=1、misfire_grace_time=300"],
            ]),

            h3("15.2 定时巡检任务测试"),
            testCaseTable([
                ["编号", "测试项", "测试步骤", "预期结果"],
                ["TC-SCH-003", "定时触发", "1. 设置 cron=*/1 * * **，enabled=true\n2. 启动 daemon", "日志中每分钟出现巡检任务开始"],
            ]),

            h3("15.3 通知渠道测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-SCH-004", "企业微信", "触发告警通知", "Markdown 格式消息发送成功"],
                ["TC-SCH-005", "钉钉", "触发告警通知", "Markdown 格式消息发送成功"],
                ["TC-SCH-006", "重试机制", "断开网络后恢复", "tenacity 重试后最终成功"],
            ]),

            h2("第16章 主程序与 CLI 测试"),
            testCaseTable([
                ["编号", "测试项", "测试命令", "预期结果"],
                ["TC-CLI-001", "CLI 交互", "python -m src.main", "help、tools、servers、jobs 命令正常输出"],
                ["TC-CLI-002", "守护进程", "python -m src.main --mode daemon", "调度器启动，定时任务注册成功"],
                ["TC-CLI-003", "单次执行", "python -m src.main --task \"巡检 192.168.1.10\"", "任务执行后程序正常退出"],
                ["TC-CLI-004", "信号处理", "启动 daemon 后发送 SIGINT", "优雅关闭：调度器停止、SSH 连接池清空"],
                ["TC-CLI-005", "配置加载", "检查环境变量替换", "\${OPENAI_API_KEY} 被替换为实际值"],
            ]),

            // ===== 附录 =====
            pb(),
            h1("附录"),

            h2("附录 A：测试用例总览表"),
            testCaseTable([
                ["章节", "P0", "P1", "P2", "对应源码"],
                ["第3-6章 Loki/Promtail", "4", "6", "3", "log_tools.py, config.yaml"],
                ["第7章 工具层", "6", "8", "4", "test_tools.py, base.py"],
                ["第8章 数据库巡检", "8", "10", "4", "db_tools.py"],
                ["第9章 SSH", "4", "4", "2", "ssh_tools.py"],
                ["第10章 系统指标", "4", "4", "2", "system_tools.py"],
                ["第11章 日志分析", "4", "6", "3", "log_tools.py"],
                ["第12章 自愈规则", "3", "6", "3", "rules.yaml, heal_agent.py"],
                ["第13章 Agent/LLM", "5", "6", "3", "test_agents.py, llm_factory.py"],
                ["第14章 知识库", "2", "3", "2", "test_knowledge_base.py"],
                ["第15章 调度/通知", "3", "4", "2", "scheduler.py, notify_tools.py"],
                ["第16章 CLI/主程序", "3", "3", "2", "main.py, config_loader.py"],
            ]),

            h2("附录 B：工具注册清单"),
            testCaseTable([
                ["序号", "工具名", "说明", ""],
                ["1", "ssh_execute", "SSH 远程命令执行", ""],
                ["2", "db_query", "数据库只读查询（6种数据库）", ""],
                ["3", "db_status", "数据库状态检查（6种数据库）", ""],
                ["4", "redis_info", "Redis 信息获取", ""],
                ["5", "log_fetch", "远程日志文件获取（SSH）", ""],
                ["6", "log_platform_query", "日志平台 API 查询（ES/Loki）", ""],
                ["7", "log_analyze", "日志内容分析", ""],
                ["8", "system_metrics", "系统指标采集（Linux/Windows）", ""],
                ["9", "service_control", "服务管理（启动/停止/重启/状态）", ""],
                ["10", "send_notification", "通知发送（企微/钉钉）", ""],
            ]),

            h2("附录 C：Loki + Promtail 测试命令速查"),
            codeBlock(`# Loki 就绪检查
curl -s http://localhost:3100/ready

# Loki 构建信息
curl -s http://localhost:3100/loki/api/v1/status/buildinfo | jq

# Promtail 配置校验
promtail -config.file=/etc/promtail/config.yml -dry-run

# 推送测试日志
curl -X POST http://localhost:3100/loki/api/v1/push \
  -H "Content-Type: application/json" \
  -d "{\"streams\":[{\"stream\":{\"job\":\"test\"},\"values\":[[\"$(date +%s%N)\",\"manual test log\"]]}]}"

# LogQL 查询
curl -G -s "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode "query={job=\"nginx\"} |= \"error\"" \
  --data-urlencode "limit=100" \
  --data-urlencode "start=$(($(date +%s) - 3600))000000000" \
  --data-urlencode "end=$(date +%s)000000000" | jq

# 查看 label 列表
curl -s "http://localhost:3100/loki/api/v1/label/job/values" | jq`),

            h2("附录 D：pytest 测试命令速查"),
            codeBlock(`# 运行全部测试
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
pytest tests/ -k "loki or log_platform" -v`),
        ]
    }]
});

// ===== 生成文件 =====
Packer.toBuffer(doc).then(buffer => {
    fs.writeFileSync("/workspace/ops-agent/docs/test-manual/dist/ops-agent测试说明手册.docx", buffer);
    console.log("Word 文档已生成: /workspace/ops-agent/docs/test-manual/dist/ops-agent测试说明手册.docx");
}).catch(err => {
    console.error("生成失败:", err);
    process.exit(1);
});
