<template>
  <view class="svg-icon" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- 搜索图标 -->
      <g v-if="name === 'search'">
        <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/>
        <path d="M20 20L16 16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 扫描/二维码图标 -->
      <g v-else-if="name === 'scan'">
        <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M17 3H19C20.1046 3 21 3.89543 21 5V7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M21 17V19C21 20.1046 20.1046 21 19 21H17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 8V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 相机图标 -->
      <g v-else-if="name === 'camera'">
        <rect x="3" y="6" width="18" height="14" rx="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="12" cy="13" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="M8 6L9.5 4H14.5L16 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- 闪电/闪光灯图标 -->
      <g v-else-if="name === 'flashlight'">
        <path d="M13 2L4 14H12L11 22L20 10H12L13 2Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
      </g>
      
      <!-- 相册/图片图标 -->
      <g v-else-if="name === 'image'">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
        <path d="M3 15L8 10L13 15L16 12L21 17V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V15Z" fill="currentColor" fill-opacity="0.2"/>
      </g>
      
      <!-- 关闭/X图标 -->
      <g v-else-if="name === 'close'">
        <path d="M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 返回/左箭头图标 -->
      <g v-else-if="name === 'arrow-left'">
        <path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- 用户/头像图标 -->
      <g v-else-if="name === 'user'">
        <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 上传图标 -->
      <g v-else-if="name === 'upload'">
        <path d="M12 16V4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M7 9L12 4L17 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20 16V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 加号图标 -->
      <g v-else-if="name === 'plus'">
        <path d="M12 5V19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 更多/三点图标 -->
      <g v-else-if="name === 'more'">
        <circle cx="12" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="18" r="1.5" fill="currentColor"/>
      </g>
      
      <!-- 心形/喜欢图标（实心） -->
      <g v-else-if="name === 'heart'">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
      </g>
      
      <!-- 心形/喜欢图标（空心） -->
      <g v-else-if="name === 'heart-o'">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" stroke-width="2" fill="none"/>
      </g>
      
      <!-- 消息/评论图标 -->
      <g v-else-if="name === 'message'">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="currentColor" stroke-width="2" fill="none"/>
      </g>
      
      <!-- 播放图标 -->
      <g v-else-if="name === 'play'">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M10 8L16 12L10 16V8Z" fill="currentColor"/>
      </g>
      
      <!-- 暂停图标 -->
      <g v-else-if="name === 'pause'">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <rect x="9" y="8" width="2" height="8" fill="currentColor"/>
        <rect x="13" y="8" width="2" height="8" fill="currentColor"/>
      </g>
      
      <!-- 设置图标 -->
      <g v-else-if="name === 'settings'">
        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" stroke-width="2"/>
      </g>
      
      <!-- 编辑/文档图标 -->
      <g v-else-if="name === 'edit'">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- 声音/音乐图标 -->
      <g v-else-if="name === 'sound'">
        <path d="M9 18V5l12-6v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2"/>
        <circle cx="18" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
      </g>
      
      <!-- 团队/用户组图标 -->
      <g v-else-if="name === 'users'">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- 星星图标 -->
      <g v-else-if="name === 'star'">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </g>
      
      <!-- 右箭头图标 -->
      <g v-else-if="name === 'arrow-right'">
        <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- 信息/关于图标 -->
      <g v-else-if="name === 'info'">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
        <path d="M12 16v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        <path d="M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </g>
      
      <!-- 默认插槽 -->
      <slot v-else></slot>
    </svg>
  </view>
</template>

<script>
export default {
  name: 'SvgIcon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 32
    }
  }
}
</script>

<style scoped>
.svg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.svg-icon svg {
  width: 100%;
  height: 100%;
}
</style>
