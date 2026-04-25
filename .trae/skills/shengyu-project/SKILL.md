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
8. **微信登录** - 支持微信OAuth登录，账号绑定/解绑功能

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
│   ├── scan/                  # 二维码扫描页（支持闪光灯、相册识别）
│   └── about/                 # 关于我们
├── components/                # 公共组件
│   ├── custom-tabbar/         # 自定义TabBar
│   ├── cute-modal/            # 模态框组件
│   ├── cute-toast/            # Toast组件
│   └── SvgIcon/               # SVG图标组件（支持28+图标，统一1.8px线条风格）
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
│   ├── index.js               # 统一配置文件
│   ├── db.js                  # 数据库配置
│   └── redis.js               # Redis配置
├── routes/                    # 路由模块
│   ├── auth.js                # 认证路由
│   ├── sound.js               # 声音路由
│   ├── post.js                # 帖子路由
│   ├── social.js              # 社交路由（关注/私信）
│   ├── admin.js               # 管理后台路由
│   ├── banner.js              # 轮播图路由
│   └── wechat.js              # 微信登录路由
├── middleware/                # 中间件
│   ├── security.js            # 安全中间件（认证、XSS、SQL注入防护）
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
| users | 用户表 | id, username, email, password, avatar, is_admin, is_active |
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

**用户表微信登录字段：**
- `login_type`: ENUM('password', 'wechat') - 登录方式
- `wechat_openid`: VARCHAR(64) UNIQUE - 微信用户唯一标识
- `wechat_unionid`: VARCHAR(64) - 微信开放平台统一标识
- `wechat_avatar`: VARCHAR(255) - 微信头像URL
- `nickname`: VARCHAR(100) - 用户昵称

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
| GET | /admin/categories | 管理后台-获取分类 |
| POST | /admin/categories | 管理后台-添加分类 |
| PUT | /admin/categories/:id | 管理后台-更新分类 |
| DELETE | /admin/categories/:id | 管理后台-删除分类 |
| GET | /admin/animal-types | 管理后台-获取动物类型 |
| POST | /admin/animal-types | 管理后台-添加动物类型 |
| PUT | /admin/animal-types/:id | 管理后台-更新动物类型 |
| DELETE | /admin/animal-types/:id | 管理后台-删除动物类型 |
| GET | /admin/system-sounds | 管理后台-获取系统声音 |
| POST | /admin/system-sounds | 管理后台-添加系统声音 |
| PUT | /admin/system-sounds/:id | 管理后台-更新系统声音 |
| DELETE | /admin/system-sounds/:id | 管理后台-删除系统声音 |
| GET | /admin/user-sounds | 管理后台-获取用户声音 |
| PUT | /admin/user-sounds/:id/review | 管理后台-审核用户声音 |
| DELETE | /admin/user-sounds/:id | 管理后台-删除用户声音 |

### 帖子模块 (/api/post)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /create | 发布帖子 |
| GET | /list | 帖子列表 |
| GET | /popular | 热门帖子 |
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

### 微信登录模块 (/api/wechat)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /login | 微信登录（获取code后调用） |
| POST | /bind | 绑定微信到现有账号（需登录） |
| POST | /unbind | 解绑微信（需登录） |
| GET | /status | 获取微信绑定状态（需登录） |
| GET | /config | 获取微信配置（前端用） |

### 轮播图模块 (/api/banner)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /list | 获取轮播图列表 |
| GET | /admin/list | 管理后台-获取轮播图列表 |
| POST | /admin/create | 管理后台-创建轮播图 |
| PUT | /admin/update/:id | 管理后台-更新轮播图 |
| PUT | /admin/toggle/:id | 管理后台-切换轮播图状态 |
| DELETE | /admin/delete/:id | 管理后台-删除轮播图 |

### 管理后台模块 (/api/admin)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /users | 获取用户列表 |
| POST | /users | 添加用户 |
| PUT | /users/:id/status | 启用/禁用用户 |
| PUT | /users/:id/admin | 设置/取消管理员 |
| DELETE | /users/:id | 删除用户 |
| GET | /users/:id/posts | 获取用户帖子 |
| GET | /users/:id/sounds | 获取用户声音 |
| GET | /users/:id/comments | 获取用户评论 |
| GET | /posts | 获取帖子列表 |
| DELETE | /posts/:id | 删除帖子 |
| POST | /notification | 发送通知 |
| GET | /notification | 获取通知列表 |
| DELETE | /notification/:id | 删除通知 |

**微信登录流程**：
1. 前端调用 `plus.oauth.getServices` 获取微信服务
2. 调用 `wechatService.login()` 拉起微信授权
3. 用户确认后返回 `code` 和 `state`
4. 前端发送 `code` 到后端 `/api/wechat/login`
5. 后端用 `code` 换取 `access_token` 和 `openid`
6. 后端获取微信用户信息，创建/更新用户
7. 后端返回 JWT token，前端保存完成登录

**微信绑定功能**：
- 已登录用户可在"我的"页面绑定微信账号
- 绑定后支持使用微信快速登录
- 支持解绑微信（保留账号密码登录方式）
- 一个微信只能绑定一个账号

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

## 配置说明

### 后端配置 (config/index.js)

```javascript
const config = {
  // 服务器配置
  server: {
    port: 3000,
    wsPort: 3001,
    host: '0.0.0.0',
  },

  // 数据库配置
  database: {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '@Syh20050608',
    name: 'animal_sound_app',
    connectionLimit: 10,
    charset: 'utf8mb4',
  },

  // Redis配置
  redis: {
    host: 'localhost',
    port: 6379,
    password: '@Syh20050608',
    db: 0,
  },

  // JWT配置
  jwt: {
    secret: 'secret_key',
    expiresIn: '1d',
    refreshExpiresIn: '7d',
  },

  // 微信配置
  wechat: {
    appId: 'wx4e46471a06b5124c',
    appSecret: 'a4d717bdb57054454be38bcef2756318',
  },
  
  // 其他配置...
};
```

