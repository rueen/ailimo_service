/**
 * 动物订购订单模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AnimalOrder = sequelize.define('AnimalOrder', {
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
    brand_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '品牌ID'
    },
    variety_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '种类/品系ID'
    },
    specification_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '规格ID'
    },
    gender: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '性别：0-雌性 1-雄性 2-不限'
    },
    supervisor_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '导师姓名'
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
    province_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '省份ID'
    },
    city_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '城市ID'
    },
    district_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '区县ID'
    },
    address: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '详细地址'
    },
    environment_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '环境ID'
    },
    requirement_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '要求ID'
    },
    user_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    need_ear_tag: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '是否打耳标：0-不需要 1-需要'
    },
    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '数量'
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
    },
    cancel_time: {
      type: DataTypes.DATE,
      comment: '取消时间'
    }
  }, {
    tableName: 'animal_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['order_sn'], unique: true },
      { fields: ['brand_id'] },
      { fields: ['user_id'] },
      { fields: ['status'] },
      { fields: ['delivery_date'] },
      { fields: ['source'] },
      { fields: ['created_by_admin_id'] }
    ],
    comment: '动物订购订单表'
  });

  return AnimalOrder;
};
