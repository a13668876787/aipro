// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import mdx from '@astrojs/mdx';

const normalizedBase = (process.env.ASTRO_BASE || '/').replace(/\/?$/, '/');

// https://astro.build/config
export default defineConfig({
  site: process.env.ASTRO_SITE || 'https://example.com',
  base: normalizedBase,
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [mdx()]
});
