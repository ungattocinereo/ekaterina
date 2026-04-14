// PM2 config for katerina.amalfi.day on the Sweden VPS.
// Runs the Astro Node standalone server.
// Secrets (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID) come from .env — never commit.
module.exports = {
  apps: [
    {
      name: 'katerina',
      cwd: '/home/greg/katerina',
      script: 'dist/server/entry.mjs',
      // Node 20.6+ natively loads a .env file; keeps secrets out of PM2 dump.
      node_args: '--env-file=/home/greg/katerina/.env',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '30014',
      },
      max_memory_restart: '256M',
      autorestart: true,
      watch: false,
    },
  ],
};
