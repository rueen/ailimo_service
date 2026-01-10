/**
 * 短信验证码模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SmsCode = sequelize.define('SmsCode', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '验证码ID'
    },
    phone: {
      type: DataTypes.STRING(11),
      allowNull: false,
      comment: '手机号'
    },
    code: {
      type: DataTypes.STRING(6),
      allowNull: false,
      comment: '验证码'
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '类型：1-登录 2-注册'
    },
    is_used: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '是否已使用：0-未使用 1-已使用'
    },
    expire_time: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '过期时间'
    }
  }, {
    tableName: 'sms_codes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['phone'] },
      { fields: ['expire_time'] }
    ],
    comment: '短信验证码表'
  });

  return SmsCode;
};
