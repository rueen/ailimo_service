# 省市区数据导入说明

## 当前状态

`regions.sql` 文件包含**示例数据**：
- 34个省级行政区（完整）
- 广东省的21个市（完整）
- 深圳市、广州市的区县（完整）
- 其他省市区数据需要补充

## 获取完整数据

### 方案一：使用开源数据（推荐）

1. **GitHub 开源项目**（推荐）
   - 项目：[modood/Administrative-divisions-of-China](https://github.com/modood/Administrative-divisions-of-China)
   - 数据格式：提供 SQL、JSON、CSV 等多种格式
   - 更新频率：每年更新
   - 数据量：约 3200+ 区县

2. **使用步骤**：
   ```bash
   # 1. 下载 SQL 文件
   # 访问 https://github.com/modood/Administrative-divisions-of-China
   # 下载 dist/pca-code.sql 文件
   
   # 2. 转换数据格式（需要调整字段名以匹配我们的表结构）
   # 原字段：code, name, province_code, city_code
   # 目标字段：id, name, code, parent_id, level, sort_order, status, created_at, updated_at
   
   # 3. 导入数据库
   mysql -u root -p ailimo < regions_full.sql
   ```

### 方案二：从国家统计局获取

1. **数据来源**：http://www.stats.gov.cn/sj/tjbz/tjyqhdmhcxhfdm/
2. **特点**：最权威、最新，但需要编写爬虫脚本抓取
3. **适用场景**：对数据权威性要求极高的项目

## 数据转换说明

如果使用开源数据，需要注意字段映射：

| 开源数据字段 | 本项目字段 | 说明 |
|------------|----------|------|
| code | code | 行政区划代码 |
| name | name | 地区名称 |
| - | parent_id | 需要根据 code 计算 |
| - | level | 1=省，2=市，3=区 |
| - | sort_order | 排序，可用 id |
| - | status | 默认 1（启用） |
| - | created_at | NOW() |
| - | updated_at | NOW() |

## 快速导入示例数据

如果只是测试环境，当前的示例数据已足够使用：

```bash
# 1. 创建 regions 表（自动执行 Sequelize sync）
npm run dev

# 2. 导入示例数据
mysql -u root -p ailimo < database/regions.sql
```

## 数据结构

```sql
-- 省级：parent_id = 0, level = 1
-- 市级：parent_id = 省id, level = 2  
-- 区级：parent_id = 市id, level = 3
```

## 后续优化建议

1. **性能优化**：添加 Redis 缓存，地区数据变化频率极低
2. **数据更新**：每年同步一次国家统计局最新数据
3. **扩展功能**：如需要街道、社区数据，可扩展 level = 4, 5
