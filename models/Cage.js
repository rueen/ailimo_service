/**
 * 笼位模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Cage = sequelize.define('Cage', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '笼位ID'
    },
    animal_type_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '动物类型ID'
    },
    environment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '环境ID'
    },
    room_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '房间ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '笼位数量'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    }
  }, {
    tableName: 'cages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['animal_type_id'] },
      { fields: ['environment_id'] },
      { fields: ['room_id'] }
    ],
    comment: '笼位表'
  });

  return Cage;
};
