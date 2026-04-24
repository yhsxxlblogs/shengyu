const BASE_URL = 'http://shengyu.supersyh.xyz'
const API_BASE_URL = `${BASE_URL}/api`

// 默认头像路径
export const DEFAULT_AVATAR = `${BASE_URL}/uploads/avatars/default-avatar.svg`

export const getImageUrl = (relativePath) => {
  if (!relativePath) return DEFAULT_AVATAR
  return relativePath.startsWith('http') ? relativePath : `${BASE_URL}${relativePath}`
}

// 获取头像URL（如果用户没有头像则返回默认头像）
export const getAvatarUrl = (avatar) => {
  if (!avatar) return DEFAULT_AVATAR
  return avatar.startsWith('http') ? avatar : `${BASE_URL}${avatar}`
}

/**
 * 格式化日期时间 - 安卓兼容版本
 * 避免使用 toLocaleString/toLocaleTimeString，在某些安卓设备上可能显示英文
 * @param {string|Date} time - 时间字符串或Date对象
 * @param {string} format - 格式类型：'time'(仅时间), 'date'(仅日期), 'datetime'(日期+时间), 'relative'(相对时间)
 * @returns {string} 格式化后的时间字符串
 */
export const formatDateTime = (time, format = 'datetime') => {
  if (!time) return ''
  
  const date = new Date(time)
  const now = new Date()
  
  // 检查是否是有效日期
  if (isNaN(date.getTime())) return ''
  
  // 获取时间各部分
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const seconds = date.getSeconds().toString().padStart(2, '0')
  
  // 检查是否是今天
  const isToday = year === now.getFullYear() &&
                  date.getMonth() === now.getMonth() &&
                  date.getDate() === now.getDate()
  
  // 检查是否是昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = year === yesterday.getFullYear() &&
                      date.getMonth() === yesterday.getMonth() &&
                      date.getDate() === yesterday.getDate()
  
  switch (format) {
    case 'time':
      return `${hours}:${minutes}`
    
    case 'date':
      return `${year}-${month}-${day}`
    
    case 'datetime':
      if (isToday) {
        return `${hours}:${minutes}`
      } else if (isYesterday) {
        return `昨天 ${hours}:${minutes}`
      } else if (year === now.getFullYear()) {
        return `${month}月${day}日 ${hours}:${minutes}`
      } else {
        return `${year}年${month}月${day}日 ${hours}:${minutes}`
      }
    
    case 'relative':
      const diff = now - date
      const minute = 60 * 1000
      const hour = 60 * minute
      const day_ms = 24 * hour
      const week = 7 * day_ms
      
      if (diff < minute) return '刚刚'
      if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
      if (diff < day_ms) return `${Math.floor(diff / hour)}小时前`
      if (diff < week) return `${Math.floor(diff / day_ms)}天前`
      if (year === now.getFullYear()) {
        return `${month}月${day}日 ${hours}:${minutes}`
      }
      return `${year}年${month}月${day}日`
    
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    
    default:
      return `${year}-${month}-${day} ${hours}:${minutes}`
  }
}

export default {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    user: `${API_BASE_URL}/auth/user`,
    userStats: `${API_BASE_URL}/auth/user/stats`,
    avatar: `${API_BASE_URL}/auth/avatar`,
    search: (keyword) => `${API_BASE_URL}/auth/search?q=${encodeURIComponent(keyword)}`
  },
  sound: {
    base: `${API_BASE_URL}/sound`,
    upload: `${API_BASE_URL}/sound/upload`,
    popular: `${API_BASE_URL}/sound/popular`,
    byAnimal: (type) => `${API_BASE_URL}/sound/by-animal/${type}`,
    search: (keyword) => `${API_BASE_URL}/sound/search?q=${encodeURIComponent(keyword)}`,
    detail: (id) => `${API_BASE_URL}/sound/detail/${id}`,
    my: `${API_BASE_URL}/sound/my`
  },
  post: {
    create: `${API_BASE_URL}/post/create`,
    list: `${API_BASE_URL}/post/list`,
    my: `${API_BASE_URL}/post/my`,
    likes: `${API_BASE_URL}/post/likes`,
    like: (postId) => `${API_BASE_URL}/post/like/${postId}`,
    comment: (postId) => `${API_BASE_URL}/post/comment/${postId}`,
    comments: (postId) => `${API_BASE_URL}/post/comments/${postId}`,
    detail: (postId) => `${API_BASE_URL}/post/detail/${postId}`
  }
}