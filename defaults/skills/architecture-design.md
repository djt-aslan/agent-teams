# Architecture Design

基于 PRD 进行系统架构设计，并拆解实现任务。

## 输入
- `artifacts/requirement.md`
- `artifacts/prd.md`

## 输出格式
- `artifacts/architecture.md`

## 要求
1. 设计模块划分和职责边界
2. 定义模块间接口契约（API、数据模型、事件）
3. 选定技术栈和关键依赖
4. **必须输出实现任务拆解**：
   ```
   ## 实现任务拆解
   
   ### 批 A: 核心数据层（高耦合，串行执行）
   | 任务 | 描述 | 依赖 |
   |------|------|------|
   | task-a1 | User model 定义 | - |
   | task-a2 | Auth service | task-a1 |
   | task-a3 | Auth API | task-a2 |
   
   ### 批 B: 独立模块（可并行）
   | 任务 | 描述 | 依赖 |
   |------|------|------|
   | task-b1 | 日志中间件 | - |
   
   ### 批 C: 独立模块（可并行）
   | 任务 | 描述 | 依赖 |
   |------|------|------|
   | task-c1 | 配置管理 | - |
   ```
5. 架构风格参考 standards/architecture-design/architecture-style.md

## 输出结构
```markdown
---
stage: architecture
status: completed
summary: "架构设计完成，拆解为 N 个批次共 M 个任务"
---

# 架构设计

## 系统概览
## 模块设计
## 接口契约
## 技术选型
## 实现任务拆解
## 风险与约束
```
