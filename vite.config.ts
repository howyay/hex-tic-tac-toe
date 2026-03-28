import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/hex-tic-tac-toe/',
  plugins: [svelte()],
  server: {
    allowedHosts: ['tttttt.gowpen.org'],
  },
})
