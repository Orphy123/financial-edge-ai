#!/bin/bash

# Auto-sync script for Financial Edge AI
# This script watches for changes and automatically commits and pushes them to GitHub

# Configuration
WATCH_PATHS="src public supabase *.md *.json *.ts *.tsx *.js *.jsx *.css *.html"
IGNORE_PATHS="node_modules dist build .git .next .vercel .env* *.log temp **/*.temp **/*.tmp"
DEBOUNCE_TIME=5  # seconds
AUTO_PUSH=true
COMMIT_PREFIX="🔄 Auto-sync:"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to check if we're in a git repository
check_git_repo() {
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
}

# Function to commit and push changes
commit_and_push() {
    print_status "Processing changes..."
    
    # Check if there are any changes
    if [[ -z $(git status --porcelain) ]]; then
        print_info "No changes to commit"
        return
    fi
    
    # Stage all changes
    print_status "Staging changes..."
    git add . > /dev/null 2>&1
    
    # Generate commit message
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    changed_files=$(git diff --cached --name-only | wc -l)
    commit_message="$COMMIT_PREFIX Auto-commit ($changed_files files) - $timestamp"
    
    # Commit changes
    print_status "Committing changes..."
    if git commit -m "$commit_message" > /dev/null 2>&1; then
        print_success "Changes committed successfully"
        print_info "Commit message: $commit_message"
        
        # Push to remote if enabled
        if [[ "$AUTO_PUSH" == "true" ]]; then
            print_status "Pushing to remote..."
            if git push origin main > /dev/null 2>&1; then
                print_success "Successfully pushed to GitHub"
            else
                print_warning "Push failed, trying to pull first..."
                if git pull origin main --rebase > /dev/null 2>&1 && git push origin main > /dev/null 2>&1; then
                    print_success "Successfully pushed to GitHub after rebase"
                else
                    print_error "Failed to push after rebase"
                fi
            fi
        fi
    else
        print_error "Failed to commit changes"
    fi
}

# Function to watch for changes (macOS/Linux)
watch_changes() {
    print_status "Starting Auto-Sync for Financial Edge AI..."
    print_info "Debounce time: ${DEBOUNCE_TIME}s"
    print_info "Auto-push: $AUTO_PUSH"
    echo "---"
    print_status "Watching for changes..."
    print_info "Make changes to your files and they will be automatically committed and pushed!"
    print_info "Press Ctrl+C to stop"
    echo "---"
    
    # Use fswatch if available (macOS), otherwise use basic polling
    if command -v fswatch > /dev/null 2>&1; then
        # macOS with fswatch
        fswatch -o . --exclude=node_modules --exclude=dist --exclude=build --exclude=.git --exclude=.next --exclude=.vercel --exclude=.env | while read num; do
            print_status "Changes detected, waiting ${DEBOUNCE_TIME}s before committing..."
            sleep $DEBOUNCE_TIME
            commit_and_push
        done
    elif command -v inotifywait > /dev/null 2>&1; then
        # Linux with inotify
        while true; do
            inotifywait -r -e modify,create,delete,move . --exclude='(node_modules|dist|build|\.git|\.next|\.vercel|\.env)' > /dev/null 2>&1
            print_status "Changes detected, waiting ${DEBOUNCE_TIME}s before committing..."
            sleep $DEBOUNCE_TIME
            commit_and_push
        done
    else
        # Fallback: Basic polling
        print_warning "fswatch/inotifywait not found, using basic polling (less efficient)"
        last_commit=$(git rev-parse HEAD)
        while true; do
            sleep $DEBOUNCE_TIME
            if [[ -n $(git status --porcelain) ]]; then
                print_status "Changes detected..."
                commit_and_push
            fi
        done
    fi
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies for better file watching..."
    
    # Check OS and install appropriate file watcher
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if ! command -v fswatch > /dev/null 2>&1; then
            print_info "Installing fswatch for macOS..."
            if command -v brew > /dev/null 2>&1; then
                brew install fswatch
            else
                print_warning "Homebrew not found. Please install fswatch manually: brew install fswatch"
            fi
        fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        if ! command -v inotifywait > /dev/null 2>&1; then
            print_info "Installing inotify-tools for Linux..."
            if command -v apt-get > /dev/null 2>&1; then
                sudo apt-get update && sudo apt-get install inotify-tools
            elif command -v yum > /dev/null 2>&1; then
                sudo yum install inotify-tools
            else
                print_warning "Package manager not found. Please install inotify-tools manually."
            fi
        fi
    fi
}

# Function to show help
show_help() {
    echo "🚀 Auto-Sync for Financial Edge AI"
    echo
    echo "Usage: $0 [OPTIONS]"
    echo
    echo "Options:"
    echo "  -h, --help          Show this help message"
    echo "  -i, --install       Install required dependencies"
    echo "  -d, --debounce N    Set debounce time in seconds (default: 5)"
    echo "  --no-push           Disable auto-push (commit only)"
    echo "  --push              Enable auto-push (default)"
    echo
    echo "Examples:"
    echo "  $0                  Start auto-sync with default settings"
    echo "  $0 -d 10            Start with 10-second debounce"
    echo "  $0 --no-push        Start without auto-push"
    echo "  $0 -i               Install dependencies"
}

# Function to handle cleanup on exit
cleanup() {
    print_status "Stopping Auto-Sync..."
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -i|--install)
            install_dependencies
            exit 0
            ;;
        -d|--debounce)
            DEBOUNCE_TIME="$2"
            shift 2
            ;;
        --no-push)
            AUTO_PUSH=false
            shift
            ;;
        --push)
            AUTO_PUSH=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
check_git_repo
watch_changes 