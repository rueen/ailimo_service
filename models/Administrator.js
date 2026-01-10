/**
 * 管理员模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Administrator = sequelize.define('Administrator', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '管理员ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码（bcrypt加密）'
    },
    remark: {
      type: DataTypes.STRING(200),
      comment: '备注'
    },
    role_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '角色ID'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    },
    last_login_time: {
      type: DataTypes.DATE,
      comment: '最后登录时间'
    },
    last_login_ip: {
      type: DataTypes.STRING(50),
      comment: '最后登录IP'
    }
  }, {
    tableName: 'administrators',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['username'] },
      { fields: ['role_id'] }
    ],
    comment: '管理员表'
  });

  return Administrator;
};
