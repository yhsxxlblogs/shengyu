# 声愈 - API 文档

## 项目概述

本文档描述了声愈应用的后端 API 接口。后端基于 Node.js + Express + MySQL 构建，提供用户认证、声音管理、社区互动、私信功能等。

**基础 URL**: `http://106.14.248.12:3000/api`

**技术栈**:

- Node.js
- Express.js
- MySQL2
- Redis (缓存)
- JWT (JSON Web Token)
- bcrypt (密码加密)
- multer (文件上传)
- CORS (跨域支持)
- WebSocket (实时通信)

***

## 目录

1. [认证模块 (Auth)](#认证模块-auth)
2. [验证码模块 (Captcha)](#验证码模块-captcha)
3. [声音模块 (Sound)](#声音模块-sound)
4. [帖子模块 (Post)](#帖子模块-post)
5. [社交模块 (Social)](#社交模块-social)
6. [管理员模块 (Admin)](#管理员模块-admin)
7. [轮播图模块 (Banner)](#轮播图模块-banner)
8. [系统模块 (System)](#系统模块-system)
9. [WebSocket 实时通信](#websocket-实时通信)

***

## 认证模块 (Auth)

基础路径: `/api/auth`

### 1. 用户注册

**接口**: `POST /api/auth/register`

**描述**: 注册新用户账号

**请求参数**:

| 参数名      | 类型     | 必填 | 说明   |
| -------- | ------ | -- | ---- |
| username | string | 是  | 用户名  |
| email    | string | 是  | 邮箱地址 |
| password | string | 是  | 密码   |

**请求示例**:

```json
{
  "username": "张三",
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

**响应示例**:

```json
{
  "message": "注册成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com"
  }
}
```

**错误码**:

- 400: 邮箱已被注册
- 500: 服务器错误

***

### 2. 用户登录

**接口**: `POST /api/auth/login`

**描述**: 用户登录获取 Token

**请求参数**:

| 参数名      | 类型     | 必填 | 说明   |
| -------- | ------ | -- | ---- |
| email    | string | 是  | 邮箱地址 |
| password | string | 是  | 密码   |

**请求示例**:

```json
{
  "email": "zhangsan@example.com",
  "password": "123456"
}
```

**响应示例**:

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": null
  },
  "follows": [
    { "id": 2, "username": "李四" }
  ]
}
```

**错误码**:

- 400: 邮箱或密码错误
- 500: 服务器错误

***

### 3. 管理员登录

**接口**: `POST /api/auth/admin/login`

**描述**: 管理员专用登录接口（需要验证码）

**请求参数**:

| 参数名       | 类型   | 必填 | 说明           |
| ------------ | ------ | ---- | -------------- |
| username     | string | 是   | 用户名或邮箱   |
| password     | string | 是   | 密码           |
| captchaToken | string | 是   | 验证码token    |
| captchaCode  | string | 是   | 验证码（4位）  |

**请求示例**:

```json
{
  "username": "admin",
  "password": "admin123",
  "captchaToken": "a9abdc32c62c1df8fb238120a01ccc62",
  "captchaCode": "ABCD"
}
```

**响应示例**:

```json
{
  "message": "登录成功",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "username": "管理员",
    "email": "admin@example.com",
    "avatar": "/uploads/avatars/xxx.jpg",
    "is_admin": true
  }
}
```

**错误码**:

- 400: 缺少验证码参数 / 验证码错误或已过期 / 用户名或密码错误
- 403: 非管理员账号
- 500: 服务器错误

***

### 4. 验证 Token

**接口**: `GET /api/auth/validate`

**描述**: 验证用户 Token 是否有效

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "valid": true,
  "userId": 1
}
```

**错误码**:

- 401: 未授权或 Token 无效

***

### 5. 获取用户信息

**接口**: `GET /api/auth/user`

**描述**: 获取当前登录用户信息

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "user": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "/uploads/avatars/avatar-xxx.jpg"
  }
}
```

***

### 6. 获取用户统计数据

**接口**: `GET /api/auth/user/stats`

**描述**: 获取当前用户的统计数据（帖子数、获赞数、评论数）

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "stats": {
    "posts": 10,
    "likes": 25,
    "comments": 8
  }
}
```

***

### 7. 上传头像

**接口**: `POST /api/auth/avatar`

**描述**: 上传用户头像

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名    | 类型   | 必填 | 说明                                |
| ------ | ---- | -- | --------------------------------- |
| avatar | file | 是  | 头像图片文件 (jpeg/jpg/png/gif, 最大 5MB) |

**响应示例**:

```json
{
  "message": "头像上传成功",
  "avatarUrl": "/uploads/avatars/avatar-xxx.jpg"
}
```

***

## 验证码模块 (Captcha)

基础路径: `/api`

### 1. 获取验证码

**接口**: `GET /api/captcha`

**描述**: 获取图形验证码（用于管理员登录等场景）

**响应示例**:

```json
{
  "success": true,
  "token": "a9abdc32c62c1df8fb238120a01ccc62",
  "image": "data:image/svg+xml;base64,..."
}
```

**说明**:

- `token`: 验证码标识，登录时需要携带
- `image`: Base64编码的SVG图片
- 验证码有效期5分钟
- 验证成功后立即失效

***

### 2. 验证验证码

**接口**: `POST /api/captcha/verify`

**描述**: 验证用户输入的验证码

**请求参数**:

| 参数名 | 类型   | 必填 | 说明       |
| ------ | ------ | ---- | ---------- |
| token  | string | 是   | 验证码token |
| code   | string | 是   | 用户输入的验证码 |

**请求示例**:

```json
{
  "token": "a9abdc32c62c1df8fb238120a01ccc62",
  "code": "ABCD"
}
```

**响应示例**:

```json
{
  "success": true,
  "message": "验证成功"
}
```

**错误响应**:

```json
{
  "success": false,
  "message": "验证码错误或已过期"
}
```

***

## 声音模块 (Sound)

基础路径: `/api/sound`

### 1. 上传声音

**接口**: `POST /api/sound/upload`

**描述**: 上传动物声音文件

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名          | 类型      | 必填 | 说明                                   |
| ------------ | ------- | -- | ------------------------------------ |
| sound        | file    | 是  | 音频文件 (wav/mp3/ogg/aac/flac, 最大 10MB) |
| animal_type  | string  | 是  | 动物类型ID                              |
| emotion      | string  | 否  | 情绪标签                                 |
| duration     | number  | 是  | 音频时长(秒)                              |
| visible      | boolean | 否  | 是否公开 (默认 true)                       |

**响应示例**:

```json
{
  "message": "上传成功",
  "sound_id": 1
}
```

***

### 2. 获取热门声音

**接口**: `GET /api/sound/popular`

**描述**: 获取热门动物声音列表

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "animal_type": "cat",
      "emotion": "happy",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "duration": 5.2
    }
  ]
}
```

***

### 3. 获取动物类型分组

**接口**: `GET /api/sound/animal-types-grouped`

**描述**: 获取按大类分组的动物类型列表

**响应示例**:

```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "name": "热门动物",
      "sort_order": 1,
      "types": [
        {
          "id": 1,
          "name": "猫咪",
          "category_id": 1,
          "sort_order": 1
        }
      ]
    }
  ]
}
```

***

### 4. 按动物类型获取声音

**接口**: `GET /api/sound/by-animal/:animalType`

**描述**: 根据动物类型获取声音列表

**请求参数**:

| 参数名         | 类型     | 必填 | 说明     |
| ----------- | ------ | -- | ------ |
| animalType  | string | 是  | 动物类型ID |

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "animal_type": "cat",
      "emotion": "happy",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "duration": 5.2,
      "user_id": 1,
      "username": "张三",
      "avatar": "/uploads/avatars/xxx.jpg"
    }
  ]
}
```

***

### 5. 搜索声音

**接口**: `GET /api/sound/search`

**描述**: 搜索声音

**查询参数**:

| 参数名    | 类型     | 必填 | 说明   |
| ------ | ------ | -- | ---- |
| query  | string | 是  | 搜索关键词 |

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "animal_type": "cat",
      "emotion": "happy",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "duration": 5.2
    }
  ]
}
```

***

### 6. 获取声音详情

**接口**: `GET /api/sound/:id`

**描述**: 获取单个声音详情

**请求参数**:

| 参数名 | 类型   | 必填 | 说明    |
| ---- | ---- | -- | ----- |
| id   | number | 是  | 声音ID  |

**响应示例**:

```json
{
  "sound": {
    "id": 1,
    "animal_type": "cat",
    "emotion": "happy",
    "sound_url": "/uploads/sounds/xxx.mp3",
    "duration": 5.2,
    "user_id": 1,
    "username": "张三",
    "avatar": "/uploads/avatars/xxx.jpg",
    "created_at": "2024-01-01 10:00:00"
  }
}
```

***

### 7. 获取我的声音

**接口**: `GET /api/sound/my-sounds`

**描述**: 获取当前用户上传的声音

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "animal_type": "cat",
      "emotion": "happy",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "duration": 5.2,
      "visible": true
    }
  ]
}
```

***

### 8. 切换声音可见性

**接口**: `PUT /api/sound/:id/visibility`

**描述**: 切换声音的公开/私有状态

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名    | 类型      | 必填 | 说明        |
| ------ | ------- | -- | --------- |
| visible | boolean | 是  | 是否公开      |

**响应示例**:

```json
{
  "message": "可见性已更新",
  "visible": false
}
```

***

## 帖子模块 (Post)

基础路径: `/api/post`

### 1. 发布帖子

**接口**: `POST /api/post/create`

**描述**: 发布新帖子

**请求头**:

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名       | 类型      | 必填 | 说明                                |
| --------- | ------- | -- | --------------------------------- |
| content   | string  | 是  | 帖子内容                              |
| image     | file    | 否  | 图片文件 (jpeg/jpg/png/gif, 最大 5MB)   |
| sound     | file    | 否  | 音频文件 (wav/mp3/ogg/aac, 最大 10MB)   |
| sound_id  | number  | 否  | 关联的声音ID                           |

**响应示例**:

```json
{
  "message": "发布成功",
  "post_id": 1
}
```

***

### 2. 获取帖子列表

**接口**: `GET /api/post/list`

**描述**: 获取帖子列表

**查询参数**:

| 参数名    | 类型     | 必填 | 说明         |
| ------ | ------ | -- | ---------- |
| page   | number | 否  | 页码 (默认1)   |
| limit  | number | 否  | 每页数量 (默认10) |

**响应示例**:

```json
{
  "posts": [
    {
      "id": 1,
      "content": "今天听到了很好听的猫叫声",
      "image_url": "/uploads/images/xxx.jpg",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "user_id": 1,
      "username": "张三",
      "avatar": "/uploads/avatars/xxx.jpg",
      "like_count": 10,
      "comment_count": 5,
      "is_following": false,
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

### 3. 获取帖子详情

**接口**: `GET /api/post/:id`

**描述**: 获取单个帖子详情

**请求参数**:

| 参数名 | 类型   | 必填 | 说明    |
| ---- | ---- | -- | ----- |
| id   | number | 是  | 帖子ID  |

**响应示例**:

```json
{
  "post": {
    "id": 1,
    "content": "今天听到了很好听的猫叫声",
    "image_url": "/uploads/images/xxx.jpg",
    "sound_url": "/uploads/sounds/xxx.mp3",
    "user_id": 1,
    "username": "张三",
    "avatar": "/uploads/avatars/xxx.jpg",
    "like_count": 10,
    "comment_count": 5,
    "is_following": false,
    "created_at": "2024-01-01 10:00:00"
  }
}
```

***

### 4. 点赞/取消点赞

**接口**: `POST /api/post/:id/like`

**描述**: 点赞或取消点赞帖子

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名 | 类型   | 必填 | 说明    |
| ---- | ---- | -- | ----- |
| id   | number | 是  | 帖子ID  |

**响应示例**:

```json
{
  "message": "点赞成功"
}
```

***

### 5. 发表评论

**接口**: `POST /api/post/:id/comment`

**描述**: 对帖子发表评论

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名     | 类型     | 必填 | 说明   |
| ------- | ------ | -- | ---- |
| id      | number | 是  | 帖子ID |
| content | string | 是  | 评论内容 |

**响应示例**:

```json
{
  "message": "评论成功",
  "comment_id": 1
}
```

***

### 6. 获取评论列表

**接口**: `GET /api/post/:id/comments`

**描述**: 获取帖子的评论列表

**请求参数**:

| 参数名 | 类型   | 必填 | 说明    |
| ---- | ---- | -- | ----- |
| id   | number | 是  | 帖子ID  |

**响应示例**:

```json
{
  "comments": [
    {
      "id": 1,
      "content": "真好听！",
      "user_id": 2,
      "username": "李四",
      "avatar": "/uploads/avatars/xxx.jpg",
      "created_at": "2024-01-01 10:30:00"
    }
  ]
}
```

***

### 7. 获取我的帖子

**接口**: `GET /api/post/my-posts`

**描述**: 获取当前用户发布的帖子

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "posts": [
    {
      "id": 1,
      "content": "今天听到了很好听的猫叫声",
      "image_url": "/uploads/images/xxx.jpg",
      "like_count": 10,
      "comment_count": 5,
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

## 社交模块 (Social)

基础路径: `/api/social`

### 1. 关注/取消关注用户

**接口**: `POST /api/social/follow/:userId`

**描述**: 关注或取消关注指定用户

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 目标用户ID  |

**响应示例**:

```json
{
  "message": "关注成功",
  "isFollowing": true
}
```

***

### 2. 检查关注状态

**接口**: `GET /api/social/follow/check/:userId`

**描述**: 检查当前用户是否关注了指定用户

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "isFollowing": true
}
```

***

### 3. 获取关注列表

**接口**: `GET /api/social/follows/:userId`

**描述**: 获取指定用户的关注列表

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 用户ID    |

**响应示例**:

```json
{
  "follows": [
    {
      "id": 2,
      "username": "李四",
      "avatar": "/uploads/avatars/xxx.jpg"
    }
  ]
}
```

***

### 4. 获取粉丝列表

**接口**: `GET /api/social/followers/:userId`

**描述**: 获取指定用户的粉丝列表

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 用户ID    |

**响应示例**:

```json
{
  "followers": [
    {
      "id": 3,
      "username": "王五",
      "avatar": "/uploads/avatars/xxx.jpg"
    }
  ]
}
```

***

### 5. 获取关注统计

**接口**: `GET /api/social/follow-stats/:userId`

**描述**: 获取指定用户的关注和粉丝数量

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 用户ID    |

**响应示例**:

```json
{
  "following_count": 10,
  "follower_count": 5
}
```

***

### 6. 获取我的关注列表

**接口**: `GET /api/social/following`

**描述**: 获取当前登录用户的关注列表

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "follows": [
    {
      "id": 2,
      "username": "李四",
      "avatar": "/uploads/avatars/xxx.jpg"
    }
  ]
}
```

***

### 7. 发送私信

**接口**: `POST /api/social/message`

**描述**: 发送私信给指定用户

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名         | 类型     | 必填 | 说明      |
| ----------- | ------ | -- | ------- |
| receiver_id | number | 是  | 接收者ID   |
| content     | string | 是  | 消息内容    |

**响应示例**:

```json
{
  "message": "发送成功",
  "messageId": 1
}
```

**错误码**:

- 403: 对方未关注您，对方回复前只能发送3条消息
- 400: 不能给自己发送消息

***

### 8. 获取私信列表

**接口**: `GET /api/social/messages`

**描述**: 获取当前用户的私信对话列表

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "messages": [
    {
      "user_id": 2,
      "username": "李四",
      "avatar": "/uploads/avatars/xxx.jpg",
      "last_message": "你好",
      "last_time": "2024-01-01 10:00:00",
      "last_sender_id": 1,
      "unread_count": 2,
      "is_following": true,
      "is_follower": true,
      "has_messages": true,
      "my_message_count": 5,
      "their_message_count": 3
    }
  ]
}
```

***

### 9. 获取聊天记录

**接口**: `GET /api/social/messages/:userId`

**描述**: 获取与指定用户的聊天记录

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 对方用户ID  |

**查询参数**:

| 参数名   | 类型     | 必填 | 说明         |
| ----- | ------ | -- | ---------- |
| page  | number | 否  | 页码 (默认1)   |
| limit | number | 否  | 每页数量 (默认20) |

**响应示例**:

```json
{
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "content": "你好",
      "is_read": true,
      "created_at": "2024-01-01 10:00:00",
      "username": "张三",
      "avatar": "/uploads/avatars/xxx.jpg"
    }
  ],
  "hasMore": false
}
```

***

### 10. 获取未读消息数

**接口**: `GET /api/social/messages/unread/count`

**描述**: 获取当前用户的未读消息总数

**请求头**:

```
Authorization: Bearer <token>
```

**响应示例**:

```json
{
  "count": 5
}
```

***

### 11. 获取私信限制状态

**接口**: `GET /api/social/messages/limit/:userId`

**描述**: 获取与指定用户的私信发送限制状态

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 对方用户ID  |

**响应示例**:

```json
{
  "isMutual": false,
  "remainingMessages": 2,
  "canSend": true,
  "sentCount": 1,
  "senderFollows": true,
  "receiverFollows": false
}
```

**说明**:

- `isMutual`: 是否互相关注
- `remainingMessages`: 剩余可发送消息数（-1表示无限制）
- `canSend`: 是否可以发送消息
- `sentCount`: 已发送消息数

***

### 12. 清空聊天记录

**接口**: `DELETE /api/social/messages/clear/:userId`

**描述**: 清空与指定用户的聊天记录（软删除，仅影响当前用户）

**请求头**:

```
Authorization: Bearer <token>
```

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| userId | number | 是  | 对方用户ID  |

**响应示例**:

```json
{
  "message": "聊天记录已清空",
  "deletedCount": 10
}
```

***

## 管理员模块 (Admin)

基础路径: `/api/admin`

### 1. 获取所有用户

**接口**: `GET /api/admin/users`

**描述**: 获取所有用户列表（管理员）

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "users": [
    {
      "id": 1,
      "username": "张三",
      "email": "zhangsan@example.com",
      "avatar": "/uploads/avatars/xxx.jpg",
      "created_at": "2024-01-01 10:00:00",
      "posts_count": 10,
      "sounds_count": 5,
      "comments_count": 8
    }
  ]
}
```

***

### 2. 删除用户

**接口**: `DELETE /api/admin/users/:id`

**描述**: 删除指定用户

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "message": "用户已删除"
}
```

***

### 3. 获取所有声音

**接口**: `GET /api/admin/sounds`

**描述**: 获取所有声音列表

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "animal_type": "cat",
      "emotion": "happy",
      "sound_url": "/uploads/sounds/xxx.mp3",
      "user_id": 1,
      "username": "张三",
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

### 4. 删除声音

**接口**: `DELETE /api/admin/sounds/:id`

**描述**: 删除指定声音

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "message": "声音已删除"
}
```

