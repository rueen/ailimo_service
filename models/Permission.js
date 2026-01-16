/**
 * 权限模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '权限ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '权限名称'
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: '权限代码'
    },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: '父级权限ID（0表示顶级）'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['code'] },
      { fields: ['parent_id'] }
    ],
    comment: '权限表'
  });

  return Permission;
};
