// PM2 Ecosystem Configuration for 360° Backend
// Production-ready process manager setup

module.exports = {
  apps: [
    {
      name: '360auto-backend',
      script: 'dist/server.js',
      instances: process.env.NODE_ENV === 'production' ? 2 : 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      // Auto-restart on crash
      autorestart: true,
      // Watch for file changes (development only)
      watch: process.env.NODE_ENV === 'development' ? ['dist'] : false,
      // Max memory before restart (1GB)
      max_memory_restart: '1G',
      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Advanced options
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
    },
  ],
};

