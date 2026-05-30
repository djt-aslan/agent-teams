# TDD Implementation

严格遵循 TDD 流程实现代码。

## 输入
- `artifacts/architecture.md`（该批次的实现任务和接口契约）
- `artifacts/test-plan.md`（该批次相关的测试用例）
- `standards/developer/` 下全部规范

## TDD 循环（每个任务执行）

```
1. RED: 基于测试方案中的用例编写失败测试
2. GREEN: 编写最小可工作的实现代码使测试通过
3. REFACTOR: 重构代码（消除重复、优化结构、不改行为）
4. 重复 1-3 直到该批次所有任务完成
```

## 输出格式

每个批次完成后，在批次 worktree 内产出代码（跟随 git），同时输出批次报告：

```markdown
---
batch: <batch-id>
tasks: [<task-list>]
tests_passed: N
tests_total: N
diff_summary: "<变更摘要>"
review_verdict: <待审查>
---

# 批次 <batch-id> 实现报告

## 完成的任务
## 测试结果
## 变更摘要
## 已知问题（如有）
```

## 要求
1. 每次只做一个很小的变更
2. 测试不通过绝不写实现代码
3. 保持每个 TDD 循环粒度小（分钟级）
4. 遵循 standards/developer/ 下所有编码规范
5. 遵循 standards/developer/commit-convention.md 的提交约定
