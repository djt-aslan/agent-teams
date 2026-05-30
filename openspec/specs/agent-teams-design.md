# Agent Teams 设计文档

## 概述

Agent Teams 是一个 TypeScript CLI 工具，可安装到 OpenCode 等 AI 编程工具中，通过多 Agent 协作完成端到端的软件研发交付。

**V1 范围**：手动技能调用模式，用户显式触发每个阶段。先支持 OpenCode 宿主。

## 核心流水线

```
需求输入
  │
  ▼
需求澄清 ──→ 结构化需求文档 (无需 Review，用户自己确认)
  │
  ▼
PRD 阶段 ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
架构阶段 ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
测试方案 ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
实现阶段 (TDD) ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
测试阶段 ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
最终 Review ──→ Review Agent ──→ 人工审批 ──→ Engine
  │                                         │
  ▼                                         ▼
合并提交 (Engine 执行 git 操作)
  │
  ▼
汇总报告 (Report Agent 生成 report.md)
```

每个阶段：Worker Agent 生产产物 → Review Agent 专业审查 → **人审核并确认** → Engine 推进或退回。

## 角色边界

| 模块 | 类型 | 职责 |
|------|------|------|
| Pipeline 引擎 | TS 代码 | 流程控制、状态管理、阶段推进、门禁放行、任务派发 |
| Worker Agent | AI | 各阶段产物生产 |
| Review Agent | AI | 产物质量审查、产出 pass/fail 结论 |
| Git 操作模块 | TS 代码 | Worktree 管理、合并提交 |
| Report Agent | AI | 跨阶段综合分析，生成汇总报告 |
| 产物校验 | TS 代码 | 检查产物文件存在、frontmatter 格式正确 |

### 引擎 vs Agent 分工原则

- **确定性操作 → TS 引擎代码**：状态机推进、格式校验、git 操作
- **内容生产与质量判断 → AI Agent**：写文档、写代码、做审查
- **错误恢复 → TS 捕获 + AI Fixer**：引擎主路径遇错时，派发 AI sub-agent 诊断修复



### Review Agent 隔离规则

每次 Review 启动一个**全新子 Agent 实例**，避免上下文串扰：

- 每个阶段的 Review 是独立的 sub-agent 会话，不接受任何历史上下文
- Reviewer 仅接收：当前产物内容 + 该阶段对应的审查标准 + 审查技能定义
- 前一阶段 Review 的结果、工件、上下文均不传递给后续阶段的 Review
- 实现方式：利用宿主工具 sub-agent 的天然隔离（每次调用从零开始会话）

## 实现阶段 TDD 循环

```
┌──── 实现阶段 ──────────────────────────────────────────────────┐
│                                                                 │
│  Engine 读取架构产物的任务拆解和耦合关系 ──→ 任务分组执行             │
│    │                                                             │
│    ├── 批 A: 高耦合任务 │─ sub-agent A ──→ worktree A ──→ TDD  │
│    │   task-1 (model)  │   串行 (task-1 → task-2 → task-3)     │
│    │   task-2 (service) │                                       │
│    │   task-3 (api)     │                                       │
│    │                    │                                        │
│    ├── 批 B: 独立任务 ── sub-agent B ──→ worktree B ──→ TDD    │
│    │                    │                                        │
│    └── 批 C: 独立任务 ── sub-agent C ──→ worktree C ──→ TDD    │
│    │                                                             │
│    ▼                                                             │
│  全部完成 ──→ Review ──→ 合入主分支                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

实现阶段要点：

- **任务拆解来源**：架构阶段产物（`artifacts/architecture.md`）包含实现任务列表及耦合关系。Engine 不做分析，只读取执行
- **高耦合任务串行同组**：架构注明强依赖的任务分配同一 sub-agent + 同一 worktree，按依赖顺序串行执行
- **独立任务并行**：无依赖关系的任务分派到独立的 sub-agent + 独立 worktree，并行执行
- **每个 sub-agent 内部**：按批次内的任务顺序做 TDD 循环（RED → GREEN → REFACTOR）
- **分批 Review**：每个批次完成后独立 Review，上下文小、精确审查；失败只影响当前批次
- **合入**：全部批次 Review pass 后，Engine 将 worktrees 按依赖顺序逐个合入主分支
  - 若冲突：Engine 生成冲突报告告知用户，由人决定处理方式；Engine 不自主解决冲突
  - 合入完成后进入测试阶段做集成验证

测试方案阶段产出的用例作为 TDD 循环中 RED 阶段的测试输入。Review 通过后的"测试阶段"执行集成测试和端到端回归验证。

### 实现阶段产物

`artifacts/implementation/` 不存代码本体（代码在 git worktree 和最终合入的分支中），只存每个批次的摘要和结论：

```
artifacts/implementation/
├── batch-a-report.md     # 批次 A 的 diff 摘要 + TDD 结果 + Review 结论
├── batch-b-report.md     # 批次 B 的 diff 摘要 + TDD 结果 + Review 结论
└── batch-c-report.md     # 批次 C 的 diff 摘要 + TDD 结果 + Review 结论
```

每个批次报告 frontmatter：

```markdown
---
batch: batch-a
tasks: [model层, service层, api层]
tests_passed: 15
tests_total: 15
diff_summary: "新增 User model、AuthService、POST /api/login"
review_verdict: pass
---
```

## Pipeline 引擎状态机

```
[初始化] ─→ [需求澄清] ─→ [PRD] ─→ [Review] ─→ [架构] ─→ [Review] ─→ [测试方案] ─→ [Review]
                                    │                │
                                    └── 驳回 ────────┘
                                                                        │
                    ┌───────────────────────────────────────────────────┘
                    ▼
             [实现(TDD)] ─→ [Review] ─→ [测试] ─→ [Review] ─→ [最终Review] ─→ [合并提交]
                    │                │
                    └── 驳回 ────────┘
