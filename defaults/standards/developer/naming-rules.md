# Naming Rules

## 通用
- 命名应自解释，无需注释即可理解意图
- 避免缩写（`user` 而非 `usr`），除非是约定俗成的缩写（`id`, `url`, `api`）
- 布尔值以 `is`, `has`, `should` 等前缀开头

## 文件
- 单用途的文件以功能命名：`auth.service.ts`, `user.model.ts`
- 测试文件与被测文件同目录，后缀 `.test.ts` 或 `_test.go`

## 变量
- 循环变量使用有意义的名称（`user` 而非 `u`），只在短循环中用 `i`, `j`
- 常量使用全大写蛇形：`MAX_RETRY_COUNT`

_安装后按项目调整。_
