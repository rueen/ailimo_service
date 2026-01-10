# 数据库初始化说明

## 1. 创建数据库

```bash
mysql -u root -p
```

```sql
CREATE DATABASE ailimo DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 2. 执行建表语句

根据 `docs/数据库表结构设计.md` 中的SQL语句创建所有表。

或者使用Sequelize自动同步（开发环境）：

```javascript
// 在Node.js中执行
const db = require('./models');
await db.sequelize.sync({ force: true }); // 警告：force会删除所有数据
```

## 3. 执行初始化脚本

```bash
mysql -u root ailimo < database/init.sql
```

## 4. 验证

```bash
mysql -u root ailimo
```

```sql
-- 查看表
SHOW TABLES;

-- 查看管理员
SELECT * FROM administrators;

-- 默认管理员账号
-- 用户名：admin
-- 密码：123456
```

## 注意事项

1. **密码加密**：初始化脚本中的密码已使用bcrypt加密
2. **生产环境**：请修改默认管理员密码
3. **数据备份**：定期备份数据库
4. **权限配置**：根据需要配置数据库用户权限

## 数据库连接配置

配置文件：`.env`

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ailimo
DB_USER=root
DB_PASSWORD=
```