***

### 5. 获取所有帖子

**接口**: `GET /api/admin/posts`

**描述**: 获取所有帖子列表

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "posts": [
    {
      "id": 1,
      "content": "帖子内容",
      "user_id": 1,
      "username": "张三",
      "like_count": 10,
      "comment_count": 5,
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

### 6. 删除帖子

**接口**: `DELETE /api/admin/posts/:id`

**描述**: 删除指定帖子

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "message": "帖子已删除"
}
```

***

### 7. 发送通知

**接口**: `POST /api/admin/notifications`

**描述**: 向所有用户发送推送通知

**请求头**:

```
Authorization: Bearer <admin_token>
```

**请求参数**:

| 参数名    | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| title  | string | 是  | 通知标题    |
| content | string | 是  | 通知内容    |
| type   | string | 否  | 通知类型    |

**响应示例**:

```json
{
  "message": "通知发送成功",
  "notificationId": 1
}
```

***

### 8. 获取通知列表

**接口**: `GET /api/admin/notifications`

**描述**: 获取所有通知列表

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "notifications": [
    {
      "id": 1,
      "title": "系统维护",
      "content": "系统将于今晚进行维护",
      "type": "system",
      "status": "active",
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

### 9. 删除通知

**接口**: `DELETE /api/admin/notifications/:id`

**描述**: 删除指定通知

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "message": "通知已删除"
}
```

***

### 10. 获取系统统计

**接口**: `GET /api/admin/stats`

**描述**: 获取系统统计数据

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "totalUsers": 100,
  "totalSounds": 500,
  "totalPosts": 200,
  "totalComments": 1000,
  "todayNewUsers": 5,
  "todayNewSounds": 10,
  "todayNewPosts": 20
}
```

***

## 轮播图模块 (Banner)

基础路径: `/api/banner`

### 1. 获取轮播图列表（客户端）

**接口**: `GET /api/banner/list`

**描述**: 获取启用的轮播图列表（用于App首页展示）

**响应示例**:

```json
{
  "banners": [
    {
      "id": 1,
      "image_url": "/uploads/banners/banner-xxx.jpg",
      "title": "欢迎页",
      "link_url": "https://example.com",
      "sort_order": 1
    }
  ]
}
```

***

### 2. 获取轮播图列表（管理端）

**接口**: `GET /api/banner/admin/list`

**描述**: 获取所有轮播图（包括禁用状态）

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "banners": [
    {
      "id": 1,
      "image_url": "/uploads/banners/banner-xxx.jpg",
      "title": "欢迎页",
      "link_url": "https://example.com",
      "sort_order": 1,
      "is_active": true,
      "created_at": "2024-01-01 10:00:00"
    }
  ]
}
```

