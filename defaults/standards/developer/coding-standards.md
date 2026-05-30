# Coding Standards

## 通用原则
- 优先可读性，其次性能
- 函数单一职责，长度不超过 50 行
- 避免魔法数字和硬编码
- 关键逻辑必须有注释

## 语言特定规范

### TypeScript
- 使用严格模式 (`strict: true`)
- 优先使用 `interface` 而非 `type`
- 禁止 `any`，使用 `unknown` 或具体类型
- 命名：文件 kebab-case，变量 camelCase，类 PascalCase

### Go
- 遵循 `gofmt` 和 `go vet`
- 错误处理：永远不要忽略 error
- 命名：包名小写单字，导出标识符 PascalCase

### Python
- 遵循 PEP 8
- 使用 type hints
- 命名：文件 snake_case，类 PascalCase，函数 snake_case

_安装后按项目语言替换此文件。_
