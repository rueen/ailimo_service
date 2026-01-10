/**
 * 案例模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Case = sequelize.define('Case', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '案例ID'
    },
    project_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '项目名称'
    },
    project_summary: {
      type: DataTypes.TEXT,
      comment: '项目概述'
    },
    project_result: {
      type: DataTypes.TEXT,
      comment: '项目成果'
    },
    images: {
      type: DataTypes.JSON,
      comment: '案例图片数组（OSS地址）'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0-禁用 1-启用'
    }
  }, {
    tableName: 'cases',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['project_name'] }
    ],
    comment: '案例表'
  });

  return Case;
};
