/**
 * 其他服务模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OtherService = sequelize.define('OtherService', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '其他服务ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '内容（富文本）'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    }
  }, {
    tableName: 'other_services',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['title'] },
      { fields: ['status'] }
    ],
    comment: '其他服务表'
  });

  return OtherService;
};
