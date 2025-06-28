# Recipe Backend

微信小程序菜谱应用的后端服务

## 日志系统

项目使用 Winston 日志库，配置了完整的日志记录系统：

### 日志配置

- **日志文件**: `logs/app-YYYY-MM-DD.log`
- **文件大小限制**: 每个日志文件最大 200MB
- **文件数量限制**: 最多保存 3 个日志文件，超过后自动覆盖最旧的文件
- **日志格式**: JSON 格式，包含时间戳、日志级别、消息和元数据

### 日志级别

- `error`: 错误信息
- `warn`: 警告信息  
- `info`: 一般信息
- `debug`: 调试信息（仅开发环境）

### 日志内容

系统会记录以下类型的日志：

1. **HTTP 请求日志**: 所有 API 请求的详细信息
   - 请求方法、URL、IP 地址
   - 响应状态码、响应时间
   - User-Agent 信息

2. **应用日志**: 应用程序运行状态
   - 服务器启动/关闭
   - 数据库连接状态
   - 业务逻辑执行情况

3. **错误日志**: 异常和错误信息
   - 未捕获的异常
   - API 错误
   - 数据库错误

### 开发环境

在开发环境中，日志还会输出到控制台，便于调试。

### 生产环境

在生产环境中，日志仅写入文件，不会输出到控制台。

## 安装和运行

```bash
# 安装依赖
npm install

# 启动服务
npm start

# 运行数据迁移
node migrate.js
```

## 环境变量

创建 `.env` 文件并配置以下变量：

```
MONGODB_URI=mongodb://localhost:27017/recipe-app
API_KEY=your-api-key
SERVER_URL=http://localhost:3000
NODE_ENV=development
``` 