***

### 3. 创建轮播图

**接口**: `POST /api/banner/admin/create`

**描述**: 创建新的轮播图

**请求头**:

```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名     | 类型   | 必填 | 说明           |
| ---------- | ------ | ---- | -------------- |
| image      | file   | 是   | 轮播图片文件   |
| title      | string | 否   | 标题（左下角显示）|
| link_url   | string | 否   | 点击跳转链接   |
| sort_order | number | 否   | 排序（默认0）  |

**响应示例**:

```json
{
  "message": "轮播图创建成功",
  "banner": {
    "id": 1,
    "image_url": "/uploads/banners/banner-xxx.jpg"
  }
}
```

***

### 4. 更新轮播图

**接口**: `PUT /api/banner/admin/update/:id`

**描述**: 更新轮播图信息

**请求头**:

```
Authorization: Bearer <admin_token>
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名     | 类型    | 必填 | 说明                  |
| ---------- | ------- | ---- | --------------------- |
| image      | file    | 否   | 新图片（不选则保留原图）|
| title      | string  | 否   | 标题                  |
| link_url   | string  | 否   | 跳转链接              |
| sort_order | number  | 否   | 排序                  |
| is_active  | boolean | 否   | 是否启用              |

**响应示例**:

```json
{
  "message": "轮播图更新成功"
}
```

