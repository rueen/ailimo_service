/**
 * 环境类型模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EnvironmentType = sequelize.define('EnvironmentType', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '环境类型ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '环境名称'
    }
  }, {
    tableName: 'environment_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '环境类型表'
  });

  return EnvironmentType;
};
