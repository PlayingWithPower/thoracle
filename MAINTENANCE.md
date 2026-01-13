# Maintenance Guide

This guide covers routine maintenance, troubleshooting, and operational best practices for the Thoracle Discord bot.

## Table of Contents

- [Routine Maintenance Tasks](#routine-maintenance-tasks)
- [Database Management](#database-management)
- [Dependency Updates](#dependency-updates)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Season Management](#season-management)
- [Data Integrity](#data-integrity)

## Routine Maintenance Tasks

### Daily Tasks

- **Monitor Bot Status**: Verify the bot is online and responding in Discord
- **Check Error Logs**: Review logs for any errors or warnings
  ```bash
  # If using PM2
  pm2 logs thoracle --lines 100
  
  # If using systemd
  journalctl -u thoracle -n 100 --no-pager
  ```

### Weekly Tasks

- **Review Match Disputes**: Check for any pending dispute threads that need resolution
  - Use `/match disputed` command to see disputed matches
  - Work with players to resolve disputes
  - Use `/match accept` or `/match delete` to finalize

- **Database Backup**: Ensure automated backups are running (see [Database Management](#database-management))

- **Check Disk Space**: Monitor server disk usage to prevent service interruption
  ```bash
  df -h
  ```

### Monthly Tasks

- **Review Dependency Updates**: Check for security patches and updates (see [Dependency Updates](#dependency-updates))
- **Database Performance**: Monitor MongoDB performance and storage usage
- **Review Server Metrics**: CPU, memory, and network usage patterns

## Database Management

### MongoDB Connection

The bot connects to MongoDB using the `DATABASE_URI` environment variable. This can be:
- **MongoDB Atlas**: `mongodb+srv://username:password@cluster.mongodb.net/database`
- **Self-hosted**: `mongodb://host:port/database`

### Backup Procedures

#### MongoDB Atlas (Recommended for Beginners)

MongoDB Atlas provides automated backups:
1. Log into [MongoDB Atlas](https://cloud.mongodb.com)
2. Go to your cluster → Backup tab
3. Configure continuous cloud backup
4. Set retention policy (recommended: 7 days)

#### Manual Backup (Self-Hosted)

Create manual backups using `mongodump`:

```bash
# Backup entire database
mongodump --uri="mongodb://host:port/database" --out=/path/to/backup

# Backup with authentication
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/database" --out=/path/to/backup
```

**Backup Schedule Recommendation**: Daily at 3 AM server time

```bash
# Add to crontab
0 3 * * * /usr/bin/mongodump --uri="$DATABASE_URI" --out=/backups/thoracle-$(date +\%Y\%m\%d)
```

### Restore Procedures

To restore from backup:

```bash
# Restore entire database
mongorestore --uri="mongodb://host:port" /path/to/backup

# Restore specific collection
mongorestore --uri="mongodb://host:port" --nsInclude="database.matches" /path/to/backup
```

### Changing Database Connection

1. Update `.env` file with new `DATABASE_URI`
2. Restart the bot
3. Verify connection in logs

## Dependency Updates

### Checking for Updates

```bash
# Check outdated packages
npm outdated

# Check for security vulnerabilities
npm audit
```

### Updating Dependencies

**Safe Update Process**:

1. **Create a backup** of your database first
2. **Test in development environment** if possible

```bash
# Update to latest compatible versions (respects package.json ranges)
npm update

# Check for security fixes
npm audit fix

# For major version updates (use with caution)
npm install package-name@latest
```

3. **Rebuild and test**:

```bash
npm run build
npm start
```

4. **Test critical functionality**:
   - Log a match: `/log @player1 @player2 @player3`
   - Confirm it works
   - Check leaderboard: `/leaderboard`

### Critical Dependencies

- **discord.js**: API for Discord interactions - breaking changes possible between major versions
- **mongoose**: MongoDB ODM - test database operations after updates
- **typescript**: May require code changes for major updates

### Security Updates

Always apply security patches promptly:

```bash
npm audit fix
npm run build
# Restart bot
```

## Monitoring

### What to Monitor

#### Bot Health
- Bot online status in Discord (should show as online)
- Response time to commands (should be < 3 seconds)
- Command errors (check logs)

#### Server Resources
- **CPU Usage**: Should stay below 50% average
- **Memory Usage**: Node.js typically uses 100-500 MB
- **Disk Space**: Keep at least 20% free

```bash
# Check memory usage (if using PM2)
pm2 monit

# Check system resources
htop
```

#### Database Health
- **Connection Status**: Bot logs should show successful connection
- **Storage Usage**: Monitor database size growth
- **Query Performance**: Slow queries may indicate indexing issues

### Setting Up Alerts

**PM2 with Email Notifications** (optional):

```bash
pm2 install pm2-auto-pull
pm2 set pm2:autodump true
```

**Uptime Monitoring** (external):
- [UptimeRobot](https://uptimerobot.com/) - Free tier available
- Monitor Discord bot status via HTTP endpoint (requires custom implementation)

## Troubleshooting

### Bot Not Responding to Commands

**Symptom**: Slash commands don't appear or show "Application did not respond"

**Solutions**:

1. **Verify Bot is Running**:
   ```bash
   pm2 status thoracle
   # or
   systemctl status thoracle
   ```

2. **Check Bot Permissions**:
   - Bot needs "Send Messages" and "Use Slash Commands" permissions
   - Check role hierarchy (bot role should be high enough)

3. **Re-register Commands**:
   ```bash
   npm run build
   npm run register
   ```
   Note: Global commands can take up to 1 hour to propagate

4. **Check Discord API Status**: Visit [Discord Status](https://discordstatus.com)

### Database Connection Failures

**Symptom**: Bot crashes on startup with "Missing `DATABASE_URI`" or connection errors

**Solutions**:

1. **Verify Environment Variables**:
   ```bash
   cat .env | grep DATABASE_URI
   ```

2. **Test Database Connection**:
   ```bash
   # Using mongosh
   mongosh "YOUR_DATABASE_URI"
   ```

3. **Check IP Whitelist** (MongoDB Atlas):
   - Log into MongoDB Atlas
   - Network Access → Add current IP address
   - Or allow all IPs (0.0.0.0/0) for development

4. **Verify Credentials**: Ensure username/password are correct and URL-encoded

### Command Registration Issues

**Symptom**: Commands don't show up in Discord

**Solutions**:

1. **Use Development Registration First**:
   ```bash
   npm run register-dev
   ```
   This registers commands only in your guild (instant)

2. **Check CLIENT_ID and GUILD_ID**:
   - CLIENT_ID: From Discord Developer Portal → Your Application
   - GUILD_ID: Right-click your server in Discord → Copy Server ID (requires Developer Mode)

3. **Global Registration Delay**: Can take up to 1 hour

### Permission Errors

**Symptom**: "Missing Permissions" or "Bot cannot send messages"

**Solutions**:

1. **Check Channel Permissions**:
   - Right-click channel → Edit Channel → Permissions
   - Ensure bot role has "View Channel", "Send Messages"

2. **Check Role Hierarchy**:
   - Server Settings → Roles
   - Bot role should be above roles it needs to mention/manage

3. **Re-invite Bot** with correct permissions:
   - Discord Developer Portal → OAuth2 → URL Generator
   - Scopes: `bot`, `applications.commands`
   - Permissions: See [README.md](README.md#bot-permissions)

### Memory Leaks

**Symptom**: Bot memory usage grows over time

**Solutions**:

1. **Monitor Memory**:
   ```bash
   pm2 monit
   ```

2. **Set Memory Limit**:
   ```bash
   pm2 start dist/index.js --name thoracle --max-memory-restart 500M
   ```

3. **Review Recent Code Changes**: Memory leaks often caused by event listeners not being cleaned up

## Season Management

### Starting a New Season

**Best Practices**:

1. **Announce in Advance**: Give players 1 week notice
2. **End Current Season**: `/season end`
3. **Review Final Standings**: `/leaderboard`
4. **Archive Leaderboard** (manually screenshot or export data)
5. **Start New Season**: `/season start Season Name`

### Ending a Season

```
/season end
```

**What Happens**:
- Current season is marked as ended
- Points are frozen for historical record
- New matches will not be associated with this season until a new one starts

### Season Data

Season data is **never deleted** from the database. Historical matches and standings remain accessible:

```
/leaderboard season:Season 1
/season info name:Season 1
```

## Data Integrity

### Handling Match Disputes

1. **Player Reports Dispute**: Uses "Dispute" button on match
2. **Dispute Thread Created**: Bot creates thread, adds all players + dispute role
3. **Investigation**: Review with players what the actual outcome was
4. **Resolution**:
   - **If match is correct**: Explain to disputing player, ask them to confirm
   - **If match is wrong**: Delete match (`/match delete <id>`) and have winner re-log correctly

### Correcting Bad Data

#### Deleting Incorrect Matches

1. **Find Match ID**:
   ```
   /match pending    # For unconfirmed matches
   /match disputed   # For disputed matches
   ```

2. **Delete Match**:
   ```
   /match delete <match-id>
   ```

3. **Re-log Correctly**: Have the actual winner log the match again

#### Editing Deck Names

Players can rename decks themselves:
```
/deck rename name:OldName new-name:NewName
```

#### Fixing Player Profiles

There's no direct edit command. Workarounds:
- **Deck Issues**: Delete and recreate deck
- **Statistics**: Statistics are calculated from matches, so delete incorrect matches

### Database Direct Access (Advanced)

For severe data corruption, you can connect directly to MongoDB:

```bash
mongosh "YOUR_DATABASE_URI"

use database_name

# View collections
show collections

# Example: Find all matches in a season
db.matches.find({ season: ObjectId("...") })

# Example: Delete a specific match
db.matches.deleteOne({ _id: ObjectId("...") })
```

**⚠️ Warning**: Direct database edits can cause data inconsistency. Always backup first.

### Preventing Data Loss

1. **Regular Backups**: Automated daily backups (see [Database Management](#database-management))
2. **Test Changes**: Use development guild for testing major changes
3. **Version Control**: Keep `src/` code in git with regular commits
4. **Document Changes**: Keep changelog of configuration changes

## Emergency Procedures

### Bot Completely Down

1. **Check if process is running**:
   ```bash
   pm2 status
   # or
   systemctl status thoracle
   ```

2. **Restart**:
   ```bash
   pm2 restart thoracle
   # or
   systemctl restart thoracle
   ```

3. **Check logs for errors**:
   ```bash
   pm2 logs thoracle --err
   ```

4. **Verify database connectivity**:
   ```bash
   mongosh "YOUR_DATABASE_URI" --eval "db.serverStatus()"
   ```

### Database Corrupted

1. **Stop the bot** immediately
2. **Restore from latest backup** (see [Restore Procedures](#restore-procedures))
3. **Restart bot**
4. **Verify functionality**

### Lost Access to MongoDB

1. **Check MongoDB Atlas account** - verify payment status
2. **Check IP whitelist** in MongoDB Atlas
3. **If using self-hosted**: Check MongoDB service status
4. **Restore from backup** to new MongoDB instance if necessary

## Getting Help

### Resources

- **Documentation**: [README.md](README.md), [ARCHITECTURE.md](ARCHITECTURE.md)
- **Discord.js Docs**: https://discord.js.org/
- **MongoDB Manual**: https://docs.mongodb.com/manual/
- **Node.js Docs**: https://nodejs.org/docs/

### Support Channels

- **Discord Community**: Update `SUPPORT_SERVER` env var with your support server
- **GitHub Issues**: For bug reports and feature requests
- **MongoDB Support**: Atlas users have ticket support

### Common Log Files

- **PM2**: `~/.pm2/logs/`
- **systemd**: `journalctl -u thoracle`
- **Custom logs**: If implemented in code

## Maintenance Checklist

### Monthly Checklist

- [ ] Review error logs
- [ ] Check database backup integrity
- [ ] Update dependencies (security patches)
- [ ] Monitor disk space
- [ ] Review disputed matches
- [ ] Check bot permissions in all channels

### Quarterly Checklist

- [ ] Full dependency update review
- [ ] Database performance review
- [ ] Server resource usage analysis
- [ ] Review and update documentation
- [ ] Test disaster recovery procedures

### Yearly Checklist

- [ ] Renew domain/hosting (if applicable)
- [ ] Security audit
- [ ] Database optimization
- [ ] Review all administrative roles and permissions
- [ ] Update Node.js version

