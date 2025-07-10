#!/usr/bin/env node

const chokidar = require('chokidar');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  // Files and directories to watch
  watchPaths: [
    'src/**/*',
    'public/**/*',
    'supabase/**/*',
    '*.md',
    '*.json',
    '*.ts',
    '*.tsx',
    '*.js',
    '*.jsx',
    '*.css',
    '*.html'
  ],
  // Files and directories to ignore
  ignorePaths: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '.next/**',
    '.vercel/**',
    '.env*',
    '*.log',
    'temp/**',
    '**/*.temp',
    '**/*.tmp'
  ],
  // Debounce time in milliseconds (wait time after last change before committing)
  debounceTime: 5000,
  // Auto-push after commits
  autoPush: true,
  // Commit message prefix
  commitPrefix: '🔄 Auto-sync:'
};

class AutoSync {
  constructor() {
    this.pendingChanges = new Set();
    this.debounceTimer = null;
    this.isProcessing = false;
    this.lastCommitTime = 0;
    
    this.init();
  }

  init() {
    console.log('🚀 Starting Auto-Sync for Financial Edge AI...');
    console.log('📂 Watching paths:', config.watchPaths);
    console.log('🚫 Ignoring paths:', config.ignorePaths);
    console.log('⏱️  Debounce time:', config.debounceTime + 'ms');
    console.log('📤 Auto-push:', config.autoPush ? 'enabled' : 'disabled');
    console.log('---');

    // Check if we're in a git repository
    try {
      execSync('git rev-parse --is-inside-work-tree', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ Not in a git repository. Please run this script from the project root.');
      process.exit(1);
    }

    // Initialize file watcher
    this.watcher = chokidar.watch(config.watchPaths, {
      ignored: config.ignorePaths,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 1000,
        pollInterval: 100
      }
    });

    // Set up event handlers
    this.watcher
      .on('add', (filePath) => this.handleChange('added', filePath))
      .on('change', (filePath) => this.handleChange('changed', filePath))
      .on('unlink', (filePath) => this.handleChange('deleted', filePath))
      .on('error', (error) => console.error('❌ Watcher error:', error))
      .on('ready', () => {
        console.log('👀 Auto-sync is watching for changes...');
        console.log('📝 Make changes to your files and they will be automatically committed and pushed!');
        console.log('🛑 Press Ctrl+C to stop');
        console.log('---');
      });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping Auto-Sync...');
      this.cleanup();
      process.exit(0);
    });
  }

  handleChange(type, filePath) {
    if (this.isProcessing) return;

    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`📝 ${type.toUpperCase()}: ${relativePath}`);
    
    this.pendingChanges.add({ type, path: relativePath });
    
    // Reset debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.commitChanges();
    }, config.debounceTime);
  }

  async commitChanges() {
    if (this.isProcessing || this.pendingChanges.size === 0) return;

    this.isProcessing = true;
    
    try {
      console.log('---');
      console.log('🔄 Processing changes...');
      
      // Check for git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      
      if (!gitStatus) {
        console.log('✅ No changes to commit');
        this.pendingChanges.clear();
        this.isProcessing = false;
        return;
      }

      // Stage all changes
      console.log('📦 Staging changes...');
      execSync('git add .', { stdio: 'pipe' });

      // Generate commit message
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const changeTypes = [...this.pendingChanges].map(change => change.type);
      const uniqueTypes = [...new Set(changeTypes)];
      const changedFiles = [...this.pendingChanges].map(change => change.path);
      
      let commitMessage = `${config.commitPrefix} ${uniqueTypes.join(', ')} files (${timestamp})`;
      
      if (changedFiles.length <= 5) {
        commitMessage += `\n\nFiles: ${changedFiles.join(', ')}`;
      } else {
        commitMessage += `\n\nFiles: ${changedFiles.slice(0, 5).join(', ')} and ${changedFiles.length - 5} more`;
      }

      // Commit changes
      console.log('💾 Committing changes...');
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'pipe' });
      
      console.log('✅ Changes committed successfully');
      console.log('📝 Commit message:', commitMessage.split('\n')[0]);

      // Push to remote if enabled
      if (config.autoPush) {
        console.log('📤 Pushing to remote...');
        try {
          execSync('git push origin main', { stdio: 'pipe' });
          console.log('✅ Successfully pushed to GitHub');
        } catch (pushError) {
          console.log('⚠️  Push failed, trying to pull first...');
          try {
            execSync('git pull origin main --rebase', { stdio: 'pipe' });
            execSync('git push origin main', { stdio: 'pipe' });
            console.log('✅ Successfully pushed to GitHub after rebase');
          } catch (error) {
            console.error('❌ Failed to push after rebase:', error.message);
          }
        }
      }

      this.lastCommitTime = Date.now();
      this.pendingChanges.clear();
      
    } catch (error) {
      console.error('❌ Error during commit process:', error.message);
    } finally {
      this.isProcessing = false;
      console.log('---');
      console.log('👀 Watching for more changes...');
    }
  }

  cleanup() {
    if (this.watcher) {
      this.watcher.close();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

// Start the auto-sync
new AutoSync(); 