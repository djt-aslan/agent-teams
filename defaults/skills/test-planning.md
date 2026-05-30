# Test Planning

基于架构设计制定测试策略和详细测试用例。

## 输入
- `artifacts/architecture.md`
- `artifacts/prd.md`

## 输出格式
- `artifacts/test-plan.md`

## 要求
1. 定义测试分层策略（单元测试、集成测试、端到端测试比例）
2. 为每个模块接口编写测试用例（输入、预期输出、边界条件）
3. 覆盖正常流程、异常流程、边界值
4. 明确哪些用例用于实现阶段 TDD 的 RED 步骤
5. 定义测试数据和环境要求

## 输出结构
```markdown
---
stage: test-plan
status: completed
summary: "测试方案完成，共 N 个测试用例"
---

# 测试方案

## 测试策略
## TDD 测试用例（实现阶段使用）
## 集成测试用例（测试阶段使用）
## 端到端测试场景
## 测试数据与环境
```
