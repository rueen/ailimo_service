/**
 * 用户模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '姓名'
    },
    phone: {
      type: DataTypes.STRING(11),
      allowNull: false,
      unique: true,
      comment: '手机号'
    },
    province_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '省份ID'
    },
    city_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '城市ID'
    },
    district_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '区县ID'
    },
    address: {
      type: DataTypes.STRING(200),
      comment: '详细地址'
    },
    organization_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '所属组织机构ID'
    },
    research_group_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      comment: '所属课题组ID'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    },
    audit_status: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
      comment: '审核状态：0-待审核 1-审核通过 2-审核拒绝'
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
      comment: '审核人ID（管理员）'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['phone'] },
      { fields: ['organization_id'] },
      { fields: ['research_group_id'] },
      { fields: ['audit_status'] },
      { fields: ['status'] }
    ],
    comment: '用户表'
  });

  return User;
};
