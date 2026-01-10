/**
 * 笼位租赁时间段模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CageTimeSlot = sequelize.define('CageTimeSlot', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '时间段ID'
    },
    start_time: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: '开始时间'
    },
    end_time: {
      type: DataTypes.TIME,
      allowNull: false,
      comment: '结束时间'
    },
    description: {
      type: DataTypes.STRING(200),
      comment: '描述/备注'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  }, {
    tableName: 'cage_time_slots',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '笼位租赁时间段表'
  });

  return CageTimeSlot;
};
