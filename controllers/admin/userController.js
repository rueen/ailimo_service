/**
 * 管理端用户管理控制器
 */
const userService = require('../../services/admin/userService');
const { response } = require('../../utils');

/**
 * 获取用户列表
 */
const getUserList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await userService.getUserList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取用户详情
 */
const getUserDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await userService.getUserDetail(id);
    return response.success(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建用户（管理端手动创建）
 */
const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body, req.userId);
    return response.success(res, user, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新用户
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.updateUser(id, req.body);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 审核用户
 */
const auditUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reject_reason } = req.body;
    const adminId = req.userId;

    if (!status || ![1, 2].includes(Number(status))) {
      return response.badRequest(res, '审核状态不正确');
    }

    await userService.auditUser(id, Number(status), reject_reason, adminId);
    
    const message = status == 1 ? '审核通过' : '审核拒绝';
    return response.success(res, null, message);
  } catch (err) {
    next(err);
  }
};

/**
 * 启用/禁用用户
 */
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === undefined || ![0, 1].includes(Number(status))) {
      return response.badRequest(res, '状态参数不正确');
    }

    await userService.toggleUserStatus(id, Number(status));
    
    const message = status == 1 ? '已启用' : '已禁用';
    return response.success(res, null, message);
  } catch (err) {
    next(err);
  }
};

/**
 * 删除用户
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteUser(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取组织机构列表
 */
const getOrganizationList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await userService.getOrganizationList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建组织机构
 */
const createOrganization = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (!name) {
      return response.badRequest(res, '组织名称不能为空');
    }

    const organization = await userService.createOrganization(name);
    return response.success(res, organization, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新组织机构
 */
const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return response.badRequest(res, '组织名称不能为空');
    }

    await userService.updateOrganization(id, name);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除组织机构
 */
const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteOrganization(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取学院列表
 */
const getDepartmentList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await userService.getDepartmentList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取学院详情
 */
const getDepartmentDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const department = await userService.getDepartmentDetail(id);
    return response.success(res, department);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建学院
 */
const createDepartment = async (req, res, next) => {
  try {
    const { name, organization_id } = req.body;

    if (!name || !organization_id) {
      return response.badRequest(res, '学院名称和组织机构不能为空');
    }

    const department = await userService.createDepartment(name, organization_id);
    return response.success(res, department, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新学院
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, organization_id } = req.body;

    if (!name || !organization_id) {
      return response.badRequest(res, '学院名称和组织机构不能为空');
    }

    await userService.updateDepartment(id, name, organization_id);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除学院
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteDepartment(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取学院选项列表
 */
const getDepartmentOptions = async (req, res, next) => {
  try {
    const { organization_id } = req.query;
    const departments = await userService.getDepartmentOptions(organization_id);
    return response.success(res, departments);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取课题组列表
 */
const getResearchGroupList = async (req, res, next) => {
  try {
    const params = req.query;
    const result = await userService.getResearchGroupList(params);
    return response.paginate(res, result.list, result.total, result.page, result.pageSize);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取课题组详情
 */
const getResearchGroupDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const group = await userService.getResearchGroupDetail(id);
    return response.success(res, group);
  } catch (err) {
    next(err);
  }
};

/**
 * 创建课题组
 */
const createResearchGroup = async (req, res, next) => {
  try {
    const { name, department_id, remark } = req.body;

    if (!name || !department_id) {
      return response.badRequest(res, '课题组名称和学院不能为空');
    }

    const group = await userService.createResearchGroup(name, department_id, remark);
    return response.success(res, group, '创建成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 更新课题组
 */
const updateResearchGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, department_id, remark } = req.body;

    if (!name || !department_id) {
      return response.badRequest(res, '课题组名称和学院不能为空');
    }

    await userService.updateResearchGroup(id, name, department_id, remark);
    return response.success(res, null, '更新成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 删除课题组
 */
const deleteResearchGroup = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userService.deleteResearchGroup(id);
    return response.success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
};

/**
 * 获取组织机构选项列表
 */
const getOrganizationOptions = async (req, res, next) => {
  try {
    const organizations = await userService.getOrganizationOptions();
    return response.success(res, organizations);
  } catch (err) {
    next(err);
  }
};

/**
 * 获取课题组选项列表
 */
const getResearchGroupOptions = async (req, res, next) => {
  try {
    const { department_id } = req.query;
    const groups = await userService.getResearchGroupOptions(department_id);
    return response.success(res, groups);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUserList,
  getUserDetail,
  createUser,
  updateUser,
  auditUser,
  toggleUserStatus,
  deleteUser,
  getOrganizationList,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getDepartmentList,
  getDepartmentDetail,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getDepartmentOptions,
  getResearchGroupList,
  getResearchGroupDetail,
  createResearchGroup,
  updateResearchGroup,
  deleteResearchGroup,
  getOrganizationOptions,
  getResearchGroupOptions
};
