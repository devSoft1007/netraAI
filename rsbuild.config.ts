import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser'
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { pluginBabel } from '@rsbuild/plugin-babel';

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
      'process.env.GA_MEASUREMENT_ID': JSON.stringify(process.env.GA_MEASUREMENT_ID),
      "process.env.API_URL": JSON.stringify(process.env.API_URL),
      "process.env.REPLIT_API_URL": JSON.stringify(process.env.REPLIT_API_URL),
      "process.env.RAZORPAY_KEY_ID": JSON.stringify(process.env.RAZORPAY_KEY_ID),
      "process.env.GOOGLE_MAPS_API_KEY": JSON.stringify(process.env.GOOGLE_MAPS_API_KEY),
      "process.env.GOOGLE_CLIENT_ID": JSON.stringify(process.env.GOOGLE_CLIENT_ID),
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
  },
});