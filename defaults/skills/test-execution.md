# Test Execution

在代码实现和合入完成后，执行集成测试和回归验证。

## 输入
- `artifacts/test-plan.md`（集成测试和端到端测试用例）
- 合入后的代码（主分支）

## 输出格式
- `artifacts/test-results.md`

## 要求
1. 按照测试方案执行集成测试和端到端测试
2. 记录每个用例的执行结果（pass / fail / blocked）
3. 对于失败用例，提供详细错误信息和复现步骤
4. 不执行单元测试（已在 TDD 循环中完成）
5. 评估整体测试通过率并提供结论

## 输出结构
```markdown
---
stage: testing
status: completed
summary: "测试完成，通过率 N%"
---

# 测试结果

## 测试概览
## 集成测试结果
## 端到端测试结果
## 失败用例详情
## 结论与建议
```
