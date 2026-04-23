# 声愈项目 App 运行流程图

## 一、系统架构总览

```mermaid
flowchart TB
    subgraph Client["客户端层"]
        A[用户设备<br/>手机/平板]
        B[uni-app 跨平台应用]
        C[WebSocket 客户端]
    end

    subgraph Gateway["网关层"]
        D[Nginx 反向代理]
    end

    subgraph Server["服务端层"]
        E[Express HTTP API<br/>端口:3000]
        F[WebSocket Server<br/>端口:3001]
        G[JWT 认证中间件]
    end

    subgraph Data["数据层"]
        H[(MySQL 数据库)]
        I[(Redis 缓存)]
        J[文件存储<br/>uploads/]
    end

    A -->|HTTPS| D
    B -->|API 请求| D
    C -->|WSS| D
    D -->|/api/*| E
    D -->|/ws| F
    E --> G
    F --> G
    G --> H
    G --> I
    E --> J
```

## 二、用户注册/登录流程

```mermaid
sequenceDiagram
    actor User as 用户
    participant App as uni-app
    participant API as Express API
    participant DB as MySQL
    participant Redis as Redis

    User->>App: 打开应用
    App->>App: 检查本地Token

    alt Token有效
        App->>API: GET /api/auth/validate
        API->>API: 验证JWT
        API-->>App: 200 有效
        App->>App: 进入首页
    else Token无效/无Token
        App->>User: 显示登录页
        User->>App: 输入账号密码
        App->>API: POST /api/auth/login
        API->>DB: 查询用户
        DB-->>API: 返回用户数据
        API->>API: bcrypt验证密码
        API->>API: 生成JWT Token
        API-->>App: 200 + Token + 用户信息
        App->>App: 保存Token到本地
        App->>App: 连接WebSocket
        App->>User: 进入首页
    end
```

## 三、首页声音浏览流程

```mermaid
flowchart LR
    A[用户进入首页] --> B{是否已登录?}
    B -->|否| C[跳转到登录页]
    B -->|是| D[加载首页数据]

    D --> E[GET /api/sound/animal-types]
    E --> F[展示动物分类]
    F --> G[用户选择分类]
    G --> H[GET /api/sound/by-animal/:type]

    H --> I{Redis缓存?}
    I -->|命中| J[返回缓存数据]
    I -->|未命中| K[查询MySQL]
    K --> L[写入Redis缓存]
    L --> M[返回数据]
    J --> N[渲染声音列表]
    M --> N

    N --> O[用户点击声音]
    O --> P[进入声音详情页]
    P --> Q[播放声音]
```

## 四、录音与发布流程

```mermaid
sequenceDiagram
    actor User as 用户
    participant App as uni-app
    participant Record as 录音模块
    participant API as Express API
    participant Multer as 文件上传
    participant DB as MySQL

    User->>App: 点击录音按钮
    App->>Record: 请求录音权限
    Record-->>App: 授权成功

    loop 录音过程
        User->>App: 按住录音
        App->>Record: 开始录音
        User->>App: 松开结束
        App->>Record: 停止录音
        Record-->>App: 返回音频文件
    end

    App->>User: 播放预览
    User->>App: 确认上传

    App->>API: POST /api/sound/upload
    API->>Multer: 处理文件上传
    Multer->>Multer: 保存到uploads/sounds/
    Multer-->>API: 返回文件路径

    API->>DB: INSERT INTO sounds
    DB-->>API: 返回sound_id
    API-->>App: 200 上传成功

    App->>User: 提示上传成功
```

## 五、社区帖子浏览与互动流程

