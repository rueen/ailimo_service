/**
 * 动物类型模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalType = sequelize.define('AnimalType', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '动物类型ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '动物类型名称'
    }
  }, {
    tableName: 'animal_types',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '动物类型表'
  });

  return AnimalType;
};
