<script>
	export default {
		onLaunch: function() {
				this.requestPermissions()
				// 延迟检查登录状态，确保页面已加载
				setTimeout(() => {
					this.checkLoginStatus()
				}, 100)
			},
		onShow: function() {
		},
		onHide: function() {
		},
		methods: {
			async checkLoginStatus() {
				const isLoggedIn = uni.getStorageSync('isLoggedIn')
				const token = uni.getStorageSync('token')
				const user = uni.getStorageSync('user')
				const guest = uni.getStorageSync('guest')
				
				// 如果已登录且有token，验证token有效性
				if (isLoggedIn && token && user) {
					const isValid = await this.validateToken(token)
					if (!isValid) {
						// Token无效，清除状态并跳转到登录页
						this.clearLoginState()
						uni.reLaunch({ url: '/pages/login/login' })
					}
					// Token有效，保持在当前页面
				} else if (!guest) {
					// 未登录且不是游客，跳转到登录页
					uni.reLaunch({ url: '/pages/login/login' })
				}
				// 如果是游客模式，不做任何处理，留在当前页面
			},
			
			async validateToken(token) {
				try {
					const res = await uni.request({
						url: 'http://shengyu.supersyh.xyz/api/auth/validate',
						method: 'GET',
						header: {
							'Authorization': `Bearer ${token}`
						}
					})
					
					return res.data && res.data.valid === true
				} catch (error) {
					console.error('Token验证失败:', error)
					return false
				}
			},
			
			clearLoginState() {
				uni.removeStorageSync('token')
				uni.removeStorageSync('user')
				uni.removeStorageSync('isLoggedIn')
				uni.setStorageSync('guest', true)
			},
			
			requestPermissions() {
				// #ifdef APP-PLUS
				this.requestRecordPermission()
				// #endif
			},
			
			requestRecordPermission() {
				// #ifdef APP-PLUS
				plus.android.requestPermissions(
					['android.permission.RECORD_AUDIO'],
					(result) => {
						if (result.deniedAlways.length > 0) {
							uni.showModal({
								title: '需要录音权限',
								content: '声愈需要录音权限来录制声音，请在设置中开启',
								confirmText: '去设置',
								success: (res) => {
									if (res.confirm) {
										uni.openAppAuthorizeSetting()
									}
								}
							})
						}
					},
					(error) => {
					}
				)
				// #endif
			}
		}
	}
</script>

<style>
/* 引入全局主题样式 - 包含隐藏滚动条 */
@import '/static/styles/theme.css';
</style>
