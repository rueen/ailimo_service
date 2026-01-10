/**
 * 动物品牌模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalBrand = sequelize.define('AnimalBrand', {
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
    tableName: 'animal_brands',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '动物品牌表'
  });

  return AnimalBrand;
};
