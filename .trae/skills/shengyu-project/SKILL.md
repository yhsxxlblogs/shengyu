---
name: "shengyu-project"
description: "声愈项目的技术文档和开发指南。包含项目概述、技术栈、目录结构、核心功能等信息。当用户在声愈项目目录下新开对话时自动预热。"
---

# 声愈项目技能

## 项目概述

**声愈**是一个动物声音社交应用，用户可以录制、分享动物声音，发布帖子进行社交互动，支持私信聊天功能。项目采用前后端分离架构，前端为uni-app跨平台应用，后端为Node.js + Express RESTful API服务。

### 核心功能

1. **声音录制与播放** - 录制动物声音，分类浏览官方声音库
2. **社区互动** - 发布帖子、点赞、评论、关注用户
3. **私信系统** - 实时WebSocket聊天，支持未读消息提醒
4. **用户管理** - 注册登录、头像上传、个人主页
5. **后台管理** - 轮播图管理、通知发布、内容审核
6. **二维码扫描** - 支持扫描二维码，跳转链接或识别内容
7. **热门推荐** - 首页展示高热度帖子（按点赞数+评论数排序），支持Redis缓存和定时更新

## 技术栈

### 前端 (shengyu-app)

| 技术 | 版本 | 说明 |
|------|------|------|
| uni-app | Vue 3 | 跨平台应用框架 |
| Vue | 3.x | 前端框架 |
| JavaScript | ES6+ | 开发语言 |
| uni-ui | - | uni-app官方UI组件 |

### 后端 (shengyu-backend)

| 技术 | 版本 | 说明 |
|------|------|------|
| Node.js | - | 运行环境 |
| Express | 5.2.1 | Web框架 |
| MySQL2 | 3.20.0 | 数据库驱动 |
| Redis | 3.1.2 | 缓存数据库 |
| JWT | 9.0.3 | 身份认证 |
| bcrypt | 6.0.0 | 密码加密 |
| multer | 2.1.1 | 文件上传 |
| cors | 2.8.6 | 跨域处理 |

## 项目结构

### 前端目录结构 (shengyu-app)

```
shengyu-app/
├── App.vue                    # 应用入口组件
├── main.js                    # 应用入口JS
├── manifest.json              # 应用配置
├── pages.json                 # 页面路由配置
├── uni.scss                   # 全局样式变量
├── index.html                 # HTML模板
├── pages/                     # 页面目录
│   ├── main/                  # 主页面（三栏Tab）
│   ├── login/                 # 登录页
│   ├── register/              # 注册页
│   ├── index/                 # 首页（声音分类）
│   ├── community/             # 社区页
│   ├── profile/               # 个人中心
│   ├── search/                # 搜索页
│   ├── record/                # 录音页
│   ├── sound-detail/          # 声音详情
│   ├── sound-player/          # 声音播放器
│   ├── publish/               # 发布帖子
│   ├── post-detail/           # 帖子详情
│   ├── my-posts/              # 我的帖子
│   ├── my-sounds/             # 我的录音
│   ├── my-likes/              # 我的点赞
│   ├── messages/              # 私信列表
│   ├── chat/                  # 聊天页面
│   ├── follows/               # 关注/粉丝列表
│   ├── user-profile/          # 用户主页
│   ├── scan/                  # 二维码扫描页
│   └── about/                 # 关于我们
├── components/                # 公共组件
│   ├── custom-tabbar/         # 自定义TabBar
│   ├── cute-modal/            # 模态框组件
│   ├── cute-toast/            # Toast组件
│   └── SvgIcon/               # SVG图标组件
├── utils/                     # 工具函数
│   ├── api.js                 # API接口配置
│   └── websocket.js           # WebSocket封装
├── static/                    # 静态资源
│   └── styles/
│       └── theme.css          # 主题样式
└── unpackage/                 # 打包输出目录
```

### 后端目录结构 (shengyu-backend)

