/**
 * 设备模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Equipment = sequelize.define('Equipment', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '设备ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '设备名称'
    },
    details: {
      type: DataTypes.JSON,
      comment: '设备详情（JSON格式）'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    }
  }, {
    tableName: 'equipment',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'] }
    ],
    comment: '设备表'
  });

  return Equipment;
};
