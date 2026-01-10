/**
 * 试剂耗材品牌模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReagentBrand = sequelize.define('ReagentBrand', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '品牌ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '品牌名称'
    }
  }, {
    tableName: 'reagent_brands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '试剂耗材品牌表'
  });

  return ReagentBrand;
};
