# Commit Convention

遵循 Conventional Commits 规范。

## 格式
```
<type>(<scope>): <description>

[optional body]
```

## Type 定义
- `feat`: 新功能
- `fix`: Bug 修复
- `refactor`: 代码重构（不改变行为）
- `test`: 添加或修改测试
- `docs`: 文档更新
- `chore`: 构建、CI、依赖更新

## 示例
```
feat(auth): add JWT token validation
fix(api): handle empty request body
refactor(user): extract validation logic
```

_安装后按项目习惯调整。_
