import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss'; // Correct import
import autoprefixer from 'autoprefixer'; // Correct import

export default defineConfig({
  plugins: [react()],
  // Explicitly configure PostCSS plugins here
  css: {
    postcss: {
      plugins: [
        tailwindcss, // Use the plugin directly
        autoprefixer, // And autoprefixer
      ],
    },
  },
  root: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  }
});
