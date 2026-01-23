/**
 * 实验代操作订单模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ExperimentOperation = sequelize.define('ExperimentOperation', {
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
    operation_content_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '操作内容ID'
    },
    animal_type_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '动物类型ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '动物数量'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '预约用户ID'
    },
    time_slots: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '预约时间段数组（日期+时间段），格式：["2026-01-22 09:00-12:00", "2026-01-22 13:00-18:00", "2026-01-23 09:00-12:00"]，支持跨天预约'
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
    },
    cancel_time: {
      type: DataTypes.DATE,
      comment: '取消时间'
    }
  }, {
    tableName: 'experiment_operations',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_sn'], unique: true },
      { fields: ['operation_content_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['source'] },
      { fields: ['created_by_admin_id'] }
    ],
    comment: '实验代操作订单表'
  });

  return ExperimentOperation;
};
