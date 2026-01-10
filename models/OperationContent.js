/**
 * 操作内容模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const OperationContent = sequelize.define('OperationContent', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '操作内容ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '操作内容名称'
    }
  }, {
    tableName: 'operation_contents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '操作内容表'
  });

  return OperationContent;
};
