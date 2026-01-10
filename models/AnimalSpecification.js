/**
 * 动物规格模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalSpecification = sequelize.define('AnimalSpecification', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '规格ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '规格名称'
    }
  }, {
    tableName: 'animal_specifications',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '动物规格表'
  });

  return AnimalSpecification;
};
