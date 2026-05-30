# Agent Teams

端到端软件研发交付的 AI Agent 协作工具。通过多 Agent 流水线自动完成从需求到交付的全过程：需求澄清、PRD、架构设计、测试方案、TDD 实现、集成测试、代码审查、合并提交。

## 安装

```bash
git clone https://github.com/djt-aslan/agent-teams.git
cd agent-teams
npm install -g .
```

## 快速开始

```bash
# 在项目中初始化
agent-teams init

# 启动流水线
agent-teams start "实现用户登录功能"

# 推进阶段
agent-teams next

# 查看进度
agent-teams status

# 人工审批
agent-teams approve prd
agent-teams reject architecture --reason "缺少可扩展性设计"
```

## 流水线

```
需求澄清 → PRD → 架构设计 → 测试方案 → TDD 实现 → 集成测试 → 最终审查 → 合并提交 → 汇总报告
```

每个阶段：Worker Agent 生产产物 → Review Agent 质量审查 → 人工确认 → 引擎推进。

## 命令列表

| 命令 | 说明 |
|---------|------|
| `init` | 在工作区初始化 `.agent-teams/` |
| `start <需求描述>` | 启动新流水线 |
| `status` | 查看流水线进度 |
| `next` | 推进到下一阶段 |
| `approve <阶段>` | 人工审批通过 |
| `reject <阶段>` | 驳回重做 |
| `retry <阶段>` | 重试失败阶段 |
| `artifact <阶段>` | 查看阶段产物 |
| `report` | 查看流水线摘要 |
| `list <资源>` | 列出 agents / skills / standards |

## 工作原理

- **TS 引擎**：确定性管理流水线状态机、Git 操作、产物校验
- **AI Agent**：负责内容生产（Worker）和质量审查（Reviewer）
- **人在环**：每个阶段产出后由人最终确认
- **Git 版本化**：所有产物和配置跟随项目 Git 历史
- **TDD 内建**：实现阶段严格遵循 RED → GREEN → REFACTOR

## 自定义

`agent-teams init` 后，编辑 `.agent-teams/` 目录：

```
.agent-teams/
├── pipeline.yaml   # 流水线定义（阶段、Agent 绑定、审查规则）
├── agents/         # 角色定义（谁来做）
├── skills/         # 技能定义（怎么做）
├── standards/      # 质量标准（编码规范、审查清单）
├── artifacts/      # 阶段产物（PRD、架构、测试结果等）
└── report.md       # 项目交付报告
```

## 环境要求

- Node.js >= 18
- Git

## License

ISC
