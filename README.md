# Quiet Wisp · 清微随晚风

> 清微随晚风，温月入云丛。✨

一个以「日常动态」为核心的个人日记博客。写一句话、放几张照片，或者写一整篇 Markdown；界面会从封面照片里自动提取主色，跟着照片一起慢慢换色。

## 功能

- **日常动态**：按天分组的动态流，含时间、心情、天气、地点、标签、置顶与点赞。
- **搜索与分页**：搜索、标签筛选在服务端按 URL 参数完成；首页默认只下发 10 篇摘要，每次可多翻 10 篇，最多 100 篇，更早的内容去归档页。
- **发布与编辑**：标题、Markdown 正文、实时预览、并排预览、表情/天气/地点/标签、自定义发布时间。
- **图片**：拖拽、点击或直接粘贴图片；浏览器端压缩并生成 WebP，上传到私有对象存储；每篇最多 9 张，单张不超过 20MB，第一张为封面，可随时更换，也可逐张填写图片说明（alt）。
- **私密相册墙**：登录后才能进入的生活照片墙，对象存储桶保持私有，页面使用临时签名地址；支持批量直传、懒加载、主题适配、键盘切换、预览和删除。
- **自动取色**：从封面照片提取色板，作为这一篇的主题色；详情页可以「用到全站」。
- **跟随照片换肤**：打开开关后，滚动动态流时页面主色会跟着当前日记的配图变化；也可以在色板面板里手动选色。
- **明暗两种氛围**：日间奶油纸张 / 夜间深棕，偏好保存在浏览器。
- **阅读与整理**：归档页月度日历、RSS、sitemap、OG 分享图、404 页面；Markdown 标题带锚点，代码块可一键复制。
- **交互细节**：灯箱与确认弹层有焦点陷阱；支持明暗主题、跟随配图换色、图片灯箱与移动端底部导航。
- **草稿**：发布页会自动把未发布内容存在本机 localStorage，刷新或离开后可恢复。
- **主人鉴权**：只有登录后的主人可以写、改、删、点赞与上传；访客只读。密码可在账户页修改。
- **数据存储**：日记、配图元数据、相册元数据、点赞、账号与登录会话存进 Neon；新上传的图片放在 iDrive e2；示例图随仓库保存在 `public/images`。

## 技术栈

- Next.js 16（App Router、Cache Components、Server Actions、Turbopack）
- React 19
- Drizzle ORM + Neon PostgreSQL（`pg` 连接池，支持事务）
- Tailwind CSS 4（用于 reset，视觉样式以 `app/globals.css` 为主）
- `marked`：Markdown 渲染，配合白名单式 URL 过滤与 HTML 转义
- Bun：包管理与部分脚本；Next 运行时使用 Node.js

## 快速开始

**环境要求**：Node.js `>=20.9.0`（运行 Next.js），Bun 1.3+（安装依赖与执行脚本）。

```bash
bun install
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL 与 NEXT_PUBLIC_SITE_URL
bun run db:migrate   # 应用 drizzle/ 中的 SQL 迁移，创建数据库表
bun run db:seed      # 可选：写入 9 篇示例日记（数据库已有文章时会跳过）
bun run dev          # 启动 Next.js
```

