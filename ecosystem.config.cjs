// PM2 config for katerina.amalfi.day on the Sweden VPS.
// Runs the Astro Node standalone server.
// Secrets (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) come from .env — never commit.
module.exports = {
  apps: [
    {
      name: 'katerina',
      cwd: '/home/greg/katerina',
      script: 'dist/server/entry.mjs',
      node_args: [],
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '30014',
      },
      env_file: '/home/greg/katerina/.env',
      max_memory_restart: '256M',
      autorestart: true,
      watch: false,
    },
  ],
};
