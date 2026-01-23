/**
 * PM2 进程管理配置文件
 * 
 * @description 用于生产环境的 PM2 配置
 * @docs https://pm2.keymetrics.io/docs/usage/application-declaration/
 */
module.exports = {
  apps: [
    {
      // 应用名称
      name: 'ailimo-service',
      
      // 启动脚本
      script: './app.js',
      
      // 实例数量（根据CPU核心数调整）
      // 2核CPU建议启动2个实例
      // 如果服务器性能不足，可以改为1
      instances: 2,
      
      // 执行模式：cluster（集群）或 fork（单进程）
      exec_mode: 'cluster',
      
      // 环境变量
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // 开发环境变量（可选）
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      },
      
      // 日志配置
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // 自动重启配置
      autorestart: true,
      max_memory_restart: '500M',  // 内存超过500M自动重启
      
      // 监听文件变化（生产环境建议关闭）
      watch: false,
      
      // 忽略监听的文件夹
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],
      
      // 最大重启次数（防止无限重启）
      max_restarts: 10,
      min_uptime: '10s',  // 最小运行时间，低于此时间视为异常启动
      
      // 启动延迟
      listen_timeout: 3000,
      kill_timeout: 5000,
      
      // 实例启动间隔（集群模式）
      instance_var: 'INSTANCE_ID',
      
      // Cron重启（可选，每天凌晨4点重启）
      // cron_restart: '0 4 * * *',
      
      // 优雅关闭超时时间
      wait_ready: false,
      
      // 进程优先级（-20 到 19，数值越小优先级越高）
      // nice: 0,
    }
  ],
  
  /**
   * 部署配置（可选）
   * 
   * @description PM2 自动化部署功能，用于从本地一键部署到服务器
   * @docs https://pm2.keymetrics.io/docs/usage/deployment/
   * 
   * 使用场景：
   * 1. 自动化部署：本地执行一条命令即可完成部署
   * 2. CI/CD：配合持续集成工具实现自动部署
   * 3. 团队协作：统一部署流程
   * 
   * 使用方法：
   * 1. 首次设置：pm2 deploy ecosystem.config.js production setup
   * 2. 后续部署：pm2 deploy ecosystem.config.js production
   * 
   * 注意：
   * - 需要配置 SSH 密钥认证（无密码登录）
   * - 需要修改下面的配置项为实际值
   */
  deploy: {
    production: {
      // SSH 登录用户
      user: 'ailimo',
      
      // 服务器IP地址或域名
      host: '121.199.74.194',  // 替换为你的服务器IP
      
      // Git 分支
      ref: 'origin/main',
      
      // Git 仓库地址（SSH格式，需要配置密钥）
      repo: 'git@github.com:rueen/ailimo_service.git',  // 替换为你的仓库地址
      
      // 服务器上的部署路径
      path: '/var/www/ailimo_service',
      
      // 部署前在本地执行的命令（可选）
      'pre-deploy-local': '',
      
      // 部署后在服务器上执行的命令
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      
      // 首次设置前执行的命令（可选）
      'pre-setup': '',
      
      // SSH 选项（可选）
      // ssh_options: 'StrictHostKeyChecking=no',
      
      // 环境变量（可选）
      // env: {
      //   NODE_ENV: 'production'
      // }
    }
  }
};