***

### 5. 切换轮播图状态

**接口**: `PUT /api/banner/admin/toggle/:id`

**描述**: 启用/禁用轮播图

**请求头**:

```
Authorization: Bearer <admin_token>
```

**请求参数**:

| 参数名    | 类型    | 必填 | 说明     |
| --------- | ------- | ---- | -------- |
| is_active | boolean | 是   | 启用状态 |

**响应示例**:

```json
{
  "message": "状态已更新",
  "is_active": false
}
```

***

### 6. 删除轮播图

**接口**: `DELETE /api/banner/admin/delete/:id`

**描述**: 删除轮播图

**请求头**:

```
Authorization: Bearer <admin_token>
```

**响应示例**:

```json
{
  "message": "轮播图已删除"
}
```

***

## 系统模块 (System)

基础路径: `/api/system`

### 1. 获取分类列表

**接口**: `GET /api/system/categories`

**描述**: 获取所有声音分类（大类）

**响应示例**:

```json
{
  "categories": [
    {
      "id": 1,
      "name": "热门动物",
      "sort_order": 1
    }
  ]
}
```

***

### 2. 获取类型列表

**接口**: `GET /api/system/types`

**描述**: 获取所有声音类型（小类）

**响应示例**:

```json
{
  "types": [
    {
      "id": 1,
      "name": "猫咪",
      "category_id": 1,
      "sort_order": 1
    }
  ]
}
```