```
shengyu-backend/
├── index.js                   # 服务入口文件
├── package.json               # 项目依赖
├── config/                    # 配置文件
│   ├── db.js                  # 数据库配置
│   └── redis.js               # Redis配置
├── routes/                    # 路由模块
│   ├── auth.js                # 认证路由
│   ├── sound.js               # 声音路由
│   ├── post.js                # 帖子路由
│   ├── social.js              # 社交路由（关注/私信）
│   ├── admin.js               # 管理后台路由
│   └── banner.js              # 轮播图路由
├── middleware/                # 中间件
│   └── cache.js               # Redis缓存中间件
├── utils/                     # 工具函数
│   └── captcha.js             # 验证码生成
├── uploads/                   # 上传文件目录
│   ├── avatars/               # 头像
│   ├── sounds/                # 音频文件
│   └── images/                # 图片
├── admin/                     # 管理后台静态页面
├── database/                  # 数据库文件
│   ├── backup_*.sql           # 数据库备份
│   └── README.md              # 数据库文档
├── nginx/                     # Nginx配置
├── migrations/                # 数据库迁移
├── seed.js                    # 数据种子
├── loadtest.js                # 压力测试脚本
└── server.log                 # 服务日志
```

## 数据库设计

### 核心数据表

| 表名 | 说明 | 核心字段 |
|------|------|----------|
| users | 用户表 | id, username, email, password, avatar, is_admin |
| sounds | 声音表 | id, user_id, animal_type, emotion, sound_url, duration, visible, review_status, is_official |
| posts | 帖子表 | id, user_id, content, image_url |
| likes | 点赞表 | id, post_id, user_id |
| comments | 评论表 | id, post_id, user_id, content |
| follows | 关注表 | id, follower_id, following_id |
| messages | 私信表 | id, sender_id, receiver_id, content, is_read |
| favorites | 收藏表 | id, user_id, sound_id |
| notifications | 通知表 | id, title, content, type, status, publish_at |
| animal_types | 动物类型表 | id, type, name, icon, category, description |
| categories | 分类表 | id, name, display_name, sort_order |
| system_sounds | 系统声音表 | id, type_id, emotion, sound_url, duration |
| banners | 轮播图表 | id, title, image_url, link_url, sort_order, is_active |

## API接口设计

### 认证模块 (/api/auth)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /register | 用户注册 |
| POST | /login | 用户登录 |
| POST | /admin/login | 管理员登录（需验证码） |
| GET | /validate | 验证Token有效性 |
| GET | /user | 获取当前用户信息 |
| GET | /user/stats | 获取用户统计 |
| POST | /avatar | 上传头像 |
| GET | /search | 搜索用户 |
| GET | /user/:id | 获取用户公开信息 |

### 声音模块 (/api/sound)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /upload | 上传声音 |
| GET | /popular | 热门声音 |
| GET | /animal-types | 动物类型列表 |
| GET | /animal-types-grouped | 按分类分组的动物类型 |
| GET | /by-animal/:type | 按类型获取声音 |
| GET | /search | 搜索声音 |
| GET | /detail/:id | 声音详情 |
| GET | /my | 我的声音 |
| PUT | /:id/visibility | 切换可见性 |
| DELETE | /:id | 删除声音 |

### 帖子模块 (/api/post)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /create | 发布帖子 |
| GET | /list | 帖子列表 |
| GET | /popular | 热门帖子（按点赞+评论排序，前10条） |
| POST | /like/:post_id | 点赞/取消点赞 |
| POST | /comment/:post_id | 发表评论 |
| GET | /comments/:post_id | 获取评论 |
| GET | /my | 我的帖子 |
| GET | /likes | 我点赞的帖子 |
| GET | /liked-ids | 获取点赞的帖子ID列表 |
| DELETE | /delete/:post_id | 删除帖子 |
| GET | /detail/:post_id | 帖子详情 |

