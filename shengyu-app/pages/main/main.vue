﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <view class="main-container">
    <swiper
      class="main-swiper"
      :current="currentIndex"
      @change="onSwiperChange"
      :duration="300"
    >
      <!-- 首页 -->
      <swiper-item class="swiper-item">
        <view class="page-container">
          <!-- 录制声音按钮 -->
          <view class="publish-btn" @click="goRecord">
            <svg-icon name="plus" :size="40" class="publish-icon-svg" />
          </view>
          <view class="index-content">
            <view class="search-bar">
              <view class="search-input-wrapper" @click="goSearch">
                <view class="search-input">
                  <svg-icon name="search" :size="28" class="search-icon-svg" />
                  <text class="search-placeholder">搜索声音、帖子、用户...</text>
                </view>
              </view>
              <view class="scan-btn" @click="goScan">
                <svg-icon name="scan" :size="32" class="scan-icon-svg" />
              </view>
            </view>

            <!-- 轮播图区域 - 层叠3D效果 -->
            <view class="banner-section" v-if="bannerList.length > 0">
              <swiper
                class="banner-swiper"
                :current="bannerCurrentIndex"
                @change="onBannerChange"
                :autoplay="bannerList.length > 1"
                :interval="4000"
                :duration="400"
                :circular="bannerList.length > 1"
                :indicator-dots="false"
                previous-margin="60rpx"
                next-margin="60rpx"
              >
                <swiper-item
                  v-for="(banner, index) in bannerList"
                  :key="banner.id"
                  class="banner-item-wrapper"
                  :class="{
                    'banner-active': bannerCurrentIndex === index,
                    'banner-prev': getBannerPosition(index) === 'prev',
                    'banner-next': getBannerPosition(index) === 'next',
                    'banner-far': getBannerPosition(index) === 'far'
                  }"
                  @click="handleBannerClick(banner)"
                >
                  <view class="banner-card">
                    <image
                      v-if="banner.fullImageUrl"
                      :src="banner.fullImageUrl"
                      class="banner-image"
                      mode="aspectFill"
                      @error="onBannerImageError(index)"
                    />
                    <view v-else class="banner-placeholder">
                      <text class="placeholder-text">{{ banner.title || '轮播图 ' + (index + 1) }}</text>
                    </view>
                    <view v-if="banner.title" class="banner-title-wrapper">
                      <text class="banner-title">{{ banner.title }}</text>
                    </view>
                  </view>
                </swiper-item>
              </swiper>
              <!-- 自定义指示点 -->
              <view class="banner-indicators" v-if="bannerList.length > 1">
                <view
                  v-for="(banner, index) in bannerList"
                  :key="index"
                  class="indicator-dot"
                  :class="{ active: bannerCurrentIndex === index }"
                  @click="bannerCurrentIndex = index"
                ></view>
              </view>
            </view>

            <!-- 应用小程序式分类区域 -->
            <view class="app-grid-container">
              <view v-for="(categoryData, categoryKey) in animalCategories" :key="categoryKey" class="category-app-section">
                <text class="category-app-title">{{ categoryData.display_name }}</text>
                <view v-if="indexLoading" class="app-loading">
                  <text>加载中...</text>
                </view>
                <view v-else-if="indexError" class="app-error">
                  <text>{{ indexError }}</text>
                  <button @click="loadIndexData" class="app-retry-btn">重试</button>
                </view>
                <view v-else class="app-grid">
                  <view class="app-item" v-for="animal in categoryData.items" :key="animal.id" @click="goSoundDetail(animal.type)">
                    <view class="app-icon-wrapper">
                      <text class="app-icon-emoji">{{ animal.icon }}</text>
                    </view>
                    <text class="app-name">{{ animal.name }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 热门推荐区域 -->
            <view class="recommend-section">
              <view class="section-header">
                <text class="section-title">热门推荐</text>
                <view class="more-btn" @click="goCommunity">
                  <text class="more-text">更多</text>
                  <svg-icon name="arrow-right" :size="24" class="more-icon" />
                </view>
              </view>

              <!-- 加载状态 -->
              <view v-if="popularLoading" class="loading">
                <text>加载中...</text>
              </view>

              <!-- 推荐列表 -->
              <view v-else class="recommend-list">
                <view
                  v-for="(post, index) in popularPosts"
                  :key="post.id"
                  class="recommend-item"
                  @click="goPostDetail(post.id)"
                >
                  <view class="recommend-rank" :class="{ 'rank-top': index < 3 }">{{ index + 1 }}</view>
                  <view class="recommend-content">
                    <text class="recommend-text">{{ post.content }}</text>
                    <view class="recommend-meta">
                      <view class="recommend-author">
                        <image v-if="post.avatar" :src="getAvatarUrl(post.avatar)" class="author-avatar" mode="aspectFill" />
                        <view v-else class="author-avatar-placeholder">
                          <svg-icon name="user" :size="24" />
                        </view>
                        <text class="author-name">{{ post.username }}</text>
                      </view>
                      <view class="recommend-stats">
                        <view class="stat-item">
                          <svg-icon name="heart" :size="20" class="stat-icon" />
                          <text class="stat-num">{{ post.like_count || 0 }}</text>
                        </view>
                        <view class="stat-item">
                          <svg-icon name="message" :size="20" class="stat-icon" />
                          <text class="stat-num">{{ post.comment_count || 0 }}</text>
                        </view>
                      </view>
                    </view>
                  </view>
                  <!-- 热门推荐不显示图片 -->
                </view>
              </view>

              <!-- 空状态 -->
              <view v-if="!popularLoading && popularPosts.length === 0" class="empty-state">
                <svg-icon name="info" :size="48" class="empty-icon" />
                <text class="empty-text">暂无热门帖子</text>
              </view>
            </view>
          </view>

          <!-- 通知弹窗 -->
          <view v-if="showNotification" class="notification-popup">
            <view class="notification-content">
              <view class="notification-header">
                <text class="notification-title">{{ notification.title }}</text>
                <text class="notification-close" @click="closeNotification">×</text>
              </view>
              <view class="notification-body">
                <text>{{ notification.content }}</text>
              </view>
              <view class="notification-footer">
                <button class="notification-btn notification-btn-secondary" @click="dismissNotification">不再提示</button>
                <button class="notification-btn" @click="closeNotification">确定</button>
              </view>
            </view>
          </view>
        </view>
      </swiper-item>

      <!-- 社区 -->
      <swiper-item class="swiper-item">
        <view class="community-page-container">
          <!-- 固定顶部区域 -->
          <view class="community-fixed-header">
            <!-- 二级滑动栏 -->
            <view class="sub-tabs">
              <view class="sub-tab" :class="{ active: communityTab === 'community' }" @click="switchCommunityTab('community')">
                <text class="sub-tab-text">社区</text>
              </view>
              <view class="sub-tab" :class="{ active: communityTab === 'messages' }" @click="switchCommunityTab('messages')">
                <text class="sub-tab-text">私信</text>
                <view v-if="unreadMessageCount > 0" class="message-badge">{{ unreadMessageCount }}</view>
              </view>
            </view>

            <!-- 社区标题 -->
            <view v-if="communityTab === 'community'" class="community-header">
              <text class="header-title">社区</text>
            </view>
            <view v-else-if="communityTab === 'messages'" class="community-header">
              <text class="header-title">私信</text>
            </view>
          </view>

          <!-- 社区内容 -->
          <view v-if="communityTab === 'community'" class="community-panel">
            <view class="publish-btn" @click="goPublish">
              <svg-icon name="plus" :size="40" class="publish-icon-svg" />
            </view>

            <scroll-view
              class="post-list-scroll"
              scroll-y
              :scroll-top="scrollTop"
              @scrolltolower="loadMorePosts"
              :lower-threshold="100"
              refresher-enabled
              :refresher-triggered="isRefreshing"
              @refresherrefresh="onRefresh"
            >
                <view v-if="communityLoading && !isRefreshing" class="loading-container">
                  <view class="loading-animation">
                    <view class="loading-dot"></view>
                    <view class="loading-dot" style="animation-delay: 0.2s"></view>
                    <view class="loading-dot" style="animation-delay: 0.4s"></view>
                  </view>
                  <text class="loading-text">加载中...</text>
                </view>
                <view v-else-if="communityError" class="error">
                  <text>{{ communityError }}</text>
                  <button @click="loadCommunityData" class="retry-btn">重试</button>
                </view>
                <view v-else-if="posts.length === 0" class="empty-state">
                  <text>暂无帖子</text>
                </view>
                <view v-else class="post-list-content">
                  <view class="post-item" v-for="(post, index) in posts" :key="post.id" @click="goPostDetail(post.id)" :style="{ animationDelay: index * 0.05 + 's' }">
                    <view class="post-header">
                      <view class="avatar-wrapper" @click.stop="goToUserProfile(post.user_id)">
                        <image :src="getAvatarUrl(post.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.username || 'User')}&background=FF69B4&color=fff&size=60`" class="avatar" mode="aspectFill"></image>
                      </view>
                      <view class="user-info" @click.stop="goToUserProfile(post.user_id)">
                        <text class="username">{{ post.username }}</text>
                        <text class="post-time">{{ formatTime(post.created_at) }}</text>
                      </view>
                      <view v-if="String(post.user_id) !== String(currentUserId)" class="follow-btn-small" :class="{ 'following': post.is_following }" @click.stop="toggleFollow(post)">
                        <text class="follow-btn-text">{{ post.is_following ? '已关注' : '关注' }}</text>
                      </view>
                    </view>
                    <view class="post-content">
                      <text class="content">{{ post.content }}</text>
                      <image v-if="post.image_url" :src="getAvatarUrl(post.image_url)" class="post-image" mode="aspectFit"></image>
                      <view v-if="post.sound_url" class="audio-container" @click.stop="playSound(post.sound_url)">
                        <svg-icon name="play" :size="28" class="audio-icon-svg" />
                        <text class="audio-text">点击播放声音</text>
                      </view>
                    </view>
                    <view class="post-footer">
                      <view class="action-item" @click.stop="likePost(post.id)">
                        <svg-icon :name="post.liked ? 'heart' : 'heart-o'" :size="28" class="action-icon-svg" :class="{ liked: post.liked }" />
                        <text class="action-text">{{ post.like_count || 0 }}</text>
                      </view>
                      <view class="action-item" @click.stop="showComments(post.id)">
                        <svg-icon name="message" :size="28" class="action-icon-svg" />
                        <text class="action-text">{{ post.comment_count || 0 }}</text>
                      </view>
                    </view>
                  </view>
                  <!-- 加载更多状态 -->
                  <view v-if="loadingMore" class="loading-more">
                    <view class="loading-animation-small">
                      <view class="loading-dot-small"></view>
                      <view class="loading-dot-small" style="animation-delay: 0.2s"></view>
                      <view class="loading-dot-small" style="animation-delay: 0.4s"></view>
                    </view>
                    <text class="loading-more-text">加载更多...</text>
                  </view>
                  <!-- 没有更多数据 -->
                  <view v-else-if="!hasMore && posts.length > 0" class="no-more">
                    <text class="no-more-text">—— 已经到底了 ——</text>
                  </view>
                  <!-- 底部安全区域，防止被导航栏遮盖 -->
                  <view class="safe-area-bottom"></view>
                </view>
              </scroll-view>
            </view>

            <!-- 私信面板 -->
            <view v-else-if="communityTab === 'messages'" class="messages-panel">
              <scroll-view
                class="messages-list-scroll"
                scroll-y
                :scroll-top="messageScrollTop"
                @scrolltolower="loadMoreMessages"
                :lower-threshold="100"
                refresher-enabled
                :refresher-triggered="isRefreshingMessages"
                @refresherrefresh="onRefreshMessages"
              >
              <view v-if="loadingMessages" class="loading-container">
                <text class="loading-text">加载中...</text>
              </view>
              <view v-else-if="messageList.length === 0" class="empty-messages">
                <svg-icon name="message" :size="80" class="empty-icon-svg" />
                <text class="empty-text">还没有私信</text>
                <text class="empty-subtext">去社区关注感兴趣的人吧</text>
              </view>
              <view v-else class="message-list-content">
                <view class="message-item" v-for="msg in messageList" :key="msg.user_id" @click="goToChat(msg.user_id, msg.username)">
                  <view class="message-avatar-wrapper">
                    <image :src="getAvatarUrl(msg.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.username || 'User')}&background=FF69B4&color=fff&size=60`" class="message-avatar" mode="aspectFill"></image>
                  </view>
                  <view class="message-info">
                    <view class="message-header-row">
                      <text class="message-username">{{ msg.username }}</text>
                      <text class="message-time">{{ formatTime(msg.last_time) }}</text>
                    </view>
                    <view class="message-row">
                      <text class="message-preview" :class="{ 'unread': msg.unread_count > 0 }">{{ msg.last_message }}</text>
                      <view v-if="msg.unread_count > 0" class="unread-badge">{{ msg.unread_count }}</view>
                    </view>
                  </view>
                </view>
              </view>
            </scroll-view>
          </view>
        </view>

        <!-- 评论弹窗 -->
        <view v-if="showCommentPopup" class="comment-popup">
          <view class="comment-popup-content">
            <view class="comment-popup-header">
              <text class="comment-popup-title">评论</text>
              <view class="comment-popup-close" @click="closeCommentPopup">
                <svg-icon name="close" :size="32" />
              </view>
            </view>
            <view class="comment-list">
              <view v-if="loadingComments" class="loading">
                <text>加载中...</text>
              </view>
              <view v-else-if="comments.length === 0" class="empty-comments">
                <text>暂无评论</text>
              </view>
              <view v-else>
                <view class="comment-item" v-for="comment in comments" :key="comment.id">
                  <view class="comment-avatar-wrapper" @click="goToUserProfile(comment.user_id)">
                    <image :src="getAvatarUrl(comment.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.username || 'User')}&background=FF69B4&color=fff&size=50`" class="comment-avatar" mode="aspectFill"></image>
                  </view>
                  <view class="comment-content">
                    <view class="comment-header">
                      <text class="comment-username">{{ comment.username }}</text>
                      <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
                    </view>
                    <text class="comment-text">{{ comment.content }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="comment-input-container">
              <input type="text" v-model="commentContent" placeholder="写下你的评论..." class="comment-input" />
              <button @click="sendComment" class="send-btn" :disabled="!commentContent">发送</button>
            </view>
          </view>
        </view>
        <view v-if="showCommentPopup" class="overlay" @click="closeCommentPopup"></view>
      </swiper-item>

      <!-- 我的 -->
      <swiper-item class="swiper-item">
        <view class="page-container">
          <view class="profile-content">
            <!-- 骨架屏 -->
            <view v-if="profileLoading" class="skeleton-loading">
              <view class="skeleton-card">
                <view class="skeleton-avatar"></view>
                <view class="skeleton-info">
                  <view class="skeleton-line short"></view>
                  <view class="skeleton-line"></view>
                </view>
              </view>
              <view class="skeleton-stats">
                <view class="skeleton-stat" v-for="i in 3" :key="i">
                  <view class="skeleton-circle"></view>
                  <view class="skeleton-line mini"></view>
                </view>
              </view>
              <view class="skeleton-menu">
                <view class="skeleton-menu-item" v-for="i in 5" :key="i">
                  <view class="skeleton-icon"></view>
                  <view class="skeleton-line"></view>
                </view>
              </view>
            </view>

            <!-- 未登录状态 -->
            <view v-else-if="!isLoggedIn" class="not-logged-in">
              <view class="empty-avatar">
                <svg-icon name="user" :size="80" class="empty-icon-svg" />
              </view>
              <text class="empty-title">登录后享受更多功能</text>
              <text class="empty-desc">记录动物声音、发布帖子、互动交流</text>
              <button class="login-button" @click="goToLogin">立即登录</button>
            </view>

            <!-- 已登录状态 -->
            <view v-else class="logged-in fade-in">
              <view class="user-card">
                <view class="user-header">
                  <image :src="getAvatarUrl(userInfo.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(userInfo.username || 'User')}&background=FF69B4&color=fff&size=200`" class="user-avatar-large" mode="aspectFill"></image>
                  <view class="user-detail">
                    <text class="user-name">{{ userInfo.username || '用户' }}</text>
                    <text class="user-email">{{ userInfo.email || '' }}</text>
                  </view>
                  <view class="edit-icon" @click="changeAvatar">
                    <svg-icon name="camera" :size="28" class="edit-icon-svg" />
                  </view>
                </view>

                <view class="stats-row">
                  <view class="stat-card">
                    <text class="stat-number">{{ userStats.posts || 0 }}</text>
                    <text class="stat-label">帖子</text>
                  </view>
                  <view class="divider-line"></view>
                  <view class="stat-card">
                    <text class="stat-number">{{ userStats.likes || 0 }}</text>
                    <text class="stat-label">获赞</text>
                  </view>
                  <view class="divider-line"></view>
                  <view class="stat-card">
                    <text class="stat-number">{{ userStats.comments || 0 }}</text>
                    <text class="stat-label">评论</text>
                  </view>
                </view>
                
                <!-- 关注和粉丝统计 -->
                <view class="follow-stats-row">
                  <view class="follow-stat-item" @click="goToFollows">
                    <text class="follow-stat-number">{{ userStats.following_count || 0 }}</text>
                    <text class="follow-stat-label">关注</text>
                  </view>
                  <view class="follow-stat-item" @click="goToFollowers">
                    <text class="follow-stat-number">{{ userStats.follower_count || 0 }}</text>
                    <text class="follow-stat-label">粉丝</text>
                  </view>
                </view>
              </view>

              <view class="menu-section">
                <text class="menu-title">我的功能</text>
                <view class="menu-item" @click="goToMyPosts">
                  <view class="menu-icon-wrapper">
                    <svg-icon name="edit" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">我的帖子</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
                <view class="menu-item" @click="goToMySounds">
                  <view class="menu-icon-wrapper">
                    <svg-icon name="sound" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">我的声音</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
                <view class="menu-item" @click="goToMyLikes">
                  <view class="menu-icon-wrapper">
                    <svg-icon name="heart" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">我的点赞</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
                <view class="menu-item" @click="goToFollows">
                  <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <svg-icon name="users" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">我的关注</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
                <view class="menu-item" @click="goToFollowers">
                  <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <svg-icon name="star" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">我的粉丝</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
              </view>

              <view class="menu-section">
                <text class="menu-title">账号绑定</text>
                <view class="menu-item" @click="handleWechatBind">
                  <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #07C160 0%, #10B981 100%);">
                    <svg-icon name="message" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">微信绑定</text>
                  <view class="bind-status">
                    <text class="bind-status-text" :class="{ 'bound': wechatBound }">{{ wechatBound ? '已绑定' : '未绑定' }}</text>
                    <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                  </view>
                </view>
              </view>

              <view class="menu-section">
                <text class="menu-title">设置与帮助</text>
                <view class="menu-item" @click="goToSettings">
                  <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                    <svg-icon name="settings" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">设置</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
                <view class="menu-item" @click="goToAbout">
                  <view class="menu-icon-wrapper" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <svg-icon name="info" :size="32" class="menu-icon-svg" />
                  </view>
                  <text class="menu-text">关于我们</text>
                  <svg-icon name="arrow-right" :size="24" class="menu-arrow-svg" />
                </view>
              </view>

              <view class="logout-section">
                <button class="logout-button" @click="logout">退出登录</button>
              </view>
            </view>
          </view>
        </view>
      </swiper-item>
    </swiper>

    <custom-tabbar :current-index="currentIndex" :unread-count="unreadMessageCount" @change="onTabChange"></custom-tabbar>
  </view>
</template>

<script>
import { getImageUrl, DEFAULT_AVATAR } from '../../utils/api.js'
import wsService from '@/utils/websocket.js'

export default {
  data() {
    return {
      currentIndex: 0,

      // 首页数据
      animalCategories: {},
      indexLoading: false,
      indexError: '',
      showNotification: false,
      notification: {
        id: null,
        title: '',
        content: ''
      },
      dismissedNotifications: [],
      popularPosts: [],
      popularLoading: false,

      // 轮播图数据
      bannerList: [],
      bannerCurrentIndex: 0,
      bannerLoading: false,
      isUserInteracting: false,
      userInteractionTimer: null,

      // 社区数据
      posts: [],
      communityLoading: false,
      communityError: '',
      page: 1,
      pageSize: 10,
      hasMore: true,
      loadingMore: false,
      isRefreshing: false,
      scrollTop: 0,
      showCommentPopup: false,
      comments: [],
      currentPostId: null,
      commentContent: '',
      loadingComments: false,
      communityUpdateTimer: null,
      communityTab: 'community',
      unreadMessageCount: 0,
      messageList: [],
      loadingMessages: false,
      unreadMessageTimer: null,
      wsConnected: false,
      messageScrollTop: 0,
      isRefreshingMessages: false,
      messagePage: 1,
      hasMoreMessages: true,

      // 我的页面数据
      userInfo: {},
      isLoggedIn: false,
      userStats: {
        posts: 0,
        likes: 0,
        comments: 0,
        following_count: 0,
        follower_count: 0
      },
      profileLoading: false,
      profileUpdateTimer: null,
      wechatBound: false,
      wechatInfo: null
    }
  },
  computed: {
    // 动态分类不再需要硬编码计算属性
  },
  onLoad() {
    this.loadAllData()
    this.loadDismissedNotifications()
    this.startCommunityAutoUpdate()
    this.startProfileAutoUpdate()
    this.initSocket() // 初始化 WebSocket 连接
    // 监听关注状态变化事件
    uni.$on('followStatusChanged', this.handleFollowStatusChanged)
    // 监听私信列表刷新事件
    uni.$on('refreshMessages', this.handleRefreshMessages)
    // 轮播图自动滚动会在数据加载完成后自动启动
  },
  onUnload() {
    // 取消监听
    uni.$off('followStatusChanged', this.handleFollowStatusChanged)
    uni.$off('refreshMessages', this.handleRefreshMessages)
    // 停止轮询
    this.stopUnreadMessagePolling()
  },
  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus()
    this.loadAllData()
    this.checkNotifications()
    // 轮播图自动滚动会在数据加载完成后自动启动
  },
  onHide() {
    // 停止轮播图自动滚动
    this.stopBannerAutoScroll()
  },
  onUnload() {
    if (this.communityUpdateTimer) {
      clearInterval(this.communityUpdateTimer)
    }
    if (this.profileUpdateTimer) {
      clearInterval(this.profileUpdateTimer)
    }
    // 停止轮播图自动滚动
    this.stopBannerAutoScroll()
  },
  methods: {
    onSwiperChange(e) {
      this.currentIndex = e.detail.current
      // 切换到社区页面时加载未读消息数
      if (this.currentIndex === 1) {
        this.loadUnreadCount()
      }
    },

    onTabChange(index) {
      this.currentIndex = index
      // 切换到社区页面时加载未读消息数
      if (this.currentIndex === 1) {
        this.loadUnreadCount()
      }
    },

    switchCommunityTab(tab) {
      this.communityTab = tab
      if (tab === 'messages') {
        this.loadMessageList()
        this.loadUnreadCount()
      }
    },

    async loadMessageList(loadMore = false) {
      // 如果已经在加载中，不重复加载
      if (this.loadingMessages) return

      this.loadingMessages = true
      const token = uni.getStorageSync('token')
      if (!token) {
        this.loadingMessages = false
        return
      }
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/messages?page=${this.messagePage}`,
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        })
        if (res.statusCode === 200) {
          const newMessages = res.data.messages || []
          if (loadMore) {
            // 合并新消息，避免重复
            const existingIds = new Set(this.messageList.map(m => m.user_id))
            const uniqueNewMessages = newMessages.filter(m => !existingIds.has(m.user_id))
            this.messageList = [...this.messageList, ...uniqueNewMessages]
          } else {
            // 智能合并：避免闪烁，只更新变化的数据
            this.smartMergeMessageList(newMessages)
          }
          this.hasMoreMessages = newMessages.length === 10
        }
      } catch (e) {
        console.error('加载私信列表失败:', e)
      }
      this.loadingMessages = false
    },

    loadMoreMessages() {
      if (!this.loadingMessages && this.hasMoreMessages) {
        this.messagePage++
        this.loadMessageList(true)
      }
    },

    async onRefreshMessages() {
      this.isRefreshingMessages = true
      this.messagePage = 1
      this.hasMoreMessages = true
      await this.loadMessageList(false)
      this.isRefreshingMessages = false
      uni.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      })
    },

    // 智能合并私信列表 - 避免闪烁
    smartMergeMessageList(newMessages) {
      if (!newMessages.length) {
        // 只有当从有数据变为无数据时才清空
        if (this.messageList.length > 0) {
          this.messageList = []
        }
        return
      }

      // 如果是首次加载，直接赋值
      if (this.messageList.length === 0) {
        this.messageList = newMessages
        return
      }

      // 检查是否有实质性变化
      let hasChanges = false
      const existingMap = new Map(this.messageList.map(m => [m.user_id, m]))
      
      // 检查是否有新增或删除的对话
      if (newMessages.length !== this.messageList.length) {
        hasChanges = true
      } else {
        // 检查每个对话的数据是否有变化
        for (const newMsg of newMessages) {
          const existing = existingMap.get(newMsg.user_id)
          if (!existing) {
            hasChanges = true
            break
          }
          // 只比较关键字段
          if (existing.unread_count !== newMsg.unread_count ||
              existing.last_message !== newMsg.last_message ||
              existing.last_time !== newMsg.last_time) {
            hasChanges = true
            break
          }
        }
      }

      // 如果没有变化，不更新（避免闪烁）
      if (!hasChanges) {
        return
      }

      const existingIds = new Set(this.messageList.map(m => m.user_id))

      // 找出新增的对话
      const addedConversations = newMessages.filter(m => !existingIds.has(m.user_id))

      // 找出需要更新的对话
      const updatedMap = new Map()
      newMessages.forEach(m => {
        const existing = this.messageList.find(em => em.user_id === m.user_id)
        if (existing) {
          // 检查是否有变化
          if (existing.unread_count !== m.unread_count ||
              existing.last_message !== m.last_message ||
              existing.last_time !== m.last_time) {
            updatedMap.set(m.user_id, m)
          }
        }
      })

      // 只更新变化的数据，保持原有顺序
      if (addedConversations.length > 0 || updatedMap.size > 0) {
        // 更新现有列表
        this.messageList = this.messageList.map(m => {
          const updated = updatedMap.get(m.user_id)
          return updated || m
        })

        // 添加新对话到开头
        if (addedConversations.length > 0) {
          this.messageList = [...addedConversations, ...this.messageList]
        }
      }
    },

    async loadUnreadCount() {
      const token = uni.getStorageSync('token')
      if (!token) return
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/social/messages/unread/count',
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        })
        if (res.statusCode === 200) {
          this.unreadMessageCount = res.data.count || 0
        }
      } catch (e) {
        console.error('加载未读数失败:', e)
      }
    },

    goToChat(userId, username) {
      uni.navigateTo({ url: `/pages/chat/chat?userId=${userId}&username=${encodeURIComponent(username)}` })
    },

    getAvatarUrl(avatar) {
      if (!avatar) return DEFAULT_AVATAR
      return getImageUrl(avatar)
    },

    loadAllData() {
      this.loadIndexData()
      this.loadCommunityData()
      this.loadProfileData()
      this.getPopularPosts()
    },

    // 检查登录状态
    checkLoginStatus() {
      const token = uni.getStorageSync('token')
      const user = uni.getStorageSync('user')
      const isLoggedIn = uni.getStorageSync('isLoggedIn')
      
      // 更新登录状态
      this.isLoggedIn = !!(token && isLoggedIn)
      
      if (this.isLoggedIn && user) {
        this.userInfo = user
        this.currentUserId = user.id
      } else {
        this.userInfo = { username: '游客', avatar: '' }
        this.currentUserId = null
        this.userStats = { posts: 0, likes: 0, comments: 0, following_count: 0, follower_count: 0 }
      }
    },

    // 处理关注状态变化事件
    handleFollowStatusChanged(data) {
      const { userId, isFollowing } = data
      // 更新所有该用户的帖子的关注状态
      this.posts.forEach(p => {
        if (String(p.user_id) === String(userId)) {
          p.is_following = isFollowing
        }
      })
    },

    // 处理私信列表刷新事件
    handleRefreshMessages() {
      // 如果当前在私信标签页，刷新私信列表
      if (this.communityTab === 'messages') {
        this.loadMessageList()
        this.loadUnreadCount()
      }
    },

    // 更新缓存的关注列表
    updateFollowingCache(userId, isFollowing) {
      const followingSet = new Set(uni.getStorageSync('followingSet') || [])
      if (isFollowing) {
        followingSet.add(userId)
      } else {
        followingSet.delete(userId)
      }
      uni.setStorageSync('followingSet', Array.from(followingSet))
    },

    // 加载关注列表到缓存
    async loadFollowingList(token) {
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/social/following',
          method: 'GET',
          header: { Authorization: `Bearer ${token}` }
        })
        if (res.statusCode === 200 && res.data.follows) {
          const followingSet = new Set(res.data.follows.map(f => String(f.id)))
          uni.setStorageSync('followingSet', Array.from(followingSet))
          console.log('关注列表已更新:', followingSet)
        }
      } catch (e) {
        console.error('加载关注列表失败:', e)
      }
    },

    // 关注/取消关注
    async toggleFollow(post) {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后再关注用户',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' })
            }
          }
        })
        return
      }
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/social/follow/${post.user_id}`,
          method: 'POST',
          header: { Authorization: `Bearer ${token}` }
        })
        if (res.statusCode === 200) {
          const isFollowing = Boolean(res.data.isFollowing)
          const targetUserId = String(post.user_id)
          // 更新所有该用户的帖子的关注状态
          const updatedPosts = this.posts.map(p => {
            if (String(p.user_id) === targetUserId) {
              return { ...p, is_following: isFollowing }
            }
            return p
          })
          this.posts = updatedPosts
          // 更新缓存的关注列表
          this.updateFollowingCache(targetUserId, isFollowing)
          // 触发全局事件通知其他页面
          uni.$emit('followStatusChanged', { userId: post.user_id, isFollowing })
          uni.showToast({ title: res.data.message, icon: 'none' })
        }
      } catch (e) {
        uni.showToast({ title: '操作失败', icon: 'none' })
      }
    },

    // ========== 首页方法 ==========
    async loadIndexData() {
      this.indexLoading = true
      this.indexError = ''
      try {
        // 并行加载分类和轮播图
        const [categoriesRes] = await Promise.all([
          uni.request({
            url: 'http://shengyu.supersyh.xyz/api/sound/animal-types-grouped',
            method: 'GET'
          }),
          this.loadBanners()
        ])

        if (categoriesRes.data.code === 200) {
          this.animalCategories = categoriesRes.data.data
        } else {
          this.setDefaultCategories()
        }
      } catch (error) {
        console.error('加载首页数据失败:', error)
        this.indexError = '获取数据失败，请重试'
        this.setDefaultCategories()
      } finally {
        this.indexLoading = false
      }
    },

    // ========== 轮播图功能 ==========
    
    // 加载轮播图数据
    async loadBanners() {
      if (this.bannerLoading) return
      
      this.bannerLoading = true
      try {
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/banner/list',
          method: 'GET'
        })
        
        console.log('轮播图API返回:', res.data)
        
        if (res.data && res.data.banners && Array.isArray(res.data.banners)) {
          // 处理轮播图数据，添加完整的图片URL
          this.bannerList = res.data.banners.map(banner => ({
            ...banner,
            fullImageUrl: this.processBannerImageUrl(banner.image_url)
          }))
          
          console.log('处理后的轮播图数据:', this.bannerList)
          
          // 重置当前索引
          this.bannerCurrentIndex = 0
        } else {
          console.log('轮播图数据格式不正确或为空')
          this.bannerList = []
        }
      } catch (error) {
        console.error('加载轮播图失败:', error)
        this.bannerList = []
      } finally {
        this.bannerLoading = false
      }
    },
    
    // 处理轮播图图片URL
    processBannerImageUrl(imageUrl) {
      if (!imageUrl || imageUrl === '') {
        // 没有图片URL，返回默认占位图
        return 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=colorful%20animal%20sound%20app%20banner%20with%20cute%20animals&image_size=landscape_16_9'
      }

      // 使用api.js中的getImageUrl函数处理图片URL
      return getImageUrl(imageUrl)
    },

    // 处理推荐帖子图片URL - 暴露给模板使用
    getRecommendImageUrl(imageUrl) {
      if (!imageUrl || imageUrl === '') {
        return ''
      }
      return getImageUrl(imageUrl)
    },

    // 轮播图点击事件
    handleBannerClick(banner) {
      console.log('点击轮播图:', banner)
      if (banner.link_url) {
        uni.navigateTo({
          url: banner.link_url,
          fail: () => {
            // 如果跳转失败，尝试使用 webview
            uni.navigateTo({
              url: `/pages/webview/webview?url=${encodeURIComponent(banner.link_url)}`
            })
          }
        })
      }
    },
    
    // 轮播图切换事件
    onBannerChange(e) {
      this.bannerCurrentIndex = e.detail.current
    },

    // 轮播图过渡事件（空实现，消除警告）
    onBannerTransition() {
      // 过渡动画事件，无需处理
    },

    // 轮播图位置计算
    getBannerPosition(index) {
      const current = this.bannerCurrentIndex
      const total = this.bannerList.length
      if (index === current) return 'active'
      // 处理循环情况
      if (current === 0 && index === total - 1) return 'prev'
      if (current === total - 1 && index === 0) return 'next'
      if (index === current - 1) return 'prev'
      if (index === current + 1) return 'next'
      return 'far'
    },

    // 轮播图图片加载失败
    onBannerImageError(index) {
      console.error(`轮播图${index + 1}图片加载失败，URL: ${this.bannerList[index]?.fullImageUrl}`)
      // 不清空URL，保留占位符显示
    },
    
    // 启动轮播图自动滚动（swiper 组件已内置，此方法保留用于兼容）
    startBannerAutoScroll() {
      console.log('轮播图自动播放已启用')
    },

    // 停止轮播图自动滚动（swiper 组件已内置，此方法保留用于兼容）
    stopBannerAutoScroll() {
      console.log('轮播图自动播放状态更新')
    },

    setDefaultCategories() {
      this.animalCategories = {
        'popular': {
          'display_name': '热门动物',
          'items': [
            { id: 1, type: 'cat', name: '猫咪', icon: '🐱' },
            { id: 2, type: 'dog', name: '狗狗', icon: '🐶' }
          ]
        },
        'other': {
          'display_name': '其他动物',
          'items': [
            { id: 3, type: 'bird', name: '小鸟', icon: '🐦' },
            { id: 4, type: 'rabbit', name: '兔子', icon: '🐰' },
            { id: 5, type: 'mouse', name: '老鼠', icon: '🐭' },
            { id: 6, type: 'cow', name: '奶牛', icon: '🐮' },
            { id: 7, type: 'pig', name: '小猪', icon: '🐷' },
            { id: 8, type: 'sheep', name: '绵羊', icon: '🐑' }
          ]
        }
      }
    },

    loadDismissedNotifications() {
      const dismissed = uni.getStorageSync('dismissedNotifications')
      if (dismissed) {
        this.dismissedNotifications = JSON.parse(dismissed)
      }
    },

    saveDismissedNotifications() {
      uni.setStorageSync('dismissedNotifications', JSON.stringify(this.dismissedNotifications))
    },

    async checkNotifications() {
      try {
        uni.request({
          url: 'http://shengyu.supersyh.xyz/api/admin/notifications/current',
          method: 'GET',
          success: (res) => {
            console.log('通知API返回:', res.data)

            if (res.data && res.data.hasNotification && res.data.notification) {
              const notification = res.data.notification

              // 检查该通知是否已被用户选择不再提示
              if (this.dismissedNotifications.includes(notification.id)) {
                console.log('通知已被用户关闭:', notification.id)
                return
              }

              this.notification.id = notification.id
              this.notification.title = notification.title
              this.notification.content = notification.content
              this.showNotification = true
              console.log('显示通知:', notification)
            } else {
              console.log('没有通知或数据格式错误')
            }
          },
          fail: (err) => {
            console.error('请求通知失败:', err)
          }
        })
      } catch (error) {
        console.error('获取通知失败:', error)
      }
    },

    closeNotification() {
      this.showNotification = false
    },

    dismissNotification() {
      if (this.notification.id) {
        if (!this.dismissedNotifications.includes(this.notification.id)) {
          this.dismissedNotifications.push(this.notification.id)
          this.saveDismissedNotifications()
        }
      }
      this.showNotification = false
    },

    // ========== 社区方法 ==========
    startCommunityAutoUpdate() {
      this.communityUpdateTimer = setInterval(() => {
        this.page = 1
        this.hasMore = true
        this.loadCommunityData()
      }, 30000)
    },

    async loadCommunityData(loadMore = false) {
      if (!loadMore) {
        this.communityLoading = true
        this.communityError = ''
      }
      try {
        // 获取用户点赞的帖子ID列表（仅登录用户）
        const token = uni.getStorageSync('token')
        let likedIdsSet = new Set()
        if (token) {
          try {
            const likedRes = await uni.request({
              url: 'http://shengyu.supersyh.xyz/api/post/liked-ids',
              method: 'GET',
              header: { 'Authorization': `Bearer ${token}` }
            })
            if (likedRes.statusCode === 200 && likedRes.data.likedIds) {
              likedIdsSet = new Set(likedRes.data.likedIds.map(id => String(id)))
              // 缓存到本地
              uni.setStorageSync('likedPostsSet', Array.from(likedIdsSet))
            }
          } catch (e) {
            console.error('获取点赞列表失败:', e)
            // 使用缓存的点赞列表
            const cachedLikedIds = uni.getStorageSync('likedPostsSet') || []
            likedIdsSet = new Set(cachedLikedIds)
          }
        }

        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/post/list?page=${this.page}&pageSize=${this.pageSize}`,
          method: 'GET'
        })
        if (res.data.posts) {
          // 获取缓存的关注列表（仅登录用户）
          const followingSet = token ? new Set(uni.getStorageSync('followingSet') || []) : new Set()
          // 将 is_following 和 liked 转换为布尔值，并使用缓存的关注列表进行补充
          const posts = res.data.posts.map(post => {
            const isFollowingFromServer = Boolean(post.is_following)
            const isFollowingFromCache = token ? followingSet.has(String(post.user_id)) : false
            // 优先使用后端返回的liked字段，如果没有则使用本地缓存的点赞列表
            const isLikedFromServer = Boolean(post.liked)
            const isLikedFromCache = likedIdsSet.has(String(post.id))
            return {
              ...post,
              is_following: isFollowingFromServer || isFollowingFromCache,
              liked: isLikedFromServer || isLikedFromCache
            }
          })
          if (loadMore) {
            this.posts = [...this.posts, ...posts]
          } else {
            this.posts = posts
          }
          this.hasMore = res.data.posts.length === this.pageSize
        } else {
          this.hasMore = false
          if (!loadMore) {
            this.posts = []
          }
        }
      } catch (error) {
        this.communityError = '获取帖子失败，请重试'
        if (!loadMore) {
          this.posts = []
        }
      } finally {
        this.communityLoading = false
        this.loadingMore = false
      }
    },

    loadMorePosts() {
      if (!this.loadingMore && this.hasMore && !this.communityLoading) {
        this.loadingMore = true
        this.page++
        this.loadCommunityData(true)
      }
    },

    // 下拉刷新
    async onRefresh() {
      this.isRefreshing = true
      this.page = 1
      this.hasMore = true
      await this.loadCommunityData(false)
      this.isRefreshing = false
      uni.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      })
    },

    goPublish() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后发布帖子',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' })
            }
          }
        })
      } else {
        uni.navigateTo({ url: '/pages/publish/publish' })
      }
    },

    async likePost(postId) {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      // 找到当前帖子
      const postIndex = this.posts.findIndex(p => p.id === postId)
      if (postIndex === -1) return

      const post = this.posts[postIndex]
      const originalLiked = post.liked
      const originalCount = post.like_count || 0

      // 乐观更新UI
      this.posts[postIndex].liked = !originalLiked
      this.posts[postIndex].like_count = originalLiked ? originalCount - 1 : originalCount + 1

      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/post/like/${postId}`,
          method: 'POST',
          header: { 'Authorization': `Bearer ${token}` }
        })

        if (res.statusCode === 200 && res.data.message) {
          // 点赞成功，更新本地缓存
          const likedPostsSet = new Set(uni.getStorageSync('likedPostsSet') || [])
          if (originalLiked) {
            // 取消点赞，从缓存中移除
            likedPostsSet.delete(String(postId))
          } else {
            // 点赞，添加到缓存
            likedPostsSet.add(String(postId))
          }
          uni.setStorageSync('likedPostsSet', Array.from(likedPostsSet))

          // 显示提示
          uni.showToast({
            title: originalLiked ? '取消点赞' : '点赞成功',
            icon: 'none',
            duration: 1000
          })
        } else {
          // 请求失败，恢复原始状态
          this.posts[postIndex].liked = originalLiked
          this.posts[postIndex].like_count = originalCount
          uni.showToast({
            title: '操作失败，请重试',
            icon: 'none'
          })
        }
      } catch (error) {
        // 网络错误，恢复原始状态
        this.posts[postIndex].liked = originalLiked
        this.posts[postIndex].like_count = originalCount
        uni.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        })
        console.error('点赞失败:', error)
      }
    },

    async showComments(postId) {
      this.currentPostId = postId
      this.comments = []
      this.loadingComments = true
      this.showCommentPopup = true
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/post/comments/${postId}`,
          method: 'GET'
        })
        console.log('评论数据:', res.data)
        if (res.statusCode === 200 && res.data) {
          // 支持多种数据格式
          if (Array.isArray(res.data)) {
            this.comments = res.data
          } else if (res.data.comments && Array.isArray(res.data.comments)) {
            this.comments = res.data.comments
          } else if (res.data.data && Array.isArray(res.data.data)) {
            this.comments = res.data.data
          } else {
            this.comments = []
          }
        } else {
          this.comments = []
          uni.showToast({ title: '获取评论失败', icon: 'none' })
        }
      } catch (error) {
        console.error('获取评论失败:', error)
        this.comments = []
        uni.showToast({ title: '获取评论失败', icon: 'none' })
      } finally {
        this.loadingComments = false
      }
    },

    closeCommentPopup() {
      this.showCommentPopup = false
      this.commentContent = ''
    },

    async sendComment() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }
      if (!this.commentContent.trim()) {
        uni.showToast({ title: '请输入评论内容', icon: 'none' })
        return
      }
      try {
        const res = await uni.request({
          url: `http://shengyu.supersyh.xyz/api/post/comment/${this.currentPostId}`,
          method: 'POST',
          header: { 'Authorization': `Bearer ${token}` },
          data: { content: this.commentContent }
        })
        if (res.data.message === '评论成功') {
          this.commentContent = ''
          this.showComments(this.currentPostId)
          uni.showToast({ title: '评论成功', icon: 'success' })
        }
      } catch (error) {
      }
    },

    playSound(soundUrl) {
      uni.navigateTo({ url: `/pages/sound-player/sound-player?url=${encodeURIComponent(soundUrl)}` })
    },

    // ========== 我的页面方法 ==========
    startProfileAutoUpdate() {
      this.profileUpdateTimer = setInterval(() => {
        if (this.isLoggedIn) {
          this.loadProfileData()
        }
      }, 30000)
    },

    initSocket() {
      const token = uni.getStorageSync('token')
      const userId = uni.getStorageSync('userId')
      if (!token || !userId) return
      
      this.removeWebSocketListeners()
      
      wsService.on('connected', this.onWsConnected)
      wsService.on('disconnected', this.onWsDisconnected)
      wsService.on('new_message', this.onNewMessage)
      wsService.on('unread_count', this.onUnreadCountUpdate)
      wsService.on('reconnect_failed', this.onWsReconnectFailed)
      
      if (wsService.getConnectionStatus()) {
        this.wsConnected = true
        this.loadUnreadCount()
        if (this.communityTab === 'messages') {
          this.loadMessageList()
        }
      } else {
        wsService.connect(userId, token)
        this.loadUnreadCount()
        if (this.communityTab === 'messages') {
          this.loadMessageList()
        }
      }
      
      console.log('主页面 WebSocket 已初始化')
    },
    
    removeWebSocketListeners() {
      wsService.off('connected', this.onWsConnected)
      wsService.off('disconnected', this.onWsDisconnected)
      wsService.off('new_message', this.onNewMessage)
      wsService.off('unread_count', this.onUnreadCountUpdate)
      wsService.off('reconnect_failed', this.onWsReconnectFailed)
    },
    
    onWsConnected() {
      console.log('主页面 WebSocket 已连接')
      this.wsConnected = true
      // 连接成功后立即获取未读消息数
      this.loadUnreadCount()
    },
    
    onWsDisconnected() {
      console.log('主页面 WebSocket 已断开')
      this.wsConnected = false
    },
    
    onNewMessage(message) {
      console.log('主页面收到新消息:', message)
      this.unreadMessageCount++
      if (this.communityTab === 'messages') {
        this.loadMessageList()
      }
    },
    
    onUnreadCountUpdate(data) {
      console.log('主页面未读数更新:', data)
      if (data.count !== undefined) {
        this.unreadMessageCount = data.count
      }
    },
    
    onWsReconnectFailed() {
      console.log('主页面 WebSocket 重连失败')
      this.wsConnected = false
    },
    
    startUnreadMessagePolling() {
      if (this.unreadMessageTimer) return
      
      console.log('启动未读消息数轮询（降级方案）')
      this.loadUnreadCount()
      this.unreadMessageTimer = setInterval(() => {
        this.loadUnreadCount()
      }, 10000)
    },
    
    stopUnreadMessagePolling() {
      if (this.unreadMessageTimer) {
        clearInterval(this.unreadMessageTimer)
        this.unreadMessageTimer = null
      }
    },

    async loadProfileData() {
      this.profileLoading = true
      const token = uni.getStorageSync('token')
      const user = uni.getStorageSync('user')
      this.isLoggedIn = !!token

      if (token && user) {
        this.userInfo = user
        try {
          const userRes = await uni.request({
            url: 'http://shengyu.supersyh.xyz/api/auth/user',
            method: 'GET',
            header: { 'Authorization': `Bearer ${token}` }
          })
          if (userRes.statusCode === 200 && userRes.data && userRes.data.user) {
            const statsRes = await uni.request({
              url: 'http://shengyu.supersyh.xyz/api/auth/user/stats',
              method: 'GET',
              header: { 'Authorization': `Bearer ${token}` }
            })
            this.userInfo = {
              ...userRes.data.user,
              posts: statsRes.data?.stats?.posts || 0,
              likes: statsRes.data?.stats?.likes || 0,
              comments: statsRes.data?.stats?.comments || 0
            }
            uni.setStorageSync('user', this.userInfo)
            this.userStats = {
              posts: this.userInfo.posts,
              likes: this.userInfo.likes,
              comments: this.userInfo.comments,
              following_count: statsRes.data?.stats?.following_count || 0,
              follower_count: statsRes.data?.stats?.follower_count || 0
            }
            // 加载关注列表到缓存
            this.loadFollowingList(token)
          }
        } catch (error) {
        }
      } else {
        this.userInfo = { username: '游客', avatar: '' }
        this.userStats = { posts: 0, likes: 0, comments: 0 }
      }
      this.profileLoading = false
    },

    changeAvatar() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempFilePaths = res.tempFilePaths
          uni.uploadFile({
            url: 'http://shengyu.supersyh.xyz/api/auth/avatar',
            filePath: tempFilePaths[0],
            name: 'avatar',
            header: { 'Authorization': `Bearer ${uni.getStorageSync('token')}` },
            success: (uploadRes) => {
              try {
                const data = JSON.parse(uploadRes.data)
                if (data.message === '头像上传成功') {
                  uni.showToast({ title: '头像更换成功', icon: 'success' })
                  this.loadProfileData()
                } else {
                  uni.showToast({ title: '头像更换失败', icon: 'none' })
                }
              } catch (e) {
                uni.showToast({ title: '头像更换失败', icon: 'none' })
              }
            },
            fail: () => {
              uni.showToast({ title: '头像上传失败', icon: 'none' })
            }
          })
        }
      })
    },

    // ========== 通用方法 ==========
    goSearch() {
      uni.navigateTo({ url: '/pages/search/search' });
    },
    goScan() {
      uni.navigateTo({ url: '/pages/scan/scan' });
    },
    goRecord() {
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showModal({
          title: '提示',
          content: '请先登录后使用录制功能',
          confirmText: '去登录',
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({ url: '/pages/login/login' });
            }
          }
        });
      } else {
        uni.navigateTo({ url: '/pages/record/record' });
      }
    },



    goSoundDetail(type) {
      uni.navigateTo({ url: `/pages/sound-detail/sound-detail?type=${type}` })
    },

    goPostDetail(postId) {
      uni.navigateTo({ url: `/pages/post-detail/post-detail?id=${postId}` })
    },

    goToMyPosts() {
      uni.navigateTo({ url: '/pages/my-posts/my-posts' })
    },

    goToMySounds() {
      uni.navigateTo({ url: '/pages/my-sounds/my-sounds' })
    },

    goToMyLikes() {
      uni.navigateTo({ url: '/pages/my-likes/my-likes' })
    },

    goToSettings() {
      uni.showToast({ title: '设置功能开发中', icon: 'none' })
    },

    goToAbout() {
      uni.navigateTo({ url: '/pages/about/about' })
    },

    goToFollows() {
      const user = uni.getStorageSync('user')
      if (user && user.id) {
        uni.navigateTo({ url: `/pages/follows/follows?type=following&userId=${user.id}` })
      } else {
        uni.showToast({ title: '请先登录', icon: 'none' })
      }
    },

    goToFollowers() {
      const user = uni.getStorageSync('user')
      if (user && user.id) {
        uni.navigateTo({ url: `/pages/follows/follows?type=followers&userId=${user.id}` })
      } else {
        uni.showToast({ title: '请先登录', icon: 'none' })
      }
    },

    async checkWechatBindStatus() {
      const token = uni.getStorageSync('token')
      if (!token) return
      
      try {
        const { wechatAuth } = await import('@/utils/wechat-auth.js')
        const result = await wechatAuth.checkBindStatus()
        this.wechatBound = result.bound
        this.wechatInfo = result.wechatInfo
      } catch (error) {
        console.error('检查微信绑定状态失败:', error)
      }
    },

    async handleWechatBind() {
      const token = uni.getStorageSync('token')
      if (!token) {
        uni.showToast({ title: '请先登录', icon: 'none' })
        return
      }

      const { wechatAuth } = await import('@/utils/wechat-auth.js')

      if (this.wechatBound) {
        uni.showActionSheet({
          title: '微信绑定',
          itemList: ['查看绑定信息', '解绑微信'],
          success: (res) => {
            if (res.tapIndex === 0) {
              uni.showModal({
                title: '微信绑定信息',
                content: `微信昵称：${this.wechatInfo?.nickname || '未知'}\n绑定状态：已绑定`,
                showCancel: false
              })
            } else if (res.tapIndex === 1) {
              this.unbindWechat()
            }
          }
        })
      } else {
        uni.showModal({
          title: '绑定微信',
          content: '绑定微信后，您可以使用微信快速登录此账号。是否继续？',
          success: (res) => {
            if (res.confirm) {
              this.bindWechat()
            }
          }
        })
      }
    },

    async bindWechat() {
      uni.showLoading({ title: '绑定中...' })
      
      try {
        const { wechatAuth } = await import('@/utils/wechat-auth.js')
        const result = await wechatAuth.bindWechat()
        
        uni.hideLoading()
        
        if (result.success) {
          this.wechatBound = true
          this.wechatInfo = result.wechatInfo
          uni.showToast({ title: '绑定成功', icon: 'success' })
        }
      } catch (error) {
        uni.hideLoading()
        uni.showToast({ title: error.message || '绑定失败', icon: 'none' })
      }
    },

    async unbindWechat() {
      uni.showModal({
        title: '解绑微信',
        content: '解绑后将无法使用微信登录，确定要解绑吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '解绑中...' })
            
            try {
              const { wechatAuth } = await import('@/utils/wechat-auth.js')
              const result = await wechatAuth.unbindWechat()
              
              uni.hideLoading()
              
              if (result.success) {
                this.wechatBound = false
                this.wechatInfo = null
                uni.showToast({ title: '解绑成功', icon: 'success' })
              }
            } catch (error) {
              uni.hideLoading()
              uni.showToast({ title: error.message || '解绑失败', icon: 'none' })
            }
          }
        }
      })
    },

    goToLogin() {
      uni.navigateTo({ url: '/pages/login/login' })
    },

    goToUserProfile(userId) {
      if (!userId) {
        uni.showToast({ title: '无法获取用户信息', icon: 'none' })
        return
      }
      uni.navigateTo({ url: `/pages/user-profile/user-profile?id=${userId}` })
    },

    // 获取热门帖子
    async getPopularPosts() {
      this.popularLoading = true
      try {
        const token = uni.getStorageSync('token')
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/post/popular',
          method: 'GET',
          header: token ? { Authorization: `Bearer ${token}` } : {}
        })
        if (res.statusCode === 200 && res.data.posts) {
          this.popularPosts = res.data.posts
        }
      } catch (error) {
        console.error('获取热门帖子失败:', error)
      } finally {
        this.popularLoading = false
      }
    },

    // 跳转到社区页面
    goCommunity() {
      this.currentIndex = 1
    },

    logout() {
      uni.showModal({
        title: '提示',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            uni.removeStorageSync('token')
            uni.removeStorageSync('user')
            uni.removeStorageSync('isLoggedIn')
            uni.removeStorageSync('followingSet')
            uni.setStorageSync('guest', true)
            this.isLoggedIn = false
            this.userInfo = { username: '游客' }
            this.userStats = { posts: 0, likes: 0, comments: 0 }
            uni.showToast({ title: '已退出登录', icon: 'success' })
          }
        }
      })
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) return '刚刚'
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前'

      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')

      if (year === now.getFullYear()) {
        return `${month}月${day}日 ${hours}:${minutes}`
      }
      return `${year}年${month}月${day}日`
    }
  }
}
</script>

