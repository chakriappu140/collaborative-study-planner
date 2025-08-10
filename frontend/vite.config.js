    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    // import tailwindcss from 'tailwindcss';
    // import autoprefixer from 'autoprefixer';
    import tailwindcss from "@tailwindcss/vite"

    export default defineConfig({
      plugins: [react(), tailwindcss()],
      // css: {
      //   postcss: {
      //     plugins: [
      //       tailwindcss,
      //       autoprefixer,
      //     ],
      //   },
      // },
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
    