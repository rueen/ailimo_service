/**
 * 数据库配置
 */
require('dotenv').config();

module.exports = {
  // 数据库连接配置
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'ailimo',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  
  // Sequelize配置
  dialect: 'mysql',
  timezone: '+08:00',
  
  // 连接池配置
  pool: {
    max: 10,        // 最大连接数
    min: 0,         // 最小连接数
    acquire: 30000, // 获取连接超时时间（毫秒）
    idle: 10000     // 连接空闲超时时间（毫秒）
  },
  
  // 日志配置
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // 定义选项
  define: {
    timestamps: true,           // 自动添加时间戳字段
    underscored: true,          // 使用下划线命名
    freezeTableName: true,      // 禁止表名复数化
    charset: 'utf8mb4',         // 字符集
    collate: 'utf8mb4_unicode_ci'
  }
};
