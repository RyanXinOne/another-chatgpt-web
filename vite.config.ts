import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig((env) => {
  const viteEnv = loadEnv(env.mode, process.cwd()) as ImportMetaEnv
  return {
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    plugins: [
      vue(),
      VitePWA({
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
    ],
    server: {
      host: '0.0.0.0',
      port: 1002,
      open: false,
      proxy: {
        [viteEnv.VITE_SERVICE_API_URL]: {
          target: viteEnv.VITE_PROXY_TARGET,
          changeOrigin: true,
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
