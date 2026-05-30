# Code Review

审查实现代码的质量。

## 审查标准

1. **功能正确性**：代码是否实现了批次任务的要求
2. **TDD 合规**：是否存在无测试覆盖的代码
3. **代码规范**：是否符合 standards/developer/coding-standards.md
4. **命名规范**：是否符合 standards/developer/naming-rules.md
5. **提交规范**：commit message 是否符合 standards/developer/commit-convention.md
6. **简洁性**：是否存在冗余代码或过度设计
7. **安全性**：是否存在常见安全漏洞

## 审查结论格式

```markdown
---
stage: implementation
batch: <batch-id>
verdict: pass | fail | pass_with_notes
issues: ["问题 1", "问题 2"]
notes: ["建议 1"]
---
```
