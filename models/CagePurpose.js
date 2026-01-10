/**
 * 笼位用途模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CagePurpose = sequelize.define('CagePurpose', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '用途ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '用途名称'
    }
  }, {
    tableName: 'cage_purposes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '笼位用途表'
  });

  return CagePurpose;
};
