# Recipe Backend API

一个为微信小程序设计的食谱管理后端 API 服务。

## 项目概述

该项目是一个基于 Express.js 和 MongoDB 的食谱管理系统后端，支持食谱的增删改查、图片上传、搜索关键词统计等功能，配备完整的日志系统、速率限制和监控告警。

## 技术栈

- **Node.js** - 运行环境
- **Express.js** - Web 框架
- **MongoDB** + **Mongoose** - 数据库及 ODM
- **Multer** - 文件上传处理
- **Winston** - 日志管理
- **Nodemailer** - 邮件服务
- **Express Rate Limit** - 速率限制

## 项目结构

```
recipe-backend/
├── config/           # 配置文件
├── middleware/       # 中间件
├── models/          # 数据模型
├── routes/          # 路由处理
├── scripts/         # 工具脚本
├── public/images/   # 图片存储
├── logs/           # 日志文件
├── tmp/            # 临时文件
├── index.js        # 应用入口
├── package.json    # 项目配置
└── .env.example    # 环境变量示例
```

## 快速开始

### 环境要求

- Node.js >= 14.0
- MongoDB >= 4.0
- npm 或 yarn

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填入实际配置
   ```

4. **启动 MongoDB 服务**
   ```bash
   # 确保 MongoDB 服务正在运行
   mongod
   ```

5. **启动应用**
   ```bash
   npm start
   ```

服务将在 `http://localhost:3000` 启动。

## 环境变量配置

```bash
# 数据库配置
MONGODB_URI=mongodb://localhost:27017/recipes

# 服务器配置
PORT=3000
NODE_ENV=development

# API 密钥认证
API_KEY=your_api_key_here

# 服务器地址（用于图片链接）
SERVER_URL=https://your-domain.com

# 邮件监控配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ALERT_EMAILS=admin@example.com
```

## API 接口

### 认证

所有 API 请求需要在 Header 中包含认证信息：
```
Authorization: Bearer YOUR_API_KEY
```

### 食谱管理

- `GET /api/recipes` - 获取食谱列表
- `GET /api/recipes/:id` - 获取单个食谱详情
- `POST /api/recipes` - 创建新食谱
- `PUT /api/recipes/:id` - 更新食谱
- `DELETE /api/recipes/:id` - 删除食谱

### 图片上传

- `POST /api/recipes/upload-image` - 上传食谱图片

### 搜索统计

- `POST /api/recipes/search-keywords` - 记录搜索关键词

### 管理功能

- `POST /api/recipes/:id/approve` - 审核通过食谱
- `POST /api/recipes/:id/reject` - 拒绝食谱

## 数据模型

### Recipe（食谱）

```javascript
{
  id: Number,           // 唯一标识
  name: String,         // 食谱名称
  image: String,        // 主图链接
  ingredients: String,  // 食材列表
  steps: [{            // 制作步骤
    description: String,
    image: String      // 步骤图片（可选）
  }],
  tips: String,        // 小贴士（可选）
  tags: [String],      // 标签数组
  status: String,      // 状态：pending/approved/rejected
  createdAt: Date,     // 创建时间
  updatedAt: Date      // 更新时间
}
```

### SearchKeyword（搜索关键词）

```javascript
{
  keyword: String,     // 关键词
  count: Number,       // 搜索次数
  lastSearched: Date   // 最后搜索时间
}
```

## 工具脚本

项目提供多个管理脚本：

- `scripts/insertRecipes.js` - 批量导入食谱数据
- `scripts/approve_all_recipes.js` - 批量审核通过食谱
- `scripts/check-recipe-status.js` - 检查食谱状态
- `scripts/emailMonitor.js` - 邮件监控服务
- `scripts/tag.js` - 标签管理
- `scripts/min_pic.py` - 图片压缩优化

### 使用示例

```bash
# 导入食谱数据
node scripts/insertRecipes.js

# 启动邮件监控
node scripts/emailMonitor.js

# 批量审核通过所有待审核食谱
node scripts/approve_all_recipes.js
```

## 监控和日志

### 日志系统

- 使用 Winston 进行日志管理
- 日志文件按日期轮转存储在 `logs/` 目录
- 支持不同级别的日志记录（error, warn, info, debug）

### 速率限制

- API 请求速率限制：每 15 分钟最多 100 次请求
- 文件上传速率限制：每小时最多 10 次上传
- 用户提交速率限制：防止恶意提交

### 邮件监控

系统支持邮件监控告警功能，在出现异常时自动发送告警邮件。

## 部署说明

### 生产环境部署

1. 设置环境变量 `NODE_ENV=production`
2. 确保 MongoDB 服务稳定运行
3. 配置反向代理（如 Nginx）
4. 设置 PM2 进程管理：

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start index.js --name recipe-backend

# 设置开机自启
pm2 startup
pm2 save
```


### 日志分析

查看日志文件了解详细错误信息：
```bash
tail -f logs/combined.log
tail -f logs/error.log
```

## 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交改动
4. 发起 Pull Request

## 许可证

本项目采用 MIT 许可证。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 联系作者:169180920@qq.com
- wechat: kkkcau

---

*最后更新：2025年*
