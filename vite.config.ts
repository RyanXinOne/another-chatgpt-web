import path from 'path'
import type { PluginOption } from 'vite'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

function setupPlugins(env: ImportMetaEnv): PluginOption[] {
  return [
    vue(),
    wasm(),
    topLevelAwait(),
    env.VITE_GLOB_APP_PWA === 'true' && VitePWA({
      injectRegister: 'auto',
      manifest: {
        name: 'ChatGPT',
        short_name: 'ChatGPT',
        icons: [
          { src: 'icon-48-48.png', sizes: '48x48', type: 'image/png' },
          { src: 'icon-72-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icon-96-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icon-144-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icon-192-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ]
}

export default defineConfig((env) => {
  const viteEnv = loadEnv(env.mode, process.cwd()) as unknown as ImportMetaEnv

  return {
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    plugins: setupPlugins(viteEnv),
    server: {
      host: '0.0.0.0',
      port: 1002,
      open: false,
      proxy: {
        '/api': {
          target: viteEnv.VITE_APP_API_BASE_URL,
          changeOrigin: true, // 允许跨域
          rewrite: path => path.replace('/api/', '/'),
        },
      },
    },
    build: {
      reportCompressedSize: false,
      sourcemap: false,
      commonjsOptions: {
        ignoreTryCatch: false,
      },
    },
  }
})
