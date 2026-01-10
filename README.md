# Ailimo Service - 艾力默生物科技服务平台

## 项目介绍
艾力默生物科技服务平台后端服务，提供管理端和用户端H5应用的接口服务。

## 技术栈
- Node.js + Express
- MySQL + Sequelize ORM
- JWT 认证
- bcryptjs 密码加密
- Winston 日志
- 阿里云 OSS 文件存储

## 项目结构
```
ailimo_service/
├── config/              # 配置文件
├── models/              # 数据模型
├── routes/              # 路由定义
├── controllers/         # 控制器
│   ├── admin/           # 管理端控制器
│   └── h5/              # 用户端控制器
├── services/            # 业务逻辑层
│   ├── admin/           # 管理端服务
│   └── h5/              # 用户端服务
├── middlewares/         # 中间件
├── utils/               # 工具函数
├── uploads/             # 临时上传文件
├── logs/                # 日志文件
├── docs/                # 接口文档
├── .env                 # 环境变量
└── app.js               # 应用入口
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env.example` 到 `.env`，并修改相应配置：
```bash
cp .env.example .env
```

### 3. 初始化数据库
```bash
# 创建数据库
mysql -u root -e "CREATE DATABASE ailimo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 执行数据库初始化脚本（待创建）
mysql -u root ailimo < database/init.sql
```

### 4. 启动服务
```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm start
```

## 接口文档
详细接口文档请查看 `docs/` 目录：
- [接口设计总览](docs/接口设计-总览.md)
- [数据库表结构设计](docs/数据库表结构设计.md)
- [管理端接口](docs/)
- [用户端接口](docs/接口设计-用户端.md)

## API 地址
- 管理端：`http://localhost:3000/api/support`
- 用户端：`http://localhost:3000/api/h5`

## 默认账号
- 管理员账号：admin
- 管理员密码：123456

## 注意事项
1. 首次运行前请确保 MySQL 服务已启动
2. 数据库配置为本地无密码，生产环境请修改
3. JWT_SECRET 请在生产环境修改为复杂字符串
4. OSS 配置未设置时，文件将保存到本地 uploads 目录

## License
ISC
