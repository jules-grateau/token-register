module.exports = {
  apps: [{
    name: 'token-register-api',
    script: 'dist/server.js', 
    cwd: './api/',
    //Set node environment to production
    env_production: {
      NODE_ENV: 'production',
    } 
  }]
};