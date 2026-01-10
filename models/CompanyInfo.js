/**
 * 公司信息模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompanyInfo = sequelize.define('CompanyInfo', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '公司信息ID'
    },
    company_name: {
      type: DataTypes.STRING(200),
      comment: '公司名称'
    },
    company_address: {
      type: DataTypes.STRING(500),
      comment: '公司地址'
    },
    contact_phone: {
      type: DataTypes.STRING(50),
      comment: '联系电话'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '电子邮箱'
    },
    work_time: {
      type: DataTypes.STRING(200),
      comment: '工作时间'
    },
    company_intro: {
      type: DataTypes.TEXT,
      comment: '公司简介'
    },
    service_concept: {
      type: DataTypes.TEXT,
      comment: '服务理念'
    }
  }, {
    tableName: 'company_info',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    comment: '公司信息表'
  });

  return CompanyInfo;
};
