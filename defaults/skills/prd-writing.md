# PRD Writing

基于结构化需求撰写产品需求文档。

## 输入
- `artifacts/requirement.md`

## 输出格式
- `artifacts/prd.md`

## 要求
1. 遵循 PRD 模板结构（参考 standards/prd-writing/prd-template.md）
2. 每个功能需求对应明确的用户故事和验收标准
3. 标注功能优先级（P0 必须 / P1 重要 / P2 可选）
4. 定义非功能指标（响应时间、并发量、可用性等）
5. 不包含技术实现细节

## 输出结构
```markdown
---
stage: prd
status: completed
summary: "PRD 完成，覆盖 N 个用户故事"
---

# 产品需求文档

## 产品概述
## 用户故事
## 功能详述
## 非功能需求
## 优先级排期
```
