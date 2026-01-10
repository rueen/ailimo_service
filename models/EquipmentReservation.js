/**
 * 设备租赁订单模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EquipmentReservation = sequelize.define('EquipmentReservation', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    equipment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '设备ID'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '预约用户ID'
    },
    reservation_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '预约日期'
    },
    time_slots: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '预约时间段数组（时间段快照），格式：["09:00-10:00", "10:00-11:00"]'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '状态：0-待审核 1-进行中 2-已拒绝 3-已完成 4-已取消'
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注'
    },
    handler_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '负责人ID'
    },
    reject_reason: {
      type: DataTypes.STRING(500),
      comment: '拒绝原因'
    },
    audit_time: {
      type: DataTypes.DATE,
      comment: '审核时间'
    },
    audit_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '审核人ID'
    },
    completed_time: {
      type: DataTypes.DATE,
      comment: '完成时间'
    }
  }, {
    tableName: 'equipment_reservations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['equipment_id'] },
      { fields: ['user_id'] },
      { fields: ['reservation_date'] },
      { fields: ['status'] }
    ],
    comment: '设备租赁订单表'
  });

  return EquipmentReservation;
};