<style scoped>
@import '/static/styles/theme.css';

.main-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  position: relative;
}

/* 录制按钮 - 流动渐变色 */
.publish-btn {
  position: fixed;
  bottom: 140rpx;
  right: 30rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 50%, #FF9A9E 100%);
  background-size: 200% 200%;
  animation: gradient-flow 4s ease infinite, pulse-glow 2s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.publish-btn::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 70%
  );
  animation: shimmer 3s infinite;
}

.publish-btn:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.3);
}

.publish-icon-svg {
  color: #FFFFFF;
  position: relative;
  z-index: 1;
}

/* 动画定义 */
@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  }
  50% {
    box-shadow: 0 12rpx 48rpx rgba(255, 154, 158, 0.6);
  }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.main-swiper {
  flex: 1;
  height: calc(100vh - 120rpx);
}

.swiper-item {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.page-container {
  height: 100%;
  overflow-y: auto;
  padding-bottom: 40rpx;
}

/* 首页样式 */
.index-content {
  padding: 20rpx 20rpx 200rpx;
  padding-top: 40rpx;
  box-sizing: border-box;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20rpx);
  border-radius: 40rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 4rpx 20rpx rgba(255, 154, 158, 0.15);
}

.search-input-wrapper {
  flex: 1;
}

.search-input {
  display: flex;
  align-items: center;
  background: rgba(245, 245, 245, 0.8);
  border-radius: 32rpx;
  padding: 16rpx 24rpx;
  border: 2rpx solid rgba(255, 154, 158, 0.4);
}

