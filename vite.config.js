import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'

// 从 GITHUB_REPOSITORY 解析用户名和仓库名 (格式: owner/repo)
const [repoOwner, repoName] = (process.env.GITHUB_REPOSITORY || '/').split('/')

export default defineConfig({
  plugins: [
    vue(),
    Unocss(),
  ],
  define: {
    'import.meta.env.VITE_GITHUB_USERNAME': JSON.stringify(repoOwner || ''),
    'import.meta.env.VITE_GITHUB_REPO': JSON.stringify(repoName || ''),
  }
})
