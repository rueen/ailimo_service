/**
 * 动物种类/品系模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalVariety = sequelize.define('AnimalVariety', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '种类ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '种类/品系名称'
    },
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '所属品牌ID'
    }
  }, {
    tableName: 'animal_varieties',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['brand_id'] },
      { unique: true, fields: ['name', 'brand_id'] }
    ],
    comment: '动物种类/品系表'
  });

  return AnimalVariety;
};