***

### 3. 获取系统声音

**接口**: `GET /api/system/sounds`

**描述**: 获取系统预设声音列表

**响应示例**:

```json
{
  "sounds": [
    {
      "id": 1,
      "name": "猫咪叫声",
      "type_id": 1,
      "sound_url": "/uploads/system/sounds/cat.mp3",
      "icon": "🐱"
    }
  ]
}
```

***

## WebSocket 实时通信

**连接地址**: `ws://106.14.248.12:3001`

**认证方式**: 通过 URL 参数传递 token 和 userId

```
ws://106.14.248.12:3001?token=<jwt_token>&userId=<user_id>
```

### 消息格式

所有消息使用 JSON 格式，包含 `type` 和 `payload` 字段：

```json
{
  "type": "message_type",
  "payload": { ... }
}
```

### 客户端发送消息

#### 1. 心跳检测

```json
{
  "type": "ping",
  "payload": {}
}
```

服务器响应：

```json
{
  "type": "pong",
  "payload": { "timestamp": 1234567890 }
}
```

#### 2. 发送聊天消息

```json
{
  "type": "chat_message",
  "payload": {
    "receiverId": 2,
    "content": "你好！",
    "timestamp": 1234567890
  }
}
```

#### 3. 发送打字状态

```json
{
  "type": "typing",
  "payload": {
    "receiverId": 2,
    "isTyping": true
  }
}
```

