/**
 * 动物要求模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalRequirement = sequelize.define('AnimalRequirement', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '要求ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '要求名称'
    }
  }, {
    tableName: 'animal_requirements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '动物要求表'
  });

  return AnimalRequirement;
};
