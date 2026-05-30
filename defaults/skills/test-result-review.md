# Test Result Review

审查测试执行结果的有效性。

## 审查标准

1. **完整性**：是否所有测试方案中的用例都被执行
2. **准确性**：失败用例的复现步骤是否清晰可靠
3. **覆盖率**：集成测试和端到端测试是否覆盖关键路径
4. **阻塞项**：blocked 用例的阻塞原因是否合理

## 审查结论格式

```markdown
---
stage: testing
verdict: pass | fail | pass_with_notes
issues: ["问题 1", "问题 2"]
notes: ["建议 1"]
---
```
