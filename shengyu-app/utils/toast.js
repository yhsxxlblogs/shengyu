/**
 * 简洁的原生提示工具
 * 统一使用纯文字提示，不带图标
 */

const toast = {
  /**
   * 显示提示（纯文字，无图标）
   * @param {string} title 提示文字
   * @param {number} duration 显示时长，默认2000ms
   */
  show(title, duration = 2000) {
    uni.showToast({
      title,
      icon: 'none',
      duration
    })
  },

  /**
   * 成功提示
   * @param {string} title 提示文字
   * @param {number} duration 显示时长
   */
  success(title = '操作成功', duration = 2000) {
    uni.showToast({
      title,
      icon: 'none',
      duration
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
      duration
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
  }
}

export default toast
