/**
 * 笼位房间模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CageRoom = sequelize.define('CageRoom', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '房间ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '房间名称'
    }
  }, {
    tableName: 'cage_rooms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['name'], unique: true }
    ],
    comment: '笼位房间表'
  });

  return CageRoom;
};
