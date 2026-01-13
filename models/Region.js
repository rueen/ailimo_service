/**
 * 地区模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Region = sequelize.define('Region', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '地区ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '地区名称'
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      comment: '行政区划代码'
    },
    parent_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
      comment: '父级ID（0为顶级）'
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '层级：1=省，2=市，3=区'
    },
    sort_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态：0=禁用，1=启用'
    }
  }, {
    tableName: 'regions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['code'] },
      { fields: ['parent_id'] },
      { fields: ['level'] }
    ],
    comment: '地区表'
  });

  return Region;
};