### 前端配置 (manifest.json)

```json
{
  "mp-weixin": {
    "appid": "wx4e46471a06b5124c"
  },
  "app-plus": {
    "distribute": {
      "sdkConfigs": {
        "oauth": {
          "weixin": {
            "appid": "wx4e46471a06b5124c",
            "appsecret": "a4d717bdb57054454be38bcef2756318"
          }
        }
      }
    }
  }
}
```

## 安全设计

1. **JWT认证** - 使用JWT进行身份认证，过期时间1天
2. **密码加密** - 使用bcrypt进行密码哈希，salt rounds = 10
3. **验证码** - 管理员登录需要验证码，SVG格式，5分钟过期
4. **文件上传限制** - 限制文件类型和大小
5. **SQL注入防护** - 使用参数化查询
6. **XSS防护** - 清理用户输入
7. **CORS配置** - 允许跨域访问

## 部署架构

- **服务器**：CentOS 7+/Ubuntu 18.04+
- **Web服务器**：Nginx反向代理
- **进程管理**：PM2
- **数据库**：MySQL + Redis
- **安全**：HTTPS、防火墙配置
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

## 前端页面样式规范

### 登录/注册页面

**图标尺寸**（2025-04-25优化）：
- 应用图标：200rpx × 200rpx（小屏幕160rpx，大屏幕220rpx）
- Logo图标：140rpx × 140rpx（小屏幕110rpx，大屏幕160rpx）
- 圆角：48rpx（小屏幕40rpx，大屏幕52rpx）
- 阴影：0 12rpx 40rpx rgba(255, 182, 193, 0.35)

**页面布局**（2025-04-25优化）：
- 顶部边距：100rpx（小屏幕80rpx，大屏幕120rpx）
- 容器宽度：78%（最大宽度480rpx）
- 元素间距：24rpx（小屏幕18rpx，大屏幕28rpx）

**输入框样式**（2025-04-25优化）：
- 高度：80rpx（小屏幕72rpx）
- 圆角：14rpx
- 内边距：0 20rpx
- 边框：2rpx solid #F0F0F0

**按钮样式**（2025-04-25优化）：
- 高度：76rpx（小屏幕68rpx）
- 圆角：38rpx
- 字体：30rpx
- 阴影：0 6rpx 20rpx rgba(255, 107, 157, 0.3)

**微信登录区域**（2025-04-25优化）：
- 与游客模式间距：120rpx
- 背景色：rgba(129, 199, 132, 0.06)（更淡）
- 边框颜色：rgba(129, 199, 132, 0.12)（减淡黑边）
- 图标颜色：#4CAF50（中等绿色，不深不浅）
- 图标背景：linear-gradient(135deg, #A8E6A3 0%, #C8E6C9 100%)（淡绿色渐变）

**提示消息样式**（2025-04-25优化）：
- 统一使用 `icon: 'none'` 纯文字提示
- 不使用 `icon: 'success'` 勾选图标
- 退出登录、登录成功等提示均为纯文字

**图标颜色规范**（2025-04-25优化）：
- 眼睛图标：#BBBBBB（淡化灰色）
- 返回箭头：#666666（中等灰色）
- 输入框图标：#FF9A9E（品牌粉色）
- 避免使用 #333、#999 等过深或过重的颜色

**边框颜色规范**（2025-04-25优化）：
- 输入框边框：#F0F0F0（最淡）
- 分割线：#EEEEEE（较淡）
- 按钮边框：#E8E8E8（淡色）
- 避免使用 #E0E0E0、#ddd 等较重的边框颜色

### 聊天页面

**页眉高度**（2025-04-25优化）：132rpx（原88rpx的1.5倍）

**页眉内元素**：
- 返回箭头：40rpx
- 用户名：36rpx，最大宽度350rpx
- 在线状态点：14rpx
- 在线状态文字：24rpx
- 清空按钮：28rpx，padding 10rpx 20rpx
- 页眉padding：30rpx 24rpx

**消息区域**：
- 顶部位置：142rpx（避开页眉）

## 常见问题

1. **WebSocket连接失败**：检查token是否有效，网络是否正常
2. **文件上传失败**：检查文件大小限制和目录权限
3. **数据库连接问题**：检查数据库配置和连接池设置
4. **微信登录失败**：检查AppID、AppSecret、包名、签名配置
5. **管理后台数据为空**：检查API返回格式是否为{data: ...}
6. **401未授权错误**：检查token是否正确传递，getAuthHeaders()是否返回有效token
7. **帖子点赞状态不保留**（2025-04-25修复）：获取帖子列表时必须在请求头中传递token，否则后端无法识别用户，is_liked始终返回0
8. **用户主页显示wxid**（2025-04-25修复）：使用COALESCE(nickname, wechat_nickname, username)优先显示微信昵称
9. **数据库视图错误**（2025-04-25修复）：v_post_details等视图引用不存在的列，需要执行fix_views.sql修复

## 维护建议

1. **定期备份**：每天备份数据库和上传文件
2. **日志监控**：定期检查服务日志，及时发现问题
3. **安全更新**：定期更新依赖包和系统补丁
4. **性能优化**：根据流量情况调整缓存策略和服务器配置

## 总结

声愈项目是一个功能完整、技术栈合理、架构清晰的动物声音社交应用。项目采用了现代前端和后端技术，实现了核心的社交功能，并在性能、安全和用户体验方面做了充分的考虑。
