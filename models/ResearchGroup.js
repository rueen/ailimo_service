/**
 * 课题组模型
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ResearchGroup = sequelize.define('ResearchGroup', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      comment: '课题组ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '课题组名称'
    },
    organization_id: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '所属组织机构ID'
    }
  }, {
    tableName: 'research_groups',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['organization_id'] },
      { unique: true, fields: ['name', 'organization_id'] }
    ],
    comment: '课题组表'
  });

  return ResearchGroup;
};
