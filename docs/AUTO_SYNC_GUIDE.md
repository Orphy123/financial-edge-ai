# 🔄 Auto-Sync Guide for Financial Edge AI

## Overview

The Auto-Sync feature automatically detects file changes in your project and commits them to Git, then pushes them to GitHub. This eliminates the need to manually run `git add`, `git commit`, and `git push` commands every time you make changes.

## 🚀 Quick Start

### Option 1: Node.js Version (Recommended)
```bash
npm run auto-sync
```

### Option 2: Shell Script Version
```bash
npm run auto-sync:shell
```

### Option 3: Direct Shell Script
```bash
./scripts/auto-sync.sh
```

## 📋 Prerequisites

### For Node.js Version
- Node.js 18+ installed
- All npm dependencies installed (`npm install`)

### For Shell Script Version
- **macOS**: Install `fswatch` for better performance
  ```bash
  brew install fswatch
  # or run: npm run auto-sync:install
  ```
- **Linux**: Install `inotify-tools`
  ```bash
  sudo apt-get install inotify-tools  # Ubuntu/Debian
  sudo yum install inotify-tools      # CentOS/RHEL
  # or run: npm run auto-sync:install
  ```

## ⚙️ Configuration

### Node.js Version Settings
Edit `scripts/auto-sync.js` to customize:

```javascript
const config = {
  // Files to watch
  watchPaths: [
    'src/**/*',
    'public/**/*',
    'supabase/**/*',
    '*.md',
    '*.json',
    // Add more paths as needed
  ],
  
  // Files to ignore
  ignorePaths: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '.env*',
    // Add more ignore patterns
  ],
  
  // Wait time after last change (milliseconds)
  debounceTime: 5000,
  
  // Auto-push to GitHub
  autoPush: true,
  
  // Commit message prefix
  commitPrefix: '🔄 Auto-sync:'
};
```

### Shell Script Version Settings
Edit `scripts/auto-sync.sh` to customize:

```bash
# Configuration
DEBOUNCE_TIME=5      # seconds
AUTO_PUSH=true       # true/false
COMMIT_PREFIX="🔄 Auto-sync:"
```

## 🎯 Usage Examples

### Basic Usage
```bash
# Start auto-sync with default settings
npm run auto-sync

# Start shell version
npm run auto-sync:shell
```

### Advanced Usage
```bash
# Commit only (no push)
npm run auto-sync:no-push

# Shell script with custom debounce time
./scripts/auto-sync.sh -d 10

# Shell script without auto-push
./scripts/auto-sync.sh --no-push

# Install dependencies
npm run auto-sync:install
```

## 📝 How It Works

1. **File Watching**: Monitors specified directories for changes
2. **Debouncing**: Waits for a specified time after the last change
3. **Auto-Staging**: Automatically runs `git add .`
4. **Smart Commits**: Creates descriptive commit messages with timestamps
5. **Auto-Push**: Pushes changes to GitHub (if enabled)
6. **Conflict Resolution**: Automatically handles merge conflicts with rebase

## 🔍 Monitoring

### Node.js Version Output
```
🚀 Starting Auto-Sync for Financial Edge AI...
📂 Watching paths: src/**/* public/**/* supabase/**/* ...
🚫 Ignoring paths: node_modules/** dist/** build/** ...
⏱️  Debounce time: 5000ms
📤 Auto-push: enabled
---
👀 Auto-sync is watching for changes...
📝 Make changes to your files and they will be automatically committed and pushed!
🛑 Press Ctrl+C to stop
---
📝 CHANGED: src/components/TradingViewChart.tsx
🔄 Processing changes...
📦 Staging changes...
💾 Committing changes...
✅ Changes committed successfully
📝 Commit message: 🔄 Auto-sync: changed files (2024-01-15 10:30:45)
📤 Pushing to remote...
✅ Successfully pushed to GitHub
```

