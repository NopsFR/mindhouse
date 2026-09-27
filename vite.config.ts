import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { devToolsPlugin } from './vite-plugins/devTools.ts'

// devToolsPlugin uses `apply: 'serve'` — it is entirely absent from `vite build`,
// so the deployed static site never has any of these endpoints. See vite-plugins/devTools.ts.
export default defineConfig({
  plugins: [react(), tailwindcss(), devToolsPlugin()],
})
