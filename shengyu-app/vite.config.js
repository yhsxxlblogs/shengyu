import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [
    uni()
  ],
  build: {
    // 禁用代码分割，使用单文件输出
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  }
})
