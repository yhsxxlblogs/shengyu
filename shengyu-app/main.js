import { createSSRApp } from 'vue'
import App from './App'
import SvgIcon from './components/SvgIcon/SvgIcon.vue'

export function createApp() {
  const app = createSSRApp(App)
  
  // 全局注册SvgIcon组件
  app.component('svg-icon', SvgIcon)
  
  return {
    app
  }
}