```mermaid
flowchart TB
    A[进入社区页] --> B[GET /api/post/list]
    B --> C[Redis缓存检查]
    C -->|命中| D[返回缓存列表]
    C -->|未命中| E[查询posts表]
    E --> F[查询v_post_stats视图]
    F --> G[计算热度分数]
    G --> H[写入Redis缓存]
    H --> I[返回帖子列表]
    D --> J[渲染帖子列表]
    I --> J

    J --> K[用户操作]
    K -->|点赞| L[POST /api/post/like/:id]
    K -->|评论| M[POST /api/post/comment/:id]
    K -->|查看详情| N[进入帖子详情]

    L --> O[更新likes表]
    O --> P[清除相关缓存]
    M --> Q[插入comments表]
    Q --> P
    N --> R[GET /api/post/detail/:id]
    R --> S[查询帖子+评论]

    P --> T[返回操作结果]
    S --> T
```

## 六、实时私信流程

```mermaid
sequenceDiagram
    actor UserA as 用户A
    actor UserB as 用户B
    participant AppA as A的App
    participant AppB as B的App
    participant WS as WebSocket Server
    participant DB as MySQL

    Note over UserA,UserB: 建立连接阶段
    AppA->>WS: 连接 ws://server:3001?token=xxx
    WS->>WS: 验证JWT Token
    WS->>WS: 添加到connectedUsers
    WS-->>AppA: 连接成功

    AppB->>WS: 连接 ws://server:3001?token=xxx
    WS->>WS: 验证JWT Token
    WS->>WS: 添加到connectedUsers
    WS-->>AppB: 连接成功

    Note over UserA,UserB: 发送消息阶段
    UserA->>AppA: 输入消息并发送
    AppA->>WS: 发送chat_message
    WS->>WS: 解析WebSocket帧
    WS->>DB: INSERT INTO messages
    DB-->>WS: 返回message_id

    alt 用户B在线
        WS->>AppB: 推送new_message
        AppB->>UserB: 显示新消息通知
    else 用户B离线
        WS->>DB: 消息标记为未读
    end

    WS->>AppA: 返回message_sent确认
    WS->>AppB: 更新unread_count
```

## 七、关注与粉丝系统流程

```mermaid
flowchart LR
    A[访问用户主页] --> B[GET /api/auth/user/:id]
    B --> C[查询users表]
    C --> D[查询v_user_stats视图]
    D --> E[返回用户数据]

    E --> F[检查关注状态]
    F --> G[GET /api/social/follow/check/:id]
    G --> H{是否已关注?}

    H -->|未关注| I[显示关注按钮]
    H -->|已关注| J[显示已关注]

    I --> K[点击关注]
    K --> L[POST /api/social/follow/:id]
    L --> M[INSERT INTO follows]
    M --> N[清除关注缓存]
    N --> O[返回成功]

    J --> P[点击取消关注]
    P --> Q[DELETE FROM follows]
    Q --> N
```

## 八、热门推荐算法流程

```mermaid
flowchart TB
    A[定时任务启动] --> B[每5分钟执行]
    B --> C[查询v_popular_posts视图]
    C --> D[计算热度分数]
    D --> E[热度 = 点赞数×2 + 评论数×3]
    E --> F[按热度排序]
    F --> G[取前10条]
    G --> H[写入Redis缓存]

    H --> I[设置随机过期时间]
    I --> J[5-10分钟随机]

    K[用户访问首页] --> L[GET /api/post/popular]
    L --> M[读取Redis缓存]
    M --> N[返回热门帖子]

    O[新点赞/评论] --> P[触发缓存清除]
    P --> Q[删除popular:posts缓存]
    Q --> R[下次请求重新计算]
```

## 九、文件上传处理流程

```mermaid
sequenceDiagram
    participant App as uni-app
    participant API as Express API
    participant Multer as Multer中间件
    participant FS as 文件系统
    participant DB as MySQL

    App->>API: POST /api/auth/avatar
    API->>Multer: upload.single('avatar')

    Multer->>Multer: 检查文件类型
    alt 类型不合法
        Multer-->>API: 返回400错误
        API-->>App: 文件类型不支持
    else 类型合法
        Multer->>Multer: 检查文件大小
        alt 超过限制
            Multer-->>API: 返回413错误
            API-->>App: 文件过大
        else 大小合法
            Multer->>Multer: 生成唯一文件名
            Multer->>FS: 保存到uploads/avatars/
            FS-->>Multer: 返回文件路径
            Multer-->>API: 返回文件信息
            API->>DB: UPDATE users SET avatar=?
            DB-->>API: 更新成功
            API-->>App: 返回头像URL
        end
    end
```