### 社交模块 (/api/social)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /follow/:userId | 关注/取消关注 |
| GET | /follow/check/:userId | 检查关注状态 |
| GET | /follows/:userId | 获取关注列表 |
| GET | /followers/:userId | 获取粉丝列表 |
| GET | /follow-stats/:userId | 获取关注统计 |
| GET | /following | 我的关注列表 |
| POST | /message | 发送私信 |
| GET | /messages | 私信列表 |
| GET | /messages/:userId | 聊天记录 |
| GET | /messages/unread/count | 未读消息数 |
| GET | /messages/limit/:userId | 私信限制状态 |
| DELETE | /messages/clear/:userId | 清空聊天记录 |

## WebSocket实时通信

### 连接方式

```
ws://106.14.248.12:3001?token={JWT_TOKEN}&userId={USER_ID}
```

### 消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| ping/pong | 双向 | 心跳检测 |
| chat_message | 客户端→服务端 | 发送消息 |
| new_message | 服务端→客户端 | 新消息通知 |
| message_sent | 服务端→客户端 | 消息发送成功确认 |
| typing | 双向 | 正在输入状态 |
| mark_read | 客户端→服务端 | 标记已读 |
| message_read | 服务端→客户端 | 消息已读通知 |
| unread_count | 服务端→客户端 | 未读消息数更新 |
| user_online/offline | 服务端→客户端 | 用户上下线通知 |

## 缓存策略

### Redis缓存配置

| 缓存键 | 过期时间 | 说明 |
|--------|----------|------|
| posts:list:* | 5分钟 | 帖子列表 |
| post:detail:* | 5分钟 | 帖子详情 |
| popular:posts | 10分钟 | 热门帖子（每5分钟自动更新） |
| popular:sounds | 10分钟 | 热门声音 |
| sounds:animal:* | 5分钟 | 分类声音 |
| follow:stats:* | 10分钟 | 关注统计 |

### 缓存清除时机

- 发布/删除帖子 → 清除帖子列表缓存
- 点赞/评论 → 清除相关帖子缓存
- 关注/取消关注 → 清除用户相关缓存

### 缓存问题防护

#### 1. 缓存雪崩 (Cache Avalanche)
**问题**：大量缓存同时过期，请求直接打到数据库
**解决方案**：
- 使用随机过期时间（5-10分钟随机）
- 定时任务提前更新缓存
- 代码示例：
```javascript
const baseTTL = 300; // 基础5分钟
const randomTTL = Math.floor(Math.random() * 300); // 随机0-5分钟
const cacheTTL = baseTTL + randomTTL; // 5-10分钟随机
```

#### 2. 缓存击穿 (Cache Breakdown)
**问题**：热点数据过期瞬间，大量请求同时查询数据库
**解决方案**：
- 热点数据永不过期（定时更新）
- 互斥锁防止并发重建缓存
- 热门帖子使用定时任务每5分钟更新，避免过期

#### 3. 缓存穿透 (Cache Penetration)
**问题**：查询不存在的数据，每次都要访问数据库
**解决方案**：
- 空值缓存（缓存空数组）
- 布隆过滤器（可选）
- 代码示例：
```javascript
// 即使结果为空，也缓存空数组
const cacheTTL = results.length > 0 ? 300 : 60; // 空数据缓存60秒
await redis.setAsync('popular:posts', JSON.stringify(results), cacheTTL);
```

## 安全设计

1. **JWT认证** - 使用JWT进行身份认证，过期时间1天
2. **密码加密** - 使用bcrypt进行密码哈希，salt rounds = 10
3. **验证码** - 管理员登录需要验证码，SVG格式，5分钟过期
4. **文件上传限制** - 限制文件类型和大小
5. **SQL注入防护** - 使用参数化查询
6. **CORS配置** - 允许跨域访问

## 部署架构

