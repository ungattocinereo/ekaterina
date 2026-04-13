import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel/serverless';

export default defineConfig({
  site: 'https://katerina.amalfi.day',
  trailingSlash: 'never',
  output: 'static',
  adapter: vercel(),
  build: {
    inlineStylesheets: 'auto',
  },
  integrations: [sitemap()],
});