.search-icon-svg {
  margin-right: 12rpx;
  color: #FF9A9E;
}

.search-placeholder {
  font-size: 26rpx;
  color: #999999;
}

.scan-btn {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(255, 154, 158, 0.4);
  transition: transform 0.2s ease;
}

.scan-btn:active {
  transform: scale(0.95);
}

.scan-icon-svg {
  color: #FFFFFF;
}

/* 轮播图样式 - 简洁层叠效果 */
.banner-section {
  margin: 30rpx 0 40rpx;
  position: relative;
}

.banner-swiper {
  height: 340rpx;
}

.banner-item-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
  overflow: hidden;
}

.banner-swiper swiper-item {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  padding: 0 8rpx;
  overflow: hidden;
  border-radius: 24rpx;
}

.banner-card {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
  overflow: hidden;
  background: #FFFFFF;
  transition: transform 0.35s ease, opacity 0.35s ease;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
}

/* 中心激活状态 */
.banner-item-wrapper.banner-active .banner-card {
  transform: scale(1.08);
  opacity: 1;
}

/* 左侧预览状态 */
.banner-item-wrapper.banner-prev .banner-card {
  transform: scale(0.88);
  opacity: 0.6;
}

/* 右侧预览状态 */
.banner-item-wrapper.banner-next .banner-card {
  transform: scale(0.88);
  opacity: 0.6;
}

