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
      comment: '公司信息ID（固定为1）'
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: '公司信息内容（JSON格式，包含所有字段）'
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
