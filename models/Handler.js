/**
 * 负责人模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Handler = sequelize.define('Handler', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '负责人ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '负责人姓名'
    }
  }, {
    tableName: 'handlers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '负责人表'
  });

  return Handler;
};