### Shell Script Version Output
```
[10:30:45] Starting Auto-Sync for Financial Edge AI...
ℹ️  Debounce time: 5s
ℹ️  Auto-push: true
---
[10:30:45] Watching for changes...
ℹ️  Make changes to your files and they will be automatically committed and pushed!
ℹ️  Press Ctrl+C to stop
---
[10:31:12] Changes detected, waiting 5s before committing...
[10:31:17] Processing changes...
[10:31:17] Staging changes...
[10:31:17] Committing changes...
✅ Changes committed successfully
ℹ️  Commit message: 🔄 Auto-sync: Auto-commit (3 files) - 2024-01-15 10:31:17
[10:31:17] Pushing to remote...
✅ Successfully pushed to GitHub
```

## 🛡️ Safety Features

### Conflict Resolution
- Automatically pulls remote changes before pushing
- Uses rebase to maintain clean history
- Handles merge conflicts gracefully

### Smart Ignoring
- Ignores sensitive files (`.env*`, logs, etc.)
- Skips build artifacts and dependencies
- Configurable ignore patterns

### Debouncing
- Prevents excessive commits during rapid changes
- Configurable wait time
- Batches multiple changes into single commits

## 🔧 Troubleshooting

### Common Issues

#### "Not in a git repository"
```bash
# Initialize git if not already done
git init
git remote add origin https://github.com/yourusername/financial-edge-ai.git
```

#### "Permission denied" for shell script
```bash
# Make script executable
chmod +x scripts/auto-sync.sh
```

#### "fswatch not found" (macOS)
```bash
# Install fswatch
brew install fswatch
# or
npm run auto-sync:install
```

#### "inotifywait not found" (Linux)
```bash
# Install inotify-tools
sudo apt-get install inotify-tools
# or
npm run auto-sync:install
```

#### Push failures
- Check your Git credentials
- Ensure you have push permissions to the repository
- Verify the remote URL is correct

### Performance Tips

1. **Use specific watch paths** instead of watching entire directories
2. **Add more ignore patterns** for files you don't want to sync
3. **Increase debounce time** if you make frequent changes
4. **Use the Node.js version** for better performance on large projects

## 📚 Commands Reference

### NPM Scripts
```bash
npm run auto-sync              # Start Node.js version
npm run auto-sync:shell        # Start shell version
npm run auto-sync:no-push      # Shell version without push
npm run auto-sync:install      # Install dependencies
```

### Shell Script Options
```bash
./scripts/auto-sync.sh [OPTIONS]

Options:
  -h, --help          Show help message
  -i, --install       Install required dependencies
  -d, --debounce N    Set debounce time in seconds
  --no-push           Disable auto-push
  --push              Enable auto-push
```

## 🔒 Security Considerations

- **Never commit sensitive data**: Use `.gitignore` and the ignore patterns
- **Review commits**: Periodically check what's being committed
- **Use private repositories**: For sensitive projects
- **Environment variables**: Never commit `.env` files (already ignored)

## 🎨 Customization

### Custom Commit Messages
Edit the commit prefix and message format in the configuration:

```javascript
// Node.js version
commitPrefix: '🚀 Deploy:'

// Shell version
COMMIT_PREFIX="🚀 Deploy:"
```

### Custom Watch Patterns
Add specific files or directories to monitor:

```javascript
// Node.js version
watchPaths: [
  'src/**/*',
  'docs/**/*.md',
  'config/**/*.json'
]

// Shell version - edit the script directly
```

## 🔄 Integration with GitHub Actions

The auto-sync works seamlessly with the GitHub Action (`.github/workflows/auto-sync.yml`) that:

1. **Builds the project** on every push
2. **Runs tests** if available
3. **Analyzes bundle size**
4. **Performs quality checks**
5. **Provides detailed reports**

## 📈 Best Practices

1. **Start with shell version** for simplicity
2. **Test on a feature branch** before using on main
3. **Use descriptive file names** for better commit messages
4. **Regularly review** the auto-generated commits
5. **Keep debounce time reasonable** (5-10 seconds recommended)
6. **Monitor GitHub Actions** for build status

## 🆘 Support

If you encounter issues:

1. Check this guide for solutions
2. Review the script logs for error messages
3. Ensure all prerequisites are installed
4. Try the alternative version (Node.js ↔ Shell)
5. Open an issue in the repository

---

**Happy coding! 🚀** Your changes will now automatically sync to GitHub! 