```

引擎流程判断：

```
Worker 完成 → Review Agent 审查 → 人工审核
  ├── 人 approve → 引擎推进下一阶段
  └── 人 reject → 引擎退回当前阶段重做（最多 max_retries 次）
```

引擎只执行流程逻辑和人的决定，不做任何专业性判断。

阶段状态：`pending | in_progress | review | human_review | passed | failed`

## 中断恢复

Sub-agent 会话不可恢复，中断时正在执行的批次会丢失。策略：

- Engine 在每个关键节点写 `state.json`：派发批次前、批次完成、Review 完成、人工审批后
- 重启时读取 `state.json`，定位最后一个 checkpoint
- `in_progress` → 丢弃原 worktree，重新派发批次（批次执行幂等）
- `review` → 重新派发 Review Agent
- `human_review` → 提醒用户继续审批

## 错误自救

引擎执行确定性操作（状态管理、git 操作）时遇到预期外错误，不直接 crash，走自救路径：

```
TS 引擎执行操作
  │
  ├── 成功 → 继续
  └── 失败 → 捕获错误信息 → 派发 AI Fixer sub-agent
                │
                ├── 修复成功 → 引擎继续
                └── 修复失败 → 报告用户，人工介入
```

适用场景：git worktree lock 残留、rebase in progress、detached HEAD、产物格式异常等。

## 工作区文件结构

```
.agent-teams/
├── pipeline.yaml          # 流水线阶段定义、依赖关系、门禁规则
├── state.json             # 运行时状态
├── agents/                # 角色定义（我是谁）
│   ├── requirement-analyst.md
│   ├── product-manager.md
│   ├── architect.md
│   ├── developer.md
│   ├── tester.md
│   ├── qa-engineer.md
│   ├── reviewer.md
│   └── reporter.md
├── skills/                # 技能定义（我怎么干）
│   ├── requirement-elicitation.md
│   ├── prd-writing.md
│   ├── architecture-design.md
│   ├── test-planning.md
│   ├── tdd-implementation.md
│   ├── test-execution.md
│   ├── prd-review.md
│   ├── architecture-review.md
│   ├── test-plan-review.md
│   ├── code-review.md
│   ├── test-result-review.md
│   ├── final-review.md
│   └── report-generation.md
├── standards/             # 规范标准（按 agent/skill 分目录管理）
│   ├── developer/
│   │   ├── coding-standards.md
│   │   ├── commit-convention.md
│   │   └── naming-rules.md
│   ├── reviewer/
│   │   ├── prd-quality.md
│   │   ├── code-review-checklist.md
│   │   └── architecture-review.md
│   ├── prd-writing/
│   │   └── prd-template.md
│   └── architecture-design/
│       └── architecture-style.md
├── artifacts/             # 各阶段产物
│   ├── requirement.md
│   ├── prd.md
│   ├── architecture.md
│   ├── test-plan.md
│   ├── implementation/
│   ├── test-results.md
│   └── review-reports/
├── worktrees/             # 实现阶段并行任务隔离工作区
└── report.md              # Engine 汇总报告
```

### 三层概念

| 层级 | 含义 | 示例 |
|------|------|------|
| agents/ | 角色定义：谁来做、什么身份 | 产品经理、开发者、Reviewer |
| skills/ | 技能定义：怎么做、什么方法 | TDD 实现、PRD 编写、代码审查 |
| standards/ | 标准定义：按什么规范 | 编码规范、提交约定、审查清单 |

Agent 和 Skill 通过文件引用复用 Standards。一个 Agent 可引用多个 Standards。

### pipeline.yaml 结构

```yaml
version: "1"
pipeline:
  - stage: requirement
    description: "需求澄清与结构化"
    agent: agents/requirement-analyst.md
    skill: skills/requirement-elicitation.md
    output: artifacts/requirement.md
    review: false           # 需求由用户自己确认，无需 AI Review
    gate: manual

  - stage: prd
    description: "产品需求文档"
    agent: agents/product-manager.md
    skill: skills/prd-writing.md
    reviewer:
      agent: agents/reviewer.md
      skill: skills/prd-review.md
    depends_on: [requirement]
    max_retries: 3
    output: artifacts/prd.md
    gate: manual

  - stage: architecture
    description: "架构方案设计"
    agent: agents/architect.md
    skill: skills/architecture-design.md
    reviewer:
      agent: agents/reviewer.md
      skill: skills/architecture-review.md
    depends_on: [prd]
    max_retries: 3
    output: artifacts/architecture.md
    gate: manual

  - stage: test-plan
    description: "测试方案"
    agent: agents/tester.md
    skill: skills/test-planning.md
    reviewer:
      agent: agents/reviewer.md
      skill: skills/test-plan-review.md
    depends_on: [architecture]
    max_retries: 3
    output: artifacts/test-plan.md
    gate: manual

  - stage: implementation
    description: "TDD 实现"
    agent: agents/developer.md
    skill: skills/tdd-implementation.md
    mode: tdd
    parallel: true
    worktrees: .agent-teams/worktrees/
    reviewer:
      agent: agents/reviewer.md
      skill: skills/code-review.md
    depends_on: [test-plan]
    max_retries: 2
    output: artifacts/implementation/
    gate: manual

  - stage: testing
    description: "集成测试与回归验证"
    agent: agents/qa-engineer.md
    skill: skills/test-execution.md
    reviewer:
      agent: agents/reviewer.md
      skill: skills/test-result-review.md
    depends_on: [implementation]
    output: artifacts/test-results.md
    gate: manual

  - stage: review
    description: "最终 Review"
    agent: agents/reviewer.md
    skill: skills/final-review.md
    depends_on: [testing]
    output: artifacts/review-reports/final.md
    gate: manual

  - stage: merge
    description: "合并提交"
    engine: true
    depends_on: [review]
    action: merge

  - stage: report
    description: "汇总报告"
    agent: agents/reporter.md
    skill: skills/report-generation.md
    depends_on: [merge]
    output: report.md
