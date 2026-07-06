// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://example.com',
  base: process.env.ASTRO_BASE || '/',
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx()]
});