## 十、缓存策略流程

```mermaid
flowchart TB
    A[API请求] --> B[缓存中间件]

    B --> C{缓存命中?}
    C -->|是| D[返回缓存数据]
    C -->|否| E[执行业务逻辑]

    E --> F[查询数据库]
    F --> G[处理数据]
    G --> H{数据是否为空?}

    H -->|是| I[缓存空值60秒]
    H -->|否| J[计算随机TTL]
    J --> K[5-10分钟随机]
    K --> L[写入Redis缓存]
    I --> M[返回响应]
    L --> M

    N[数据更新操作] --> O[清除相关缓存]
    O --> P[删除缓存Key]
    P --> Q[下次请求重新加载]
```

## 十一、页面路由结构

```mermaid
flowchart TB
    subgraph Auth["认证模块"]
        A1[登录页 /login]
        A2[注册页 /register]
    end

    subgraph Main["主Tab页面"]
        B1[首页 /index<br/>声音分类]
        B2[社区 /community<br/>帖子列表]
        B3[个人中心 /profile]
    end

    subgraph Sound["声音模块"]
        C1[声音详情 /sound-detail]
        C2[声音播放 /sound-player]
        C3[录音 /record]
        C4[我的录音 /my-sounds]
    end

    subgraph Post["帖子模块"]
        D1[帖子详情 /post-detail]
        D2[发布帖子 /publish]
        D3[我的帖子 /my-posts]
        D4[我的点赞 /my-likes]
    end

    subgraph Social["社交模块"]
        E1[用户主页 /user-profile]
        E2[关注列表 /follows]
        E3[私信列表 /messages]
        E4[聊天页 /chat]
    end

    subgraph Other["其他"]
        F1[搜索 /search]
        F2[扫码 /scan]
        F3[关于 /about]
    end

    A1 --> B1
    B1 --> C1
    B1 --> C3
    C1 --> C2
    B2 --> D1
    B2 --> D2
    B3 --> C4
    B3 --> D3
    B3 --> D4
    B3 --> E3
    B2 --> E1
    E1 --> E2
    E3 --> E4
    B1 --> F1
    B3 --> F2
    B3 --> F3
```

## 十二、数据流图

```mermaid
flowchart LR
    subgraph Input["输入"]
        A[用户操作]
        B[系统定时任务]
    end

    subgraph Process["处理层"]
        C[uni-app前端]
        D[Express路由]
        E[业务逻辑]
        F[数据访问层]
    end

    subgraph Storage["存储层"]
        G[(MySQL)]
        H[(Redis)]
        I[文件系统]
    end

    subgraph Output["输出"]
        J[页面渲染]
        K[实时推送]
    end

    A --> C
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    G --> F
    H --> F
    E --> J
    E --> K
    J --> C
    K --> C
```

## 十三、错误处理流程

```mermaid
flowchart TB
    A[发生错误] --> B{错误类型}

    B -->|网络错误| C[显示网络异常提示]
    B -->|401未授权| D[清除Token]
    D --> E[跳转登录页]
    B -->|404不存在| F[显示空状态]
    B -->|500服务器错误| G[显示错误页面]
    B -->|业务错误| H[显示Toast提示]

    C --> I[提供重试按钮]
    F --> J[引导用户操作]
    G --> K[记录错误日志]
    H --> L[根据code处理]

    I --> M[用户点击重试]
    M --> N[重新请求]
```

---

**文档版本**: v1.0  
**更新日期**: 2026-04-23  
**说明**: 本文档使用 Mermaid 语法绘制，可在支持 Mermaid 的编辑器中渲染查看
