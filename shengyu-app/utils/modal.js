/**
 * 现代化自定义弹窗管理器
 * 提供美观、灵动的弹窗体验
 */

// 全局弹窗实例
let modalInstance = null

const modal = {
  /**
   * 初始化弹窗实例（在 App.vue 中调用）
   * @param {Object} instance CustomModal 组件实例
   */
  init(instance) {
    modalInstance = instance
  },

  /**
   * 显示弹窗
   * @param {Object} options 配置选项
   * @returns {Promise}
   */
  show(options = {}) {
    if (!modalInstance) {
      console.warn('CustomModal 未初始化')
      // 降级使用原生弹窗
      return uni.showModal(options)
    }
    return modalInstance.show(options)
  },

  /**
   * 成功提示弹窗
   * @param {string} content 内容
   * @param {string} title 标题
   */
  success(content, title = '成功') {
    return this.show({
      title,
      content,
      icon: '✓',
      iconType: 'success',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 错误提示弹窗
   * @param {string} content 内容
   * @param {string} title 标题
   */
  error(content, title = '出错了') {
    return this.show({
      title,
      content,
      icon: '✕',
      iconType: 'error',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 警告提示弹窗
   * @param {string} content 内容
   * @param {string} title 标题
   */
  warning(content, title = '注意') {
    return this.show({
      title,
      content,
      icon: '!',
      iconType: 'warning',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 确认弹窗
   * @param {string} content 内容
   * @param {string} title 标题
   * @param {Object} options 其他配置
   */
  confirm(content, title = '确认', options = {}) {
    return this.show({
      title,
      content,
      icon: '?',
      iconType: 'info',
      showCancel: true,
      cancelText: options.cancelText || '取消',
      confirmText: options.confirmText || '确定',
      ...options
    })
  },

  /**
   * 扫码结果弹窗
   * @param {string} result 扫码结果
   */
  scanResult(result) {
    const isUrl = result.startsWith('http://') || result.startsWith('https://')
    
    if (isUrl) {
      return this.show({
        title: '扫码结果',
        content: result,
        icon: '🔗',
        iconType: 'info',
        showCancel: true,
        cancelText: '复制',
        confirmText: '打开链接'
      })
    } else {
      return this.show({
        title: '扫码结果',
        content: result,
        icon: '📋',
        iconType: 'info',
        showCancel: false,
        confirmText: '复制'
      })
    }
  }
}

export default modal