#### 4. 标记消息已读

```json
{
  "type": "mark_read",
  "payload": {
    "senderId": 2
  }
}
```

### 服务器推送消息

#### 1. 连接成功

```json
{
  "type": "connected",
  "payload": {
    "userId": "1",
    "onlineUsers": 10
  }
}
```

#### 2. 收到新消息

```json
{
  "type": "new_message",
  "payload": {
    "id": 1,
    "sender_id": 2,
    "receiver_id": 1,
    "content": "你好！",
    "created_at": "2024-01-01 10:00:00",
    "username": "李四",
    "avatar": "/uploads/avatars/xxx.jpg"
  }
}
```

#### 3. 消息发送成功确认

```json
{
  "type": "message_sent",
  "payload": {
    "id": 1,
    "sender_id": 1,
    "receiver_id": 2,
    "content": "你好！",
    "created_at": "2024-01-01 10:00:00"
  }
}
```

#### 4. 未读消息数更新

```json
{
  "type": "unread_count",
  "payload": {
    "count": 5,
    "fromUserId": 2
  }
}
```

#### 5. 对方正在输入

```json
{
  "type": "typing",
  "payload": {
    "userId": 2,
    "isTyping": true
  }
}
```

#### 6. 消息已读通知

```json
{
  "type": "message_read",
  "payload": {
    "userId": 2
  }
}
```

