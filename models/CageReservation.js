/**
 * 笼位预约订单模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CageReservation = sequelize.define('CageReservation', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    order_sn: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '订单号'
    },
    source: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '订单来源：0-用户创建 1-管理员创建'
    },
    created_by_admin_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '创建管理员ID（仅管理员创建时有值）'
    },
    cage_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笼位ID'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '预约用户ID'
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
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '预约数量'
    },
    purpose_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用途ID'
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
    tableName: 'cage_reservations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_sn'], unique: true },
      { fields: ['cage_id'] },
      { fields: ['user_id'] },
      { fields: ['reservation_date'] },
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['created_by_admin_id'] }
    ],
    comment: '笼位预约订单表'
  });

  return CageReservation;
};
