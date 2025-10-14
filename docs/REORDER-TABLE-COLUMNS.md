# 重新排列数据库表字段顺序

## 问题

`name_cn` 字段在 `languages` 表中位于最末尾（第13位），而不是在Prisma Schema中定义的位置（第4位，`name`字段后面）。

**当前顺序**:
```
1. id
2. code
3. name
4. native_name
5. flag
6. locale_code
7. is_default
8. is_enabled
9. sort_order
10. direction
11. created_at
12. updated_at
13. name_cn          ← 在最末尾
```

**期望顺序**:
```
1. id
2. code
3. name
4. name_cn           ← 应该在这里
5. native_name
6. flag
... (其他字段)
```

## 原因

PostgreSQL的 `ALTER TABLE ADD COLUMN` 会将新列追加到表末尾，这是数据库引擎的设计限制。

## 解决方案

### 方案1: 重建表（完全重新排列）

**优点**: 字段顺序完全按照Prisma Schema定义
**缺点**: 需要停机时间，数据量大时较慢

#### 步骤：

1. **创建迁移脚本**

```sql
-- 1. 创建临时表（按正确顺序）
CREATE TABLE languages_new (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  name_cn       TEXT NOT NULL DEFAULT '',
  native_name   TEXT NOT NULL,
  flag          TEXT,
  locale_code   TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  is_enabled    BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  direction     TEXT NOT NULL DEFAULT 'ltr',
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL
);

-- 2. 复制数据（按新顺序）
INSERT INTO languages_new (
  id, code, name, name_cn, native_name, flag, locale_code,
  is_default, is_enabled, sort_order, direction, created_at, updated_at
)
SELECT
  id, code, name, name_cn, native_name, flag, locale_code,
  is_default, is_enabled, sort_order, direction, created_at, updated_at
FROM languages;

-- 3. 删除旧表
DROP TABLE languages;

-- 4. 重命名新表
ALTER TABLE languages_new RENAME TO languages;

-- 5. 重建索引
CREATE UNIQUE INDEX languages_code_key ON languages(code);
CREATE INDEX languages_is_enabled_idx ON languages(is_enabled);
CREATE INDEX languages_is_default_idx ON languages(is_default);
CREATE INDEX languages_sort_order_idx ON languages(sort_order);
```

2. **执行迁移**

```bash
# 方法A: 使用Prisma migrate
cd /Users/yangnie/Desktop/game/rungame-nextjs
npx prisma migrate dev --name reorder_languages_columns

# 方法B: 手动执行SQL
# 将上面的SQL保存为 reorder.sql，然后执行
psql $DATABASE_URL -f reorder.sql
```

3. **重新生成Prisma Client**

```bash
npx prisma generate
```

### 方案2: 创建视图（推荐，无需停机）

创建一个按正确顺序的视图：

```sql
CREATE OR REPLACE VIEW languages_ordered AS
SELECT
  id,
  code,
  name,
  name_cn,
  native_name,
  flag,
  locale_code,
  is_default,
  is_enabled,
  sort_order,
  direction,
  created_at,
  updated_at
FROM languages;
```

然后在应用中使用视图而不是原表。

**优点**:
- 无需停机
- 不影响现有数据
- 查询时字段按正确顺序返回

**缺点**:
- 需要修改应用代码使用视图
- Prisma不直接支持视图（需要手动定义）

### 方案3: 接受现状（推荐用于开发环境）

**字段顺序不影响功能**，只是在数据库管理工具中查看时的视觉问题。

**理由**:
- ✅ Prisma根据Schema定义生成代码，不依赖数据库字段顺序
- ✅ SQL查询使用字段名而非位置
- ✅ 应用层完全不受影响
- ✅ 避免不必要的数据库迁移风险

**建议**:
- 开发环境：保持现状
- 生产环境部署前：如果需要，可以重建表调整顺序

## 使用场景建议

| 场景 | 推荐方案 | 原因 |
|------|---------|------|
| 开发环境 | 方案3（接受现状） | 避免频繁迁移 |
| 测试环境 | 方案1或3 | 可以测试重建流程 |
| 生产环境（小数据量） | 方案1（重建表） | 一次性调整到位 |
| 生产环境（大数据量） | 方案3（接受现状） | 避免长时间锁表 |
| 必须调整且不能停机 | 方案2（视图） | 需要代码配合 |

## 执行重建表的Shell脚本

如果决定重建表，可以使用以下脚本：

```bash
#!/bin/bash
# reorder-languages-table.sh

cd /Users/yangnie/Desktop/game/rungame-nextjs

echo "⚠️  警告：即将重建 languages 表以调整字段顺序"
echo "📊 当前数据将被保留，但表会被暂时锁定"
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ 操作已取消"
  exit 1
fi

echo "🔄 正在备份数据..."
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const languages = await prisma.language.findMany();
  const fs = require('fs');
  fs.writeFileSync('languages-backup.json', JSON.stringify(languages, null, 2));
  console.log('✅ 备份完成: languages-backup.json');
  await prisma.\$disconnect();
}
main();
"

echo "🔨 正在重建表..."
psql $DATABASE_URL <<EOF
BEGIN;

-- 创建新表
CREATE TABLE languages_new (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  name_cn       TEXT NOT NULL DEFAULT '',
  native_name   TEXT NOT NULL,
  flag          TEXT,
  locale_code   TEXT NOT NULL,
  is_default    BOOLEAN NOT NULL DEFAULT false,
  is_enabled    BOOLEAN NOT NULL DEFAULT true,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  direction     TEXT NOT NULL DEFAULT 'ltr',
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  updated_at    TIMESTAMP NOT NULL
);

-- 复制数据
INSERT INTO languages_new SELECT
  id, code, name, name_cn, native_name, flag, locale_code,
  is_default, is_enabled, sort_order, direction, created_at, updated_at
FROM languages;

-- 替换表
DROP TABLE languages;
ALTER TABLE languages_new RENAME TO languages;

-- 重建索引
CREATE INDEX languages_code_idx ON languages(code);
CREATE INDEX languages_is_enabled_idx ON languages(is_enabled);
CREATE INDEX languages_is_default_idx ON languages(is_default);
CREATE INDEX languages_sort_order_idx ON languages(sort_order);

COMMIT;
EOF

echo "✅ 表重建完成"
echo "🔄 重新生成 Prisma Client..."
npx prisma generate

echo "✅ 全部完成！"
```

## 重要提醒

⚠️ **生产环境操作前必须**：
1. 完整备份数据库
2. 在测试环境验证脚本
3. 选择低峰期执行
4. 准备回滚方案
5. 通知相关人员停机时间

## 结论

对于当前情况，**推荐方案3（接受现状）**：
- 字段顺序不影响应用功能
- 避免不必要的风险
- 如果未来真的需要，可以在下次大版本迁移时一并处理