#### 7. 用户上线通知

```json
{
  "type": "user_online",
  "payload": {
    "userId": "2"
  }
}
```

#### 8. 用户下线通知

```json
{
  "type": "user_offline",
  "payload": {
    "userId": "2"
  }
}
```

#### 9. 系统通知

```json
{
  "type": "notification",
  "payload": {
    "title": "系统通知",
    "content": "您有一条新消息"
  }
}
```

#### 10. 错误消息

```json
{
  "type": "error",
  "payload": {
    "message": "不能给自己发送消息"
  }
}
```

### 连接管理

- **连接超时**: 60秒无活动自动断开
- **心跳机制**: 建议每30秒发送一次 ping
- **重连策略**: 断开后自动重连，最多10次
- **在线状态**: 用户上线/下线会广播给所有在线用户

***

## 通用错误码

| 状态码 | 说明         |
| ---- | ---------- |
| 200  | 请求成功       |
| 400  | 请求参数错误     |
| 401  | 未授权/Token无效 |
| 403  | 禁止访问       |
| 404  | 资源不存在      |
| 500  | 服务器内部错误    |

***

## Redis 缓存机制

### 缓存策略

系统使用 Redis 作为缓存层，采用多级 TTL 过期策略：

| 缓存类型       | TTL    | 说明             |
| -------------- | ------ | ---------------- |
| 未读消息数     | 30秒   | 实时性要求高     |
| 用户统计       | 60秒   | 统计数据         |
| 帖子列表       | 60秒   | 列表数据         |
| 关注/粉丝列表  | 5分钟  | 相对稳定的社交数据 |
| 帖子详情       | 5分钟  | 详情数据         |
| 热门声音       | 10分钟 | 热门数据         |

