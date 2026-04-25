<template>
  <view class="set-password-page">
    <view class="header">
      <view class="back-btn" @click="goBack">
        <svg-icon name="arrow-left" :size="32" color="#666666" />
      </view>
      <text class="header-title">设置密码</text>
      <view class="placeholder"></view>
    </view>
    
    <view class="content">
      <view class="info-section">
        <text class="info-title">{{ hasPassword ? '修改密码' : '设置登录密码' }}</text>
        <text class="info-desc">
          {{ hasPassword 
            ? '为了您的账号安全，建议定期修改密码' 
            : '您当前使用微信登录，设置密码后可以使用用户名和密码登录' 
          }}
        </text>
      </view>
      
      <view class="form-section">
        <!-- 当前密码（仅修改密码时显示） -->
        <view v-if="hasPassword" class="form-item">
          <text class="form-label">当前密码</text>
          <view class="input-wrapper">
            <input 
              :type="showCurrentPassword ? 'text' : 'password'" 
              v-model="form.currentPassword" 
              placeholder="请输入当前密码" 
              class="input"
              placeholder-class="input-placeholder"
            />
            <view class="toggle-password" @click="showCurrentPassword = !showCurrentPassword">
              <svg-icon :name="showCurrentPassword ? 'eye' : 'eye-off'" :size="32" color="#BBBBBB" />
            </view>
          </view>
        </view>
        
        <!-- 新密码 -->
        <view class="form-item">
          <text class="form-label">{{ hasPassword ? '新密码' : '设置密码' }}</text>
          <view class="input-wrapper">
            <input 
              :type="showNewPassword ? 'text' : 'password'" 
              v-model="form.newPassword" 
              placeholder="请输入6-20位密码" 
              class="input"
              placeholder-class="input-placeholder"
              maxlength="20"
            />
            <view class="toggle-password" @click="showNewPassword = !showNewPassword">
              <svg-icon :name="showNewPassword ? 'eye' : 'eye-off'" :size="32" color="#BBBBBB" />
            </view>
          </view>
        </view>
        
        <!-- 确认密码 -->
        <view class="form-item">
          <text class="form-label">确认密码</text>
          <view class="input-wrapper">
            <input 
              :type="showConfirmPassword ? 'text' : 'password'" 
              v-model="form.confirmPassword" 
              placeholder="请再次输入密码" 
              class="input"
              placeholder-class="input-placeholder"
              maxlength="20"
            />
            <view class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
              <svg-icon :name="showConfirmPassword ? 'eye' : 'eye-off'" :size="32" color="#BBBBBB" />
            </view>
          </view>
        </view>
      </view>
      
      <view class="tips-section">
        <text class="tips-title">密码要求：</text>
        <text class="tips-item">• 长度为6-20个字符</text>
        <text class="tips-item">• 建议包含字母和数字</text>
        <text class="tips-item">• 不要使用过于简单的密码</text>
      </view>
      
      <button 
        class="submit-btn" 
        @click="submit" 
        :disabled="loading || !isFormValid"
        :class="{ 'btn-disabled': !isFormValid, 'btn-loading': loading }"
      >
        <text v-if="!loading">{{ hasPassword ? '修改密码' : '设置密码' }}</text>
        <view v-else class="loading-spinner">
          <view class="spinner"></view>
          <text>处理中...</text>
        </view>
      </button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      hasPassword: false,
      loading: false,
      showCurrentPassword: false,
      showNewPassword: false,
      showConfirmPassword: false
    };
  },
  computed: {
    isFormValid() {
      if (this.hasPassword && !this.form.currentPassword) return false;
      if (!this.form.newPassword || this.form.newPassword.length < 6) return false;
      if (this.form.newPassword !== this.form.confirmPassword) return false;
      return true;
    }
  },
  onLoad() {
    this.checkHasPassword();
  },
  methods: {
    goBack() {
      uni.navigateBack();
    },
    async checkHasPassword() {
      try {
        const token = uni.getStorageSync('token');
        const res = await uni.request({
          url: 'http://shengyu.supersyh.xyz/api/auth/user',
          method: 'GET',
          header: { 'Authorization': `Bearer ${token}` }
        });
        if (res.statusCode === 200 && res.data.user) {
          // 如果用户有密码，则认为是修改密码
          this.hasPassword = true;
        }
      } catch (e) {
        console.error('检查密码状态失败:', e);
      }
    },
    async submit() {
      if (!this.isFormValid) {
        if (this.form.newPassword.length < 6) {
          uni.showToast({ title: '密码长度至少6位', icon: 'none' });
        } else if (this.form.newPassword !== this.form.confirmPassword) {
          uni.showToast({ title: '两次输入的密码不一致', icon: 'none' });
        }
        return;
      }
      
      this.loading = true;
      try {
        const token = uni.getStorageSync('token');
        const url = this.hasPassword 
          ? 'http://shengyu.supersyh.xyz/api/auth/change-password'
          : 'http://shengyu.supersyh.xyz/api/auth/set-password';
        
        const data = this.hasPassword
          ? {
              currentPassword: this.form.currentPassword,
              newPassword: this.form.newPassword
            }
          : {
              password: this.form.newPassword
            };
        
        const res = await uni.request({
          url: url,
          method: 'POST',
          header: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: data
        });
        
        if (res.statusCode === 200) {
          uni.showToast({
            title: this.hasPassword ? '密码修改成功' : '密码设置成功',
            icon: 'success',
            duration: 2000
          });
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          uni.showToast({ 
            title: res.data.error || '操作失败', 
            icon: 'none' 
          });
        }
      } catch (error) {
        uni.showToast({ title: '网络错误', icon: 'none' });
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.set-password-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FFF0F5 0%, #FFF8FA 50%, #FFFFFF 100%);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 30rpx 20rpx;
  background: #FFFFFF;
}

.back-btn {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.placeholder {
  width: 60rpx;
}

.content {
  padding: 40rpx 30rpx;
}

.info-section {
  margin-bottom: 40rpx;
}

.info-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.info-desc {
  font-size: 28rpx;
  color: #888;
  line-height: 1.6;
}

.form-section {
  background: #FFFFFF;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
  font-weight: 500;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 0 20rpx;
  height: 88rpx;
}

.input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
  color: #333;
}

.input-placeholder {
  color: #BBB;
  font-size: 30rpx;
}

.toggle-password {
  padding: 20rpx;
  margin-right: -20rpx;
}

.tips-section {
  background: #FFF9F0;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 40rpx;
}

.tips-title {
  font-size: 28rpx;
  color: #FF9500;
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.tips-item {
  font-size: 26rpx;
  color: #999;
  line-height: 1.8;
  display: block;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #FF9A9E 0%, #FF6B9D 100%);
  color: #fff;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 24rpx rgba(255, 107, 157, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  transition: all 0.3s ease;
}

.submit-btn:active {
  transform: scale(0.98);
  box-shadow: 0 4rpx 16rpx rgba(255, 107, 157, 0.25);
}

.btn-disabled {
  opacity: 0.5;
  box-shadow: none;
}

.btn-loading {
  opacity: 0.8;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.spinner {
  width: 32rpx;
  height: 32rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