/* 远处状态 */
.banner-item-wrapper.banner-far .banner-card {
  transform: scale(0.75);
  opacity: 0.3;
}

.banner-image {
  width: 100%;
  height: 100%;
  border-radius: 24rpx;
}

.banner-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 24rpx;
}

.placeholder-text {
  font-size: 32rpx;
  color: #FF9A9E;
  font-weight: 500;
}

.banner-title-wrapper {
  position: absolute;
  left: 0;
  bottom: 0;
  right: 0;
  padding: 40rpx 24rpx 24rpx;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.6), transparent);
  border-radius: 0 0 20rpx 20rpx;
}

.banner-title {
  font-size: 30rpx;
  color: #FFFFFF;
  font-weight: 600;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.banner-indicators {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6rpx;
  margin-top: 20rpx;
  height: 16rpx;
}

.indicator-dot {
  width: 6rpx;
  height: 6rpx;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.indicator-dot.active {
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
  width: 16rpx;
  height: 6rpx;
  border-radius: 3rpx;
}

/* 小程序应用式分类区域 */
.app-grid-container {
  background: #FFFFFF;
  border-radius: 24rpx;
  margin: 20rpx 0;
  padding: 24rpx 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.category-app-section {
  margin-bottom: 24rpx;
}

.category-app-section:last-child {
  margin-bottom: 0;
}

.category-app-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
  padding-left: 8rpx;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx 8rpx;
}

.app-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8rpx 4rpx;
}

.app-icon-wrapper {
  width: 100rpx;
  height: 100rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10rpx;
  transition: transform 0.2s ease;
}

/* 淡淡的炫彩渐变配色 - 更淡更柔和 */
.app-item:nth-child(6n+1) .app-icon-wrapper {
  background: linear-gradient(135deg, #f0f4ff 0%, #e8e0f7 100%);
  box-shadow: 0 4rpx 16rpx rgba(199, 184, 240, 0.25);
}

.app-item:nth-child(6n+2) .app-icon-wrapper {
  background: linear-gradient(135deg, #fff5f8 0%, #ffe0ed 100%);
  box-shadow: 0 4rpx 16rpx rgba(248, 187, 217, 0.25);
}

.app-item:nth-child(6n+3) .app-icon-wrapper {
  background: linear-gradient(135deg, #f0f9ff 0%, #d6ebfa 100%);
  box-shadow: 0 4rpx 16rpx rgba(187, 222, 251, 0.25);
}

.app-item:nth-child(6n+4) .app-icon-wrapper {
  background: linear-gradient(135deg, #f0faf0 0%, #dbf0dc 100%);
  box-shadow: 0 4rpx 16rpx rgba(200, 230, 201, 0.25);
}

.app-item:nth-child(6n+5) .app-icon-wrapper {
  background: linear-gradient(135deg, #fffbf0 0%, #fff0d9 100%);
  box-shadow: 0 4rpx 16rpx rgba(255, 224, 178, 0.25);
}

.app-item:nth-child(6n+6) .app-icon-wrapper {
  background: linear-gradient(135deg, #faf0fa 0%, #f0e0f0 100%);
  box-shadow: 0 4rpx 16rpx rgba(225, 190, 231, 0.25);
}

.app-item:active .app-icon-wrapper {
  transform: scale(0.92);
}

.app-icon-emoji {
  font-size: 50rpx;
  line-height: 1;
}

.app-name {
  font-size: 20rpx;
  color: #555555;
  text-align: center;
  line-height: 1.2;
}

.app-loading, .app-error {
  text-align: center;
  padding: 40rpx 0;
}

.app-retry-btn {
  margin-top: 16rpx;
  padding: 12rpx 32rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 24rpx;
  font-size: 24rpx;
  border: none;
}

/* 小程序式热门推荐区域 */
/* 通知弹窗 */
.notification-popup {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.notification-content {
  background: #FFFFFF;
  border-radius: 24rpx;
  width: 80%;
  max-width: 600rpx;
  overflow: hidden;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #EEEEEE;
}

.notification-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.notification-close {
  font-size: 40rpx;
  color: #999999;
  padding: 0 10rpx;
}

.notification-body {
  padding: 30rpx;
  font-size: 28rpx;
  color: #666666;
  line-height: 1.6;
}

.notification-footer {
  display: flex;
  padding: 20rpx 30rpx 30rpx;
  gap: 20rpx;
}

.notification-btn {
  flex: 1;
  padding: 14rpx 0;
  border-radius: 10rpx;
  font-size: 24rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border: none;
}

.notification-btn-secondary {
  background: #F5F5F5;
  color: #666666;
}

/* 热门推荐区域 */
.recommend-section {
  margin-top: 30rpx;
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.more-btn {
  display: flex;
  align-items: center;
  gap: 4rpx;
  padding: 6rpx 14rpx;
  background: rgba(255, 154, 158, 0.1);
  border-radius: 20rpx;
  transition: all 0.3s ease;
}

.more-btn:active {
  background: rgba(255, 154, 158, 0.2);
  transform: scale(0.95);
}

.more-text {
  font-size: 22rpx;
  color: #FF6B9D;
  font-weight: 500;
}

.more-icon {
  color: #FF6B9D;
}

.recommend-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.recommend-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
}

.recommend-item:active {
  transform: translateY(-2rpx);
  box-shadow: 0 6rpx 16rpx rgba(0, 0, 0, 0.1);
}

.recommend-rank {
  width: 36rpx;
  height: 36rpx;
  border-radius: 8rpx;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: bold;
  color: #888888;
  flex-shrink: 0;
  margin-top: 2rpx;
}

.recommend-rank.rank-top {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
}

.recommend-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-left: 8rpx;
}

.recommend-text {
  font-size: 28rpx;
  color: #333333;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recommend-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recommend-author {
  display: flex;
  align-items: center;
  gap: 4rpx;
}

.author-avatar {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #F5F5F5;
}

.author-avatar-placeholder {
  width: 28rpx;
  height: 28rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #CCCCCC;
}

.author-name {
  font-size: 18rpx;
  color: #888888;
}

.recommend-stats {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 2rpx;
}

.stat-icon {
  color: #FF9A9E;
}

.stat-num {
  font-size: 18rpx;
  color: #888888;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  background: #FFFFFF;
  border-radius: 10rpx;
  box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
}

.empty-icon {
  color: #CCCCCC;
  margin-bottom: 12rpx;
}

.empty-text {
  font-size: 24rpx;
  color: #999999;
}

/* 社区页面容器 - 使用百分比高度确保安卓适配 */
.community-page-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  overflow: hidden;
}

/* 固定顶部区域 - 使用 flex-shrink 防止压缩 */
.community-fixed-header {
  flex-shrink: 0;
  background: linear-gradient(180deg, #FFF5F7 0%, #F8F8F8 100%);
  padding: 20rpx 20rpx 10rpx;
  z-index: 100;
  /* 确保在安卓上正确显示 */
  position: relative;
}

/* 二级滑动栏 - 固定在顶部，使用更兼容的样式 */
.sub-tabs {
  display: flex;
  justify-content: center;
  margin-bottom: 10rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 40rpx;
  padding: 8rpx;
  box-shadow: 0 2rpx 10rpx rgba(255, 154, 158, 0.15);
  /* 安卓适配：确保背景色正确 */
  background-color: rgba(255, 255, 255, 0.95);
}

.sub-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx 40rpx;
  border-radius: 32rpx;
  position: relative;
  transition: all 0.3s ease;
}

.sub-tab.active {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
}

.sub-tab-text {
  font-size: 30rpx;
  color: #666666;
  font-weight: 500;
}

.sub-tab.active .sub-tab-text {
  color: #FFFFFF;
  font-weight: 600;
}

.message-badge {
  position: absolute;
  top: 4rpx;
  right: 16rpx;
  background: #FF4757;
  color: #FFFFFF;
  font-size: 16rpx;
  min-width: 24rpx;
  height: 24rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4rpx;
  box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.4);
}

/* 社区面板 - 使用 flex 布局确保高度正确计算 */
.community-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  /* 安卓适配：最小高度确保内容可见 */
  min-height: 0;
}

/* 帖子列表区域 - 独立滚动，使用更可靠的高度设置 */
.post-list-scroll {
  flex: 1;
  width: 100%;
  height: 100%;
  padding: 0 20rpx;
  /* 安卓适配：确保滚动区域正确计算 */
  box-sizing: border-box;
}

/* 私信面板 */
.messages-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0 20rpx;
  /* 安卓适配：最小高度确保内容可见 */
  min-height: 0;
}

/* 私信列表 - 独立滚动区域 */
.messages-list-scroll {
  flex: 1;
  width: 100%;
  height: 100%;
  /* 安卓适配：确保滚动区域正确计算 */
  box-sizing: border-box;
}

.empty-messages {
  text-align: center;
  padding: 100rpx 40rpx;
}

.empty-messages .empty-icon-svg {
  margin-bottom: 20rpx;
  color: #CCCCCC;
}

.empty-messages .empty-text {
  font-size: 32rpx;
  color: #666;
  display: block;
  margin-bottom: 10rpx;
}

.empty-messages .empty-subtext {
  font-size: 26rpx;
  color: #999;
}

.message-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.message-avatar-wrapper {
  position: relative;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  margin-right: 20rpx;
}

.message-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.unread-badge {
  background: #FF4757;
  color: #FFFFFF;
  font-size: 22rpx;
  min-width: 36rpx;
  height: 36rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  box-sizing: border-box;
}

.message-info {
  flex: 1;
  overflow: hidden;
}

.message-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.message-username {
  font-size: 32rpx;
  font-weight: 600;
  color: #333333;
}

.message-time {
  font-size: 24rpx;
  color: #999999;
}

.message-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16rpx;
}

.message-preview {
  font-size: 28rpx;
  color: #666666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.message-preview.unread {
  color: #333333;
  font-weight: 500;
}

.community-panel .publish-btn {
  position: fixed;
  right: 40rpx;
  bottom: 160rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(255, 154, 158, 0.4);
  z-index: 99;
}

.community-panel .publish-icon-svg {
  color: #FFFFFF;
}

.community-header {
  padding: 10rpx 0;
  text-align: center;
}

.header-title {
  font-size: 40rpx;
  font-weight: bold;
  color: #333333;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100rpx 0;
}

.loading-animation {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.loading-dot {
  width: 20rpx;
  height: 20rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

@keyframes loading-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

.post-list-content {
  animation: fade-in 0.3s ease;
}

.post-item {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.avatar-wrapper {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.username {
  font-size: 28rpx;
  font-weight: 600;
  color: #333333;
}

.post-time {
  font-size: 24rpx;
  color: #999999;
}

.follow-btn-small {
  padding: 8rpx 20rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 24rpx;
  margin-left: 16rpx;
}

.follow-btn-small.following {
  background: #F0F0F0;
}

.follow-btn-text {
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
}

.follow-btn-small.following .follow-btn-text {
  color: #999999;
}

.post-content {
  margin-bottom: 16rpx;
}

.content {
  font-size: 28rpx;
  color: #555555;
  line-height: 1.6;
}

.post-image {
  width: 100%;
  max-height: 400rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

.audio-container {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  padding: 20rpx;
  border-radius: 12rpx;
  margin-top: 16rpx;
}

.audio-icon-svg {
  margin-right: 12rpx;
  color: #FFFFFF;
}

.audio-text {
  font-size: 26rpx;
  color: #FFFFFF;
}

.post-footer {
  display: flex;
  gap: 30rpx;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.action-icon-svg {
  color: #999999;
}

.action-icon-svg.liked {
  color: #FF6B9D;
}

.action-text {
  font-size: 24rpx;
  color: #999999;
}

.loading-more {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}

.loading-more-text {
  font-size: 24rpx;
  color: #999999;
  margin-top: 16rpx;
}

.loading-animation-small {
  display: flex;
  gap: 12rpx;
}

.loading-dot-small {
  width: 16rpx;
  height: 16rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 50%;
  animation: loading-bounce 1.4s ease-in-out infinite both;
}

.no-more {
  text-align: center;
  padding: 40rpx;
}

.no-more-text {
  font-size: 24rpx;
  color: #999999;
}



/* 底部安全区域 - 防止被导航栏遮盖 */
.safe-area-bottom {
  height: 120rpx;
  width: 100%;
}

/* 评论弹窗 */
.comment-popup {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 1001;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.comment-popup-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.comment-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #EEEEEE;
}

.comment-popup-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.comment-popup-close {
  font-size: 32rpx;
  color: #999999;
  padding: 10rpx;
}

.comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 20rpx 30rpx;
  max-height: 50vh;
}

.comment-item {
  display: flex;
  margin-bottom: 24rpx;
}

.comment-avatar-wrapper {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
}

.comment-avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.comment-username {
  font-size: 26rpx;
  font-weight: 600;
  color: #333333;
}

.comment-time {
  font-size: 22rpx;
  color: #999999;
}

.comment-text {
  font-size: 26rpx;
  color: #666666;
  line-height: 1.5;
}

.empty-comments {
  text-align: center;
  padding: 60rpx 0;
  color: #999999;
}

.comment-input-container {
  display: flex;
  padding: 20rpx 30rpx 40rpx;
  border-top: 1rpx solid #EEEEEE;
  gap: 20rpx;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 36rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
}

.send-btn {
  padding: 0 40rpx;
  height: 72rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
}

.send-btn[disabled] {
  background: #CCCCCC;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* 我的页面样式 */
.profile-content {
  padding: 20rpx;
  padding-top: 40rpx;
  padding-bottom: 160rpx;
  min-height: calc(100vh - 120rpx);
}

/* 骨架屏 */
.skeleton-loading {
  animation: skeleton-fade 0.3s ease;
}

@keyframes skeleton-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

.skeleton-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  display: flex;
  align-items: center;
}

.skeleton-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-right: 30rpx;
}

.skeleton-info {
  flex: 1;
}

.skeleton-line {
  height: 28rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.skeleton-line.short {
  width: 60%;
}

.skeleton-line.mini {
  width: 80rpx;
  height: 24rpx;
}

.skeleton-stats {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.skeleton-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.skeleton-circle {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-bottom: 12rpx;
}

.skeleton-menu {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 20rpx;
}

.skeleton-menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.skeleton-menu-item:last-child {
  border-bottom: none;
}

.skeleton-icon {
  width: 48rpx;
  height: 48rpx;
  border-radius: 12rpx;
  background: linear-gradient(90deg, #F0F0F0 25%, #E0E0E0 50%, #F0F0F0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  margin-right: 20rpx;
}

@keyframes skeleton-loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 未登录状态 */
.not-logged-in {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 40rpx;
}

.empty-avatar {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFE5E8 0%, #FFF0F3 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 40rpx;
}

.empty-icon-svg {
  color: #FF9A9E;
}

.empty-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333333;
  margin-bottom: 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 40rpx;
}

.login-button {
  padding: 20rpx 60rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 36rpx;
  font-size: 28rpx;
  border: none;
}

/* 已登录状态 */
.logged-in {
  animation: fade-in 0.3s ease;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20rpx); }
  to { opacity: 1; transform: translateY(0); }
}

.user-card {
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  border-radius: 40rpx;
  padding: 50rpx 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 16rpx 48rpx rgba(255, 154, 158, 0.35);
}

.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.user-avatar-large {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.5);
  margin-right: 24rpx;
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 36rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 8rpx;
}

.user-email {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-icon-svg {
  color: #FFFFFF;
}

.stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 30rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.3);
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-number {
  font-size: 40rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.9);
}

.divider-line {
  width: 1rpx;
  height: 60rpx;
  background: rgba(255, 255, 255, 0.3);
}

/* 关注和粉丝统计 */
.follow-stats-row {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 20rpx;
  margin-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.2);
}

.follow-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 40rpx;
}

.follow-stat-number {
  font-size: 32rpx;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 4rpx;
}

.follow-stat-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.8);
}

.menu-section {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.menu-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333333;
  padding: 20rpx 24rpx 10rpx;
  display: block;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-bottom: 1rpx solid rgba(0, 0, 0, 0.05);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon-wrapper {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.menu-icon-svg {
  color: #FFFFFF;
}

/* 微信绑定状态 */
.bind-status {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.bind-status-text {
  font-size: 26rpx;
  color: #999;
}

.bind-status-text.bound {
  color: #07C160;
}

.menu-text {
  flex: 1;
  font-size: 30rpx;
  color: #333333;
}

.menu-arrow-svg {
  color: #CCCCCC;
}

.logout-section {
  padding: 20rpx 40rpx;
}

.logout-button {
  width: 100%;
  padding: 16rpx 0;
  background: rgba(255, 107, 107, 0.1);
  color: #FF6B6B;
  border-radius: 30rpx;
  font-size: 28rpx;
  border: none;
}

.loading, .error, .empty-state {
  text-align: center;
  padding: 60rpx 0;
}

.retry-btn {
  margin-top: 20rpx;
  padding: 16rpx 40rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%);
  color: #FFFFFF;
  border-radius: 30rpx;
  border: none;
  font-size: 28rpx;
}
</style>
