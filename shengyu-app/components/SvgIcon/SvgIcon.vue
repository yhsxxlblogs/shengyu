<template>
  <image 
    class="svg-icon" 
    :src="svgUrl" 
    mode="aspectFit"
    :style="iconStyle"
  />
</template>

<script>
// 图标名称到SVG文件的映射
const iconMap = {
  'user': '/static/icons/svg/user.svg',
  'lock': '/static/icons/svg/lock.svg',
  'email': '/static/icons/svg/email.svg',
  'eye': '/static/icons/svg/eye.svg',
  'eye-off': '/static/icons/svg/eye-off.svg',
  'search': '/static/icons/svg/search.svg',
  'scan': '/static/icons/svg/scan.svg',
  'heart': '/static/icons/svg/heart.svg',
  'heart-o': '/static/icons/svg/heart-o.svg',
  'message': '/static/icons/svg/message.svg',
  'arrow-left': '/static/icons/svg/arrow-left.svg',
  'arrow-right': '/static/icons/svg/arrow-right.svg',
  'close': '/static/icons/svg/close.svg',
  'plus': '/static/icons/svg/plus.svg',
  'more': '/static/icons/svg/more.svg',
  'camera': '/static/icons/svg/camera.svg',
  'microphone': '/static/icons/svg/microphone.svg',
  'play': '/static/icons/svg/play.svg',
  'pause': '/static/icons/svg/pause.svg',
  'settings': '/static/icons/svg/settings.svg',
  'flashlight': '/static/icons/svg/flashlight.svg',
  'image': '/static/icons/svg/image.svg',
  'wechat': '/static/icons/svg/wechat.svg',
  'file': '/static/icons/svg/file.svg',
  'music': '/static/icons/svg/music.svg',
  'info': '/static/icons/svg/info.svg',
  'edit': '/static/icons/svg/edit.svg',
  'sound': '/static/icons/svg/sound.svg',
  'users': '/static/icons/svg/users.svg',
  'star': '/static/icons/svg/star.svg',
  'folder': '/static/icons/svg/folder.svg',
}

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
    },
    color: {
      type: String,
      default: '#333333'
    }
  },
  computed: {
    svgUrl() {
      return iconMap[this.name] || ''
    },
    iconStyle() {
      return {
        width: this.size + 'rpx',
        height: this.size + 'rpx',
        filter: this.getColorFilter(this.color)
      }
    }
  },
  methods: {
    // 将 hex 颜色转换为 CSS filter
    getColorFilter(hex) {
      // 移除 # 号
      hex = hex.replace('#', '')
      
      // 处理简写形式
      if (hex.length === 3) {
        hex = hex.split('').map(c => c + c).join('')
      }
      
      // 解析 RGB
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      
      // 使用 brightness 和 sepia 来近似颜色
      // 这是一个简化的实现，对于常见颜色效果较好
      const brightness = (r + g + b) / (3 * 255)
      
      // 对于白色 (#FFFFFF)，不需要滤镜
      if (r === 255 && g === 255 && b === 255) {
        return 'brightness(0) invert(1)'
      }
      
      // 对于黑色 (#000000)
      if (r === 0 && g === 0 && b === 0) {
        return 'brightness(0)'
      }
      
      // 对于粉色系 (#FF9A9E)
      if (r > 200 && g > 100 && b > 100 && r > g && r > b) {
        return 'brightness(0) sepia(1) saturate(5) hue-rotate(300deg)'
      }
      
      // 对于灰色 (#999999)
      if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20) {
        return `brightness(${Math.round(brightness * 100)}%)`
      }
      
      // 默认返回亮度调整
      return `brightness(${Math.round(brightness * 100)}%)`
    }
  }
}
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  vertical-align: middle;
}
</style>
