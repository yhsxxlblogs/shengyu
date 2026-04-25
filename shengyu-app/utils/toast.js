/**
 * 优化版消息提示工具
 * 统一使用美观的提示样式
 */

const toast = {
  /**
   * 显示普通提示
   * @param {string} title 提示文字
   * @param {number} duration 显示时长，默认2000ms
   */
  show(title, duration = 2000) {
    uni.showToast({
      title,
      icon: 'none',
      duration,
      position: 'center'
    })
  },

  /**
   * 成功提示 - 使用原生 success 图标
   * @param {string} title 提示文字
   * @param {number} duration 显示时长
   */
  success(title = '操作成功', duration = 1500) {
    uni.showToast({
      title,
      icon: 'success',
      duration,
      position: 'center'
    })
  },

  /**
   * 错误提示
   * @param {string} title 提示文字
   * @param {number} duration 显示时长
   */
  error(title = '操作失败', duration = 2000) {
    uni.showToast({
      title,
      icon: 'none',
      duration,
      position: 'center'
    })
  },

  /**
   * 刷新成功提示
   * @param {string} title 提示文字
   * @param {number} duration 显示时长
   */
  refreshSuccess(title = '刷新成功', duration = 1000) {
    uni.showToast({
      title,
      icon: 'success',
      duration,
      position: 'center'
    })
  },

  /**
   * 加载中提示
   * @param {string} title 提示文字
   * @param {boolean} mask 是否显示遮罩
   */
  loading(title = '加载中...', mask = true) {
    uni.showLoading({
      title,
      mask
    })
  },

  /**
   * 隐藏加载提示
   */
  hideLoading() {
    uni.hideLoading()
  },

  /**
   * 显示模态对话框
   * @param {Object} options 配置选项
   */
  modal(options = {}) {
    const defaultOptions = {
      title: '提示',
      content: '',
      showCancel: true,
      cancelText: '取消',
      confirmText: '确定',
      confirmColor: '#FFB6C1'
    }
    return uni.showModal({ ...defaultOptions, ...options })
  }
}

export default toast
