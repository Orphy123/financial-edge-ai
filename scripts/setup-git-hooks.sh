#!/bin/bash

# Setup Git Hooks for Auto-Push
# This script sets up a post-commit hook that automatically pushes changes to GitHub

echo "🔗 Setting up Git Hooks for Auto-Push..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create post-commit hook
cat > .git/hooks/post-commit << 'EOF'
#!/bin/bash

# Auto-push after commit
echo "🚀 Auto-pushing to GitHub..."

# Check if we're on main branch
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [ "$current_branch" = "main" ]; then
    # Try to push
    if git push origin main 2>/dev/null; then
        echo "✅ Successfully pushed to GitHub"
    else
        echo "⚠️  Push failed, trying to pull first..."
        if git pull origin main --rebase 2>/dev/null && git push origin main 2>/dev/null; then
            echo "✅ Successfully pushed to GitHub after rebase"
        else
            echo "❌ Failed to push. Please resolve manually."
        fi
    fi
else
    echo "ℹ️  Not on main branch, skipping auto-push"
fi
EOF

# Make the hook executable
chmod +x .git/hooks/post-commit

echo "✅ Git hooks set up successfully!"
echo "📝 Now every commit will automatically push to GitHub"
echo "🔧 To disable: rm .git/hooks/post-commit"
echo "💡 To test: make a commit and watch it auto-push" 