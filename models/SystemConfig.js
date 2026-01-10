/**
 * 系统配置模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemConfig = sequelize.define('SystemConfig', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '配置ID'
    },
    config_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '配置键'
    },
    config_value: {
      type: DataTypes.TEXT,
      comment: '配置值'
    },
    description: {
      type: DataTypes.STRING(200),
      comment: '配置描述'
    }
  }, {
    tableName: 'system_configs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '系统配置表'
  });

  return SystemConfig;
};