- **服务器**：CentOS 7+/Ubuntu 18.04+
- **Web服务器**：Nginx反向代理
- **进程管理**：PM2
- **数据库**：MySQL + Redis
- **安全**：HTTPS、防火墙配置、Fail2Ban
- **监控**：PM2监控、日志轮转
- **备份**：数据库备份脚本、定时任务

## 性能优化

- **前端**：图片懒加载、分页加载、骨架屏
- **后端**：Redis缓存、数据库连接池、索引优化
- **数据库**：索引优化、查询优化
- **部署**：Nginx静态资源缓存、负载均衡（可扩展）

## 开发规范

### 命名规范

- 文件名：kebab-case（如 sound-detail.vue）
- 组件名：PascalCase（如 CuteModal）
- 变量名：camelCase
- 常量名：UPPER_SNAKE_CASE

### 代码风格

- 使用ES6+语法
- 异步操作使用async/await
- 错误处理使用try/catch
- API响应统一格式：{ code, data, message }

### Git规范

- 分支：main（主分支）、dev（开发分支）
- 提交信息：清晰描述变更内容
- 定期备份数据库

## 待优化项

1. 图片CDN加速
2. 音频文件压缩转码
3. 消息队列处理通知
4. 数据库读写分离
5. API限流防刷
6. 单元测试覆盖
7. 热门帖子算法优化（考虑时间衰减因子）

## 文档资源

- **开发文档**：声愈项目开发文档.md
- **数据库设计**：声愈项目数据库与Redis设计详解.md
- **部署文档**：声愈项目部署文档.md
- **面试问题**：声愈项目面试核心问题.md

## 使用指南

1. **启动开发环境**：
   - 前端：`npm run dev:h5`
   - 后端：`node index.js` 或 `pm2 start index.js`

2. **构建生产版本**：
   - 前端：`npm run build:h5`
   - 后端：直接部署

3. **数据库初始化**：
   - 导入 `database/backup_*.sql` 文件
   - 运行 `seed.js` 填充初始数据

4. **部署流程**：
   - 参考 `声愈项目部署文档.md`

## 注意事项

1. **环境变量**：生产环境需要配置正确的数据库和Redis连接信息
2. **文件权限**：上传目录需要设置正确的权限
3. **安全配置**：生产环境需要配置HTTPS和防火墙
4. **性能监控**：定期检查服务器负载和数据库性能

## 技术亮点

1. **原生WebSocket实现** - 不依赖Socket.io，手动处理帧解析和握手，深入理解协议原理
2. **数据库规范化设计** - 遵循第三范式，使用视图和索引优化查询性能
3. **Redis缓存策略** - 缓存热点数据，解决缓存穿透、击穿、雪崩问题
4. **uni-app跨平台** - 一套代码适配多端，开发效率高
5. **软删除设计** - 私信功能采用软删除，保证双方数据完整性
6. **安全措施** - JWT认证、密码加密、验证码、SQL注入防护

## 常见问题

1. **WebSocket连接失败**：检查token是否有效，网络是否正常
2. **文件上传失败**：检查文件大小限制和目录权限
3. **数据库连接问题**：检查数据库配置和连接池设置
4. **性能问题**：检查Redis缓存是否正常，数据库索引是否优化

## 维护建议

1. **定期备份**：每天备份数据库和上传文件
2. **日志监控**：定期检查服务日志，及时发现问题
3. **安全更新**：定期更新依赖包和系统补丁
4. **性能优化**：根据流量情况调整缓存策略和服务器配置

## 总结

声愈项目是一个功能完整、技术栈合理、架构清晰的动物声音社交应用。项目采用了现代前端和后端技术，实现了核心的社交功能，并在性能、安全和用户体验方面做了充分的考虑。通过反规范化设计、Redis缓存、原生WebSocket等技术手段，保证了系统的性能和可靠性。

项目文档非常详细，涵盖了开发、部署、数据库设计等各个方面，为后续的维护和扩展提供了良好的基础。