```

## Agent 交互协议

Engine 与 Worker/Reviewer 通过结构化消息交互，基于 host 工具的 subagent 机制。

### 上下文传递策略（V1）

- Engine 传递**所有前序产物文件引用**给 Worker，Worker 按需读取全文
- V1 不做裁剪、不预定义 section，全量传递跑通链路
- 上下文溢出是有指标可观测的（token 用量阈值告警），真发生时再优化

### Engine → Worker（派发任务）

```json
{
  "task": "requirement",
  "context": {
    "requirement": "用户原始需求"
  },
  "agent": "agents/requirement-analyst.md",
  "skill": "skills/requirement-elicitation.md",
  "output": "artifacts/requirement.md"
}
```

### Worker → Engine（返回产物）

产物文件头部嵌入 YAML frontmatter：

```markdown
---
stage: prd
status: completed
summary: "PRD 已完成，覆盖了..."
---

# PRD 正文
...
```

Engine 读 frontmatter 获取状态，不解析正文。

### Engine → Reviewer（派发审查）

```json
{
  "task": "review",
  "target": {
    "stage": "prd",
    "artifact": "artifacts/prd.md"
  },
  "agent": "agents/reviewer.md",
  "skill": "skills/code-review.md",
  "output": "artifacts/review-reports/prd-review.md"
}
```

### Reviewer → Engine（审查结论）

```markdown
---
stage: prd
verdict: pass        # pass | fail | pass_with_notes
issues: []
notes: ["建议考虑 xxx"]
---
```

Engine 读 `verdict` 做流程决策。

## CLI 命令

```bash
# 初始化工作区
agent-teams init

# 启动流水线
agent-teams start "实现用户登录功能"
agent-teams start --spec requirements/draft.md

# 查看状态
agent-teams status

# 推进下一阶段
agent-teams next

# 审批门禁
agent-teams approve <stage>
agent-teams reject <stage> --reason "..."
agent-teams retry <stage>

# 查看产物
agent-teams artifact <stage>

# 查看报告
agent-teams report

# 列出资源
agent-teams list agents
agent-teams list skills
agent-teams list standards
```

## 版本管理

`.agent-teams/` 跟随项目代码纳入 git 版本控制：

- 所有产物、配置、状态文件随项目代码一起 commit
- 跨版本迭代追溯：`git log artifacts/prd.md` / `git diff v1.0 v2.0 -- artifacts/`
- 流水线启动时检查已有产物，提示用户 `--clean` 清空或继续
- V1 不另建 artifact 版本管理系统，git 全搞定

## 技术选型

| 项 | 决定 |
|----|------|
| 语言 | TypeScript |
| 运行时 | Node.js |
| 包管理 | npm |
| CLI 框架 | 待定 |
| 配置格式 | YAML + Markdown |
| 状态格式 | JSON |
| V1 宿主 | OpenCode |

## 非目标（V1）

- 全自动流水线执行（V1 为手动触发）
- Claude Code / Qoder 适配（V2+）
- TUI 进度界面
- 并行阶段执行
- 自定义流水线模板市场
