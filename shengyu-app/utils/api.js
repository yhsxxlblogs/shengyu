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

export default {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    register: `${API_BASE_URL}/auth/register`,
    user: `${API_BASE_URL}/auth/user`,
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