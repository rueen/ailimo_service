/**
 * 学院模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '学院ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '学院名称'
    },
    organization_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '所属组织机构ID'
    }
  }, {
    tableName: 'departments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['organization_id'] },
      { unique: true, fields: ['name', 'organization_id'] }
    ],
    comment: '学院表'
  });

  return Department;
};