### 缓存键命名规范

```
user:follows:<userId>      # 用户关注列表
user:followers:<userId>    # 用户粉丝列表
user:stats:<userId>        # 用户统计数据
post:detail:<postId>       # 帖子详情
posts:list:<params>        # 帖子列表
sounds:popular             # 热门声音
messages:unread:<userId>   # 未读消息数
follow:stats:<userId>      # 关注统计
```

### 缓存清除策略

- **主动清除**: 数据更新时立即清除相关缓存
- **被动过期**: 依赖 TTL 自动过期
- **模式匹配**: 支持通配符清除（如 `*user:123*`）

***

## 数据库反规范化设计

### 反规范化字段

为提升查询性能，在 `users` 表中预计算以下统计字段：

| 字段名                  | 说明           |
| ----------------------- | -------------- |
| `posts_count`           | 帖子数量       |
| `sounds_count`          | 声音数量       |
| `followers_count`       | 粉丝数量       |
| `following_count`       | 关注数量       |
| `likes_received_count`  | 获赞数量       |
| `comments_received_count` | 获评论数量   |

### 更新机制

- 发布帖子 → posts_count + 1
- 上传声音 → sounds_count + 1
- 被关注 → followers_count + 1
- 取消关注 → followers_count - 1
- 帖子被点赞 → likes_received_count + 1

### 优势

- 避免频繁的 COUNT(*) 查询
- 用户统计信息查询从 O(n) 降至 O(1)
- 适合读多写少的场景

***

## 认证说明

1. 除登录、注册等公开接口外，大部分接口需要携带 Token
2. Token 通过请求头的 `Authorization` 字段传递，格式为 `Bearer <token>`
3. Token 有效期为 7 天
4. 管理员接口需要管理员账号获取的 Token

***

## 文件上传说明

### 图片上传

- 支持格式: jpeg, jpg, png, gif
- 最大大小: 5MB
- 存储路径: `/uploads/images/`

### 音频上传

- 支持格式: wav, mp3, ogg, aac, flac
- 最大大小: 10MB
- 存储路径: `/uploads/sounds/`

### 头像上传

- 支持格式: jpeg, jpg, png, gif
- 最大大小: 5MB
- 存储路径: `/uploads/avatars/`

***

## 私信功能说明

### 互相关注规则

1. **互相关注**: 双方私信无限制
2. **单向关注**: 
   - 关注方可以在私信列表看到对方
   - 被关注方只有在收到消息后才在列表看到对方
   - 非互相关注时，发送方在对方回复前只能发送3条消息

### 消息删除

- 支持清空聊天记录（软删除）
- 删除仅影响当前用户，对方仍可见
- 删除记录存储在 `deleted_messages` 表中

***

## 关注功能说明

### 缓存机制

- 登录时获取关注列表并缓存到本地
- 关注/取消关注时更新缓存
- 退出登录时清除缓存
- 未登录状态下默认显示"关注"按钮

### 数据一致性

- 优先使用服务器返回的关注状态
- 本地缓存作为补充
- 通过全局事件通知其他页面更新状态