打开 [http://localhost:3000](http://localhost:3000)。

`.env` 示例：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/neondb?sslmode=verify-full&channel_binding=require"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_ICP_NUMBER=
OWNER_USERNAME=qinwei
OWNER_INITIAL_PASSWORD=change-me
OBJECT_STORAGE_BUCKET=diary-weiqin
OBJECT_STORAGE_REGION=ap-southeast-2
OBJECT_STORAGE_ENDPOINT=https://s3.ap-southeast-2.idrivee2.com
OBJECT_STORAGE_ACCESS_KEY_ID=你的访问密钥 ID
OBJECT_STORAGE_SECRET_ACCESS_KEY=你的 Secret Access Key
```

`.env` 已在 `.gitignore` 中，不要把真实连接串提交到仓库。`NEXT_PUBLIC_SITE_URL` 会影响 RSS、sitemap 与 Open Graph 中的绝对链接。

### 当前数据库

本机的 `.env` 已经指向一个 Neon PostgreSQL 数据库，四张表和原有数据已迁移。初始化其他空数据库时：

```bash
bun run db:migrate
bun run db:seed
bun run db:studio   # 在浏览器里查看/编辑数据
```

`db:seed` 会先确保主人账号存在，再在文章表为空时写入示例日记。如果 `data/posts.json` 存在，会优先使用它作为种子（这是从早期本地 JSON 存储迁移出来的备份）；否则使用 `lib/seed.ts` 里的内置示例。`OWNER_*` 只在账号不存在时生效，不会重置后来改过的密码。

## 使用说明

| 位置 | 可以做什么 |
| --- | --- |
| 首页 | 搜索（输入后按 Enter，按 `/` 快速聚焦）、标签筛选、点赞、点击色板取色、开启「跟随配图换色」、分页阅读 |
| 写日记 | Markdown 工具栏、编写/预览/并排三种模式、拖拽/粘贴图片、封面与自动取色、逐张图片说明、标签建议、置顶 |
| 详情页 | 灯箱查看大图、复制链接、编辑/删除、相邻文章、把这一篇的配色用到全站、标题锚点与代码复制 |
| 归档 | 按月浏览、写作日历、跳转到具体文章 |
| 登录 / 账户 | `/login` 登录；`/account` 查看账号、修改密码、退出登录 |
| 关于 | 站点介绍、最近状态与元素参考 |

Markdown 快捷键：`⌘/Ctrl + B` 加粗、`⌘/Ctrl + I` 斜体、`⌘/Ctrl + Enter` 发布。

## 主人账号与鉴权

- 初始账号和密码来自 `.env` 的 `OWNER_USERNAME` / `OWNER_INITIAL_PASSWORD`，由 `db:seed` 首次创建；迁移会保留原账号和密码哈希。
- 登录后到 `/account` 修改密码。新密码至少 6 位；修改成功后所有设备会退出登录，需要用新密码重新登录。
- 访客可以读首页、详情、归档、RSS 和关于页，但不能发布、编辑、删除、点赞或上传图片；这些操作在 Server Action / API 层也会再次校验，不能靠隐藏按钮绕过。
- 密码用 Node `scrypt` 加盐哈希保存；登录会话是数据库里的随机 token（只存哈希），通过 `httpOnly` Cookie 传递，30 天过期。修改密码会清空该账号全部会话。
- 登录失败 5 次会锁定 1 分钟，限流键是「IP + 用户名」；修改密码的当前密码校验也有独立限流（进程内尽力而为；多实例部署应在网关加持久限流）。
- 当前没有注册入口，也不支持多用户。若要公开分享写权限，请自行加 Auth.js、邀请制或反向代理层的访问控制。

## 找回密码 / 维护

忘记密码时可以在服务器上重置（不会影响文章和上传文件）：

```bash
NEW_PASSWORD='至少6位的新密码' bun run db:reset-password
```

重置会同时清空该账号的所有登录会话，并重新要求修改密码。

数据库里的过期会话会在下次登录时顺手清理；上传目录里的孤儿文件可以用维护脚本处理（默认只预览，不删除）：

```bash
bun run db:cleanup          # dry run：列出过期会话和超过 24 小时未引用的上传文件
bun run db:cleanup --apply  # 真正删除
```

## 性能与缓存

- 首页只把 `PostSummary`（标题、摘要、阅读时长、配图、主题色等）传给浏览器；正文不会进入首页的客户端载荷。搜索和筛选在服务端基于缓存的文章数据完成，然后只下发展示所需的摘要。
- 首页默认 10 篇，每次「再往下翻十篇」增加 10 篇，最多 100 篇；超过后引导去归档页。
- 点赞是高频小写入，不再调用 `updateTag("diary")` 让全站缓存失效；按钮会立即用返回的点赞数更新，其他页面按 `cacheLife("minutes")` 的节奏自然刷新。
- 发布、编辑、删除仍然会 `updateTag` + `revalidatePath`，保证写完后立即看到新内容。

## 自动化测试

```bash
bun test
```

覆盖了登录回跳路径的开放重定向防护、Markdown HTML/协议清洗、标题锚点与代码块复制标记、首页搜索/分页辅助函数、密码哈希。端到端登录/写删流程可在 README 的手动步骤之外按需扩展为 Playwright 测试。

## 数据模型

见 [`lib/schema.ts`](lib/schema.ts)：

- `Post`：标题、Markdown 正文、心情、天气、地点、标签数组、发布时间、编辑时间、置顶、点赞数。
- `PostImage`：所属文章、URL、宽高、alt、主色、色板、排序；随文章级联删除。
- `User` / `Session`：主人账号与登录会话；只存密码哈希和会话 token 哈希。
- 主题色不单独入库，读取时由封面图的色板即时计算，避免颜色和图片不同步。

Drizzle Kit 配置在 [`drizzle.config.ts`](drizzle.config.ts)，SQL 迁移和快照在 `drizzle/`。修改模型后执行 `bun run db:generate` 生成迁移，审阅 SQL 后执行 `bun run db:migrate`。开发时也可用 `db:push` 直接同步结构，但正式环境应使用迁移；同一数据库不要混用 push 初始化和初始建表迁移。

[`lib/db.ts`](lib/db.ts) 使用 Drizzle 的 `node-postgres` 驱动连接 Neon 的池化地址，启用 TLS 和 channel binding，开发热更新时复用最多 3 条连接的池。运行时不需要生成客户端。保存日记与替换配图、修改密码与注销会话均在事务中完成。

读取层在 `lib/posts.ts` 使用 `use cache` + `cacheTag("diary")` + `cacheLife("minutes")`；写操作在 `lib/actions.ts` 里通过 `updateTag` 和 `revalidatePath` 刷新缓存，因此发布、编辑、删除、点赞后页面会立即更新。

## 图片存放在哪里

- 示例图片：`public/images/`，随仓库提交。
- 日记新图：iDrive e2 私有桶的 `diary/` 前缀；数据库中保存应用内代理 URL、尺寸和色板，服务端按需签发临时读取地址。
- 私密相册：iDrive e2 私有桶的 `album/` 前缀，数据库保存对象键、尺寸、文件大小、说明和色板；只有登录后的主人能读取相册列表和临时图片地址。
- 上传时会先在浏览器里缩放/转 WebP，并提取主色，再由应用服务器写入对象存储。对象桶保持私有，密钥仅放在服务端环境变量中。

> 示例图保存在 `public/images/`，随应用部署；用户上传的日记图片和相册照片保存在 iDrive e2。删除文章或相册照片时会清理不再引用的对象。

## 部署注意

1. 使用 Node.js 运行时执行 `bun run build` / `bun run start`。
2. 在部署环境设置 `DATABASE_URL`、`NEXT_PUBLIC_SITE_URL`，并在取得工信部备案号后设置 `NEXT_PUBLIC_ICP_NUMBER`。
3. 部署前执行 `bun run db:migrate`，应用已审阅的 SQL 迁移。Neon 使用控制台提供的 pooled connection string。
4. 在部署环境设置 `OBJECT_STORAGE_BUCKET`、`OBJECT_STORAGE_REGION`、`OBJECT_STORAGE_ENDPOINT`、`OBJECT_STORAGE_ACCESS_KEY_ID` 和 `OBJECT_STORAGE_SECRET_ACCESS_KEY`。
5. 当前上传由应用服务器转发。Vercel Functions 的请求体有约 4.5 MB 上限；若要稳定支持接近 20 MB 的原图，需要改用受登录校验保护的浏览器直传或分片上传流程。
6. 上线前修改初始密码，并把 `NEXT_PUBLIC_SITE_URL` 设为真实的 `https://` 地址；登录 Cookie 会据此启用 Secure。
7. 登录限流是单进程内存实现；多实例或公开站点建议在反向代理 / 网关再加一层限流。
8. 关于页的版式元素与灵感参考了哔哩哔哩创作者 **@ZipZipPipe**，链接在页面底部。

## 常用命令

```bash
bun run dev          # 开发模式
bun run build        # 生产构建
bun run start        # 启动生产服务
bun run lint         # ESLint
bun run db:generate  # 根据 lib/schema.ts 生成 SQL 迁移
bun run db:migrate   # 应用 SQL 迁移
bun run db:push      # 开发时直接同步 schema（正式环境使用 migrate）
bun run db:seed      # 写入示例数据（已有文章则跳过）
bun run db:studio    # Drizzle Studio
bun run db:check     # 只读核对数据、索引和图片引用
bun run db:reset-password  # 重置主人密码（NEW_PASSWORD=...）
bun run db:cleanup         # 清理过期会话 / 孤儿上传（先 dry run）
bun test                   # 单元测试
bun run test:db            # Neon 集成测试，创建并清理独立测试记录
```

## 目录速览

```text
app/                路由、页面、Server Actions 页面入口
  compose/          写日记/编辑
  posts/[id]/       日记详情
  login/            登录
  account/          账户、改密与退出
  archive/          归档
  api/upload/       日记图片上传接口
  api/album/        私密相册预签名上传与保存接口
  api/media/        日记图片临时访问代理
album/              登录后可见的私密相册墙
components/         首页动态流、主题控制、编辑器、灯箱等
lib/                Drizzle 模型与数据读取、鉴权/密码、校验、取色、Markdown、聚合计算
drizzle/            SQL 迁移、journal 与模型快照
drizzle.config.ts   Drizzle Kit 配置
public/images/      示例图与 OG 分享图
public/uploads/     历史本地上传（gitignore）
scripts/            seed、数据迁移、完整性检查、重置密码和清理维护脚本
tests/              Bun 单元测试
```

## 数据迁移与验证

本次从 Prisma Postgres 迁移到 Neon 保留了所有记录 ID、字段、密码哈希、会话哈希与时间戳。图片 URL 使用本地静态资源或对象存储代理地址；新增的 `AlbumImage` 表只保存相册元数据和对象键，不把图片文件写进 Neon。

可运行 `bun run db:check` 进行只读完整性检查；`bun run test:db` 使用独立测试账号和日记，验证服务端增删改、并发点赞、外键、事务回滚、登录、改密及对象存储上传与删除，结束后清理测试数据。集成测试需要 Neon 和对象存储密钥；单元测试 `bun test` 不访问数据库或云存储。

如需再次迁移，在被 Git 忽略的 `.env.migration` 中配置 `SOURCE_DATABASE_URL` 和 `TARGET_DATABASE_URL`，然后运行 `bun run db:migrate-data`。脚本会先将源数据保存在 `data/database-backups/`（Git 忽略，目录权限 700、文件权限 600），应用目标库迁移，再在一个事务中导入并逐字段验证。目标有不同数据时会拒绝覆盖；如果源库迁移期间发生变更，也会报错，不能继续切换连接。迁移时应暂停源站写入。数据量较大时请改用 PostgreSQL 原生备份与恢复工具。

本机 `.env.prisma-backup` 保留了迁移前的环境配置。切换后若已产生新的写入，回滚连接前需要先同步这些新增数据。备份文件包含账号哈希等私有数据，请勿公开分享。
