import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser'
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { pluginBabel } from '@rsbuild/plugin-babel';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment file depending on NODE_ENV. Create a `.env` for development
// and `.env.production` for production. Values are then available on
// `process.env` and in the `define` map below.
// Only load from files if environment variables are not already set (e.g., from GitHub Actions secrets)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  const envFile = process.env.NODE_ENV === 'production'
    ? resolve(process.cwd(), '.env')
    : resolve(process.cwd(), '.env.development');
  dotenv.config({ path: envFile });
}

export default defineConfig({
  plugins: [pluginReact(), pluginHtmlMinifierTerser(), pluginImageCompress(),
    pluginBabel({
      include: /\.(?:jsx|tsx)$/,
      babelLoaderOptions(opts) {
        // 👇 Insert React Compiler plugin as the very first Babel plugin
        opts.plugins?.unshift('babel-plugin-react-compiler');
      },
    }),

  ],

  html: {
    template: 'public/index.html',
  },

  tools: {
    // Add PostCSS configuration for Tailwind
  },
  source: {
    entry: {
      index: './src/index.tsx',
    },
    define: {
  'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL ?? ''),
  "process.env.SUPABASE_ANON_KEY": JSON.stringify(process.env.SUPABASE_ANON_KEY ?? ''),
  "process.env.NETRA_AI_ENDPOINT": JSON.stringify(process.env.NETRA_AI_ENDPOINT ?? ''),
    },
  },

  dev: {
    lazyCompilation: true,
  },
  server: {
    port: 2000,
  },
  
  output: {
    sourceMap: {
      js: false,
    },
    polyfill: 'usage',
    assetPrefix: './',
  },
});