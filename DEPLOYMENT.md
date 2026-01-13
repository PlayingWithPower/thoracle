# Deployment Guide

This guide covers deploying and running the Thoracle Discord bot in production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Hosting Options](#hosting-options)
- [Process Management](#process-management)
- [MongoDB Hosting](#mongodb-hosting)
- [Production Deployment](#production-deployment)
- [Continuous Deployment](#continuous-deployment)
- [Monitoring and Logging](#monitoring-and-logging)
- [Security Best Practices](#security-best-practices)

## Prerequisites

Before deploying, ensure you have:

- **Node.js v16 or higher** installed on the server
- **MongoDB database** (hosted or self-hosted)
- **Discord Bot Token** and Application ID from [Discord Developer Portal](https://discord.com/developers/applications)
- **Server** with at least:
  - 512 MB RAM
  - 1 GB free disk space
  - Linux (Ubuntu/Debian recommended) or Windows Server
  - SSH access

## Environment Configuration

### Production vs Development

Create separate `.env` files for each environment:

#### Development (`.env.development`)

```env
TOKEN=your_dev_bot_token
CLIENT_ID=your_dev_application_id
GUILD_ID=your_test_server_id
DATABASE_URI=mongodb://localhost:27017/thoracle_dev
SUPPORT_SERVER=https://discord.gg/your_support_server
```

#### Production (`.env.production` or `.env`)

```env
TOKEN=your_production_bot_token
CLIENT_ID=your_production_application_id
GUILD_ID=your_main_server_id
DATABASE_URI=mongodb+srv://user:pass@cluster.mongodb.net/thoracle
SUPPORT_SERVER=https://discord.gg/your_support_server
```

### Environment Variable Security

**Never commit `.env` files to git!** The `.gitignore` should already include:
```
.env
.env.production
.env.development
```

For production deployments:
- Use environment variables from hosting platform
- Or secure the `.env` file with proper permissions:
  ```bash
  chmod 600 .env
  ```

## Hosting Options

### Option 1: Railway (Easiest - Recommended for Beginners)

**Pros**: One-click deployment, free tier available, automatic restarts
**Cons**: Limited free tier, costs scale with usage

**Deployment Steps**:

1. **Create Railway Account**: [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Add Environment Variables**:
   - Go to your project → Variables
   - Add all variables from `.env`

4. **Add MongoDB**:
   - Click "New" → "Database" → "Add MongoDB"
   - Railway provides `DATABASE_URI` automatically
   - Or use external MongoDB Atlas

5. **Deploy**:
   - Railway automatically builds and deploys
   - Monitor logs in the deployment dashboard

6. **Register Commands**:
   ```bash
   # Run from Railway dashboard or locally
   npm run register
   ```

### Option 2: DigitalOcean Droplet (Full Control)

**Pros**: Full server control, predictable pricing, better for scale
**Cons**: Requires server management knowledge

**Deployment Steps**:

1. **Create Droplet**:
   - Choose Ubuntu 22.04 LTS
   - Minimum: Basic plan ($6/month)
   - Add SSH key

2. **Connect via SSH**:
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install Git**:
   ```bash
   sudo apt-get update
   sudo apt-get install git
   ```

5. **Clone Repository**:
   ```bash
   cd /opt
   git clone https://github.com/your-username/thoracle.git
   cd thoracle
   ```

6. **Install Dependencies**:
   ```bash
   npm install
   ```

7. **Configure Environment**:
   ```bash
   cp example.env .env
   nano .env  # Edit with your values
   ```

8. **Build**:
   ```bash
   npm run build
   ```

9. **Setup Process Manager** (see [Process Management](#process-management))

### Option 3: AWS EC2 (Enterprise Scale)

Similar to DigitalOcean but with AWS's ecosystem:
- Use t2.micro for free tier (12 months)
- Setup similar to DigitalOcean
- Consider using AWS Systems Manager for managing environment variables

### Option 4: Heroku

**Note**: Heroku removed free tier in November 2022.

**Deployment Steps**:

1. **Install Heroku CLI**:
   ```bash
   npm install -g heroku
   ```

2. **Create Heroku App**:
   ```bash
   heroku create your-bot-name
   ```

3. **Set Environment Variables**:
   ```bash
   heroku config:set TOKEN=your_token
   heroku config:set CLIENT_ID=your_client_id
   heroku config:set GUILD_ID=your_guild_id
   heroku config:set DATABASE_URI=your_mongodb_uri
   heroku config:set SUPPORT_SERVER=your_discord_invite
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

5. **Scale**:
   ```bash
   heroku ps:scale worker=1
   ```

### Option 5: Self-Hosted (Home Server/Raspberry Pi)

**Pros**: Free hosting, full control
**Cons**: Uptime depends on home internet, power, security concerns

**Requirements**:
- Static IP or Dynamic DNS
- Port forwarding (if needed)
- UPS backup power recommended

**Setup** same as DigitalOcean, but on local machine.

## Process Management

### Using PM2 (Recommended)

PM2 keeps your bot running and automatically restarts on crashes.

#### Install PM2

```bash
npm install -g pm2
```

#### Start Bot with PM2

```bash
# Navigate to project directory
cd /opt/thoracle

# Start bot
pm2 start dist/index.js --name thoracle

# Save PM2 configuration
pm2 save

# Setup startup script (runs on server reboot)
pm2 startup
# Follow the command it outputs
```

#### PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs thoracle

# Restart bot
pm2 restart thoracle

# Stop bot
pm2 stop thoracle

# Monitor resources
pm2 monit
```

#### PM2 Configuration File (Advanced)

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'thoracle',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

Start with config:
```bash
pm2 start ecosystem.config.js
```

### Using systemd (Alternative)

systemd is built into Linux systems.

#### Create Service File

```bash
sudo nano /etc/systemd/system/thoracle.service
```

Add:
```ini
[Unit]
Description=Thoracle Discord Bot
After=network.target

[Service]
Type=simple
User=your_username
WorkingDirectory=/opt/thoracle
ExecStart=/usr/bin/node /opt/thoracle/dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=thoracle
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

#### Manage Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start service
sudo systemctl start thoracle

# Enable on boot
sudo systemctl enable thoracle

# Check status
sudo systemctl status thoracle

# View logs
journalctl -u thoracle -f
```

### Using Docker (Optional)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  bot:
    build: .
    restart: unless-stopped
    environment:
      - TOKEN=${TOKEN}
      - CLIENT_ID=${CLIENT_ID}
      - GUILD_ID=${GUILD_ID}
      - DATABASE_URI=${DATABASE_URI}
      - SUPPORT_SERVER=${SUPPORT_SERVER}
```

Deploy:
```bash
docker-compose up -d
```

## MongoDB Hosting

### MongoDB Atlas (Recommended - Free Tier Available)

**Setup**:

1. **Create Account**: [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to your bot server
   - Name your cluster

3. **Create Database User**:
   - Database Access → Add New Database User
   - Set username and strong password
   - Note these for `DATABASE_URI`

4. **Whitelist IP**:
   - Network Access → Add IP Address
   - For development: Add current IP
   - For production: Add your server's IP
   - Or use `0.0.0.0/0` (allow all - less secure)

5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database password
   - Replace `<dbname>` with your database name (e.g., `thoracle`)

**Example Connection String**:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/thoracle?retryWrites=true&w=majority
```

**Atlas Benefits**:
- Automatic backups
- Monitoring dashboard
- Free tier sufficient for most servers
- Automated scaling

### Self-Hosted MongoDB

**Install on Ubuntu**:

```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

**Connection String** (local):
```
mongodb://localhost:27017/thoracle
```

**With Authentication** (recommended):

```bash
mongosh

use admin
db.createUser({
  user: "thoracle_admin",
  pwd: "strong_password",
  roles: ["readWrite", "dbAdmin"]
})
```

Connection string:
```
mongodb://thoracle_admin:strong_password@localhost:27017/thoracle
```

## Production Deployment

### Complete Production Deployment Checklist

#### 1. Server Setup

```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install build tools
sudo apt-get install -y build-essential

# Install Git
sudo apt-get install -y git

# Create bot user (optional, for security)
sudo adduser --disabled-password --gecos "" botuser
```

#### 2. Clone and Build

```bash
# Clone repository
cd /opt
sudo git clone https://github.com/your-username/thoracle.git
sudo chown -R botuser:botuser thoracle
cd thoracle

# Switch to bot user
sudo su - botuser
cd /opt/thoracle

# Install dependencies
npm ci --only=production

# Build TypeScript
npm run build
```

#### 3. Environment Configuration

```bash
# Create .env file
cp example.env .env
nano .env
```

Fill in all required values.

#### 4. Register Commands

```bash
# Global registration (takes up to 1 hour)
npm run register
```

#### 5. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start bot
pm2 start dist/index.js --name thoracle

# Save PM2 list
pm2 save

# Setup startup script
pm2 startup
# Run the command it outputs
```

#### 6. Configure Firewall (if applicable)

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# No inbound ports needed for Discord bot
# Bot connects outbound to Discord API
```

#### 7. Setup Log Rotation

Create `/etc/logrotate.d/thoracle`:

```
/opt/thoracle/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 botuser botuser
    sharedscripts
}
```

#### 8. Verify Deployment

```bash
# Check bot status
pm2 status

# Check logs
pm2 logs thoracle

# Verify bot is online in Discord
```

### Updating Production Deployment

```bash
# Navigate to project
cd /opt/thoracle

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Rebuild
npm run build

# Restart bot
pm2 restart thoracle

# Monitor for errors
pm2 logs thoracle
```

## Continuous Deployment

### GitHub Actions (Automated Deployment)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USERNAME }}
        key: ${{ secrets.SSH_PRIVATE_KEY }}
        script: |
          cd /opt/thoracle
          git pull
          npm install
          npm run build
          pm2 restart thoracle
```

**Setup GitHub Secrets**:
1. Repository → Settings → Secrets → Actions
2. Add:
   - `SERVER_HOST`: Your server IP
   - `SERVER_USERNAME`: SSH username
   - `SSH_PRIVATE_KEY`: Your SSH private key

### Manual Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "Deploying Thoracle..."

# Pull latest changes
git pull

# Install dependencies
npm install

# Build
npm run build

# Restart bot
pm2 restart thoracle

echo "Deployment complete!"
pm2 logs thoracle --lines 20
```

Make executable:
```bash
chmod +x deploy.sh
```

Deploy:
```bash
./deploy.sh
```

## Monitoring and Logging

### Log Files

#### PM2 Logs

```bash
# Real-time logs
pm2 logs thoracle

# Last 100 lines
pm2 logs thoracle --lines 100

# Only errors
pm2 logs thoracle --err

# Log files location
~/.pm2/logs/
```

#### systemd Logs

```bash
# Real-time logs
journalctl -u thoracle -f

# Last 100 lines
journalctl -u thoracle -n 100

# Errors only
journalctl -u thoracle -p err
```

### Custom Application Logging

You can enhance logging by adding Winston or similar:

```bash
npm install winston
```

Example logger setup (`src/utils/logger.ts`):

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Health Monitoring

**UptimeRobot** (External Monitoring):
1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add monitor → Discord Bot Check
3. Configure alerts via email/SMS

**PM2 Plus** (Advanced):
```bash
pm2 plus
# Follow setup instructions for web dashboard
```

## Security Best Practices

### Server Security

1. **Keep System Updated**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

2. **Configure Firewall**:
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp  # SSH only
   ```

3. **Disable Root Login**:
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PermitRootLogin no
   sudo systemctl restart sshd
   ```

4. **Use SSH Keys** (disable password authentication):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Set: PasswordAuthentication no
   ```

5. **Install Fail2Ban**:
   ```bash
   sudo apt-get install fail2ban
   sudo systemctl enable fail2ban
   ```

### Application Security

1. **Environment Variables**: Never commit `.env` to git

2. **Token Security**: 
   - Never share bot token
   - Regenerate if compromised (Discord Developer Portal)

3. **Database Security**:
   - Use strong passwords
   - Whitelist specific IPs only
   - Enable SSL/TLS for connections

4. **File Permissions**:
   ```bash
   chmod 600 .env
   chmod -R 755 /opt/thoracle
   ```

5. **Run as Non-Root User**:
   - Create dedicated user for bot
   - Never run as root

### MongoDB Security

1. **Enable Authentication**: Always use username/password
2. **Use SSL/TLS**: For MongoDB Atlas, SSL is automatic
3. **IP Whitelist**: Only allow your server's IP
4. **Strong Passwords**: Use generated passwords, not dictionary words
5. **Regular Backups**: Automated backups enabled

### Discord Security

1. **Bot Permissions**: Only grant necessary permissions
2. **Admin Commands**: Ensure permission checks in code
3. **Rate Limiting**: Discord.js handles this automatically
4. **Intents**: Only request necessary intents (see `src/index.ts`)

## Troubleshooting Production Issues

### Bot Won't Start

```bash
# Check logs
pm2 logs thoracle --err

# Common issues:
# - Missing environment variables
# - Database connection failure
# - Port already in use
# - Permission errors
```

### High Memory Usage

```bash
# Monitor memory
pm2 monit

# Restart bot
pm2 restart thoracle

# Set memory limit
pm2 start dist/index.js --name thoracle --max-memory-restart 500M
```

### Database Connection Timeouts

- Check MongoDB Atlas IP whitelist
- Verify connection string
- Check network connectivity:
  ```bash
  curl -I https://cloud.mongodb.com
  ```

## Cost Estimates

### Minimum Cost Setup (Hobby)
- **Railway**: Free tier (limited hours)
- **MongoDB Atlas**: Free tier (M0)
- **Total**: $0/month

### Recommended Setup (Small Community)
- **DigitalOcean Droplet**: $6/month
- **MongoDB Atlas**: Free tier
- **Total**: $6/month

### Medium Community
- **DigitalOcean Droplet**: $12/month (2GB RAM)
- **MongoDB Atlas**: $9/month (M2 shared cluster)
- **Total**: $21/month

### Large Community
- **DigitalOcean Droplet**: $24/month (4GB RAM)
- **MongoDB Atlas**: $57/month (M10 dedicated)
- **Backups & Monitoring**: $10/month
- **Total**: ~$91/month

## Migration Guide

### Moving to New Server

1. **Backup database** (see [MAINTENANCE.md](MAINTENANCE.md))
2. **Setup new server** (follow deployment steps)
3. **Copy `.env` file** to new server
4. **Update DNS** if applicable
5. **Test bot** on new server
6. **Switch traffic** by stopping old server

### Changing MongoDB Instance

1. **Backup current database**:
   ```bash
   mongodump --uri="old_connection_string" --out=/backup
   ```

2. **Restore to new instance**:
   ```bash
   mongorestore --uri="new_connection_string" /backup
   ```

3. **Update `DATABASE_URI`** in `.env`

4. **Restart bot**:
   ```bash
   pm2 restart thoracle
   ```

## Additional Resources

- **Discord.js Guide**: https://discordjs.guide/
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices

