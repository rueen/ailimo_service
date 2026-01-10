/**
 * 试剂耗材订购订单模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ReagentOrder = sequelize.define('ReagentOrder', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '订单ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '试剂耗材名称'
    },
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '品牌ID'
    },
    specification_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '规格ID'
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '数量'
    },
    orderer_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '订购人姓名'
    },
    contact_phone: {
      type: DataTypes.STRING(11),
      allowNull: false,
      comment: '联系电话'
    },
    delivery_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '到货日期'
    },
    province: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '省份'
    },
    city: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '城市'
    },
    district: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '区县'
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '详细地址'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '状态：0-待处理 1-进行中 2-已拒绝 3-已完成 4-已取消'
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
    tableName: 'reagent_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['brand_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['delivery_date'] }
    ],
    comment: '试剂耗材订购订单表'
  });

  return ReagentOrder;
};
