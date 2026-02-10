#!/usr/bin/env bash
#
# sync-personal.sh - Sync personal branch with upstream dev
#
# Workflow:
# 1. Fetch latest dev from origin
# 2. Rebase personal branch on top of dev
# 3. If conflicts: invoke opencode to resolve them automatically
# 4. Build the project
# 5. Link to opencode as plugin
#
# Usage: ./scripts/sync-personal.sh [--force]
#   --force: Force rebuild even if no changes
#
# Exit codes:
#   0 - Success
#   1 - Git operation failed
#   2 - OpenCode conflict resolution failed
#   3 - Build failed
#   4 - Link failed

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
readonly UPSTREAM_BRANCH="dev"
readonly PERSONAL_BRANCH="personal"
readonly OPENCODE_CONFIG_DIR="${HOME}/.config/opencode"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Parse arguments
FORCE_REBUILD=false
for arg in "$@"; do
    case $arg in
        --force) FORCE_REBUILD=true ;;
        --help|-h)
            echo "Usage: $0 [--force]"
            echo "  --force: Force rebuild even if no changes"
            exit 0
            ;;
        *)
            log_error "Unknown argument: $arg"
            exit 1
            ;;
    esac
done

# Ensure we're in the project directory
cd "$PROJECT_DIR"

# Verify we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Not a git repository: $PROJECT_DIR"
    exit 1
fi

# Check if opencode is available
if ! command -v opencode &> /dev/null; then
    log_error "opencode CLI not found. Please install it first."
    exit 1
fi

# Store current branch to restore if needed
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

# Cleanup function
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        # If we're in the middle of a rebase, abort it
        if [[ -d "$PROJECT_DIR/.git/rebase-merge" ]] || [[ -d "$PROJECT_DIR/.git/rebase-apply" ]]; then
            log_warn "Aborting incomplete rebase..."
            git rebase --abort 2>/dev/null || true
        fi
    fi
}
trap cleanup EXIT

# Function to check if there are uncommitted changes
check_clean_working_tree() {
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        log_error "Working tree has uncommitted changes. Please commit or stash them first."
        exit 1
    fi
}

# Function to resolve conflicts using opencode
resolve_conflicts_with_opencode() {
    log_info "Conflicts detected. Invoking opencode to resolve..."
    
    # Get list of conflicted files
    local conflicted_files
    conflicted_files=$(git diff --name-only --diff-filter=U)
    
    if [[ -z "$conflicted_files" ]]; then
        log_warn "No conflicted files found, but rebase is in progress"
        return 1
    fi
    
    log_info "Conflicted files:"
    echo "$conflicted_files" | while read -r file; do
        echo "  - $file"
    done
    
    # Create a detailed prompt for opencode
    local conflict_prompt
    conflict_prompt=$(cat <<EOF
You are resolving git rebase conflicts in the oh-my-opencode project.

CONTEXT:
- Rebasing 'personal' branch onto latest 'dev' branch
- Personal branch contains customizations on top of upstream
- Goal: Keep personal customizations while incorporating upstream changes

CONFLICTED FILES:
$conflicted_files

INSTRUCTIONS:
1. Read each conflicted file
2. Understand what the conflict markers mean:
   - <<<<<<< HEAD: Changes from dev (upstream)
   - =======: Separator
   - >>>>>>> [commit]: Changes from personal (our customizations)
3. Resolve each conflict by:
   - Keeping BOTH upstream improvements AND personal customizations where possible
   - If they conflict directly, prefer personal customizations but incorporate any bug fixes from upstream
4. Remove ALL conflict markers (<<<<<<, =======, >>>>>>>)
5. After resolving each file, stage it with: git add <file>
6. After ALL files are resolved and staged, run: git rebase --continue

CRITICAL:
- Do NOT skip any conflicts
- Do NOT abort the rebase
- Ensure the code is syntactically valid after resolution
- Run 'bun run typecheck' after resolving to verify no type errors

Start by reading the conflicted files and resolving them one by one.
EOF
)
    
    # Run opencode to resolve conflicts
    log_info "Running opencode for conflict resolution..."
    if opencode run "$conflict_prompt" --title "Resolve rebase conflicts"; then
        # Verify rebase is complete
        if [[ -d "$PROJECT_DIR/.git/rebase-merge" ]] || [[ -d "$PROJECT_DIR/.git/rebase-apply" ]]; then
            log_error "Rebase still in progress after opencode. Manual intervention required."
            return 1
        fi
        log_success "Conflicts resolved successfully"
        return 0
    else
        log_error "opencode failed to resolve conflicts"
        return 1
    fi
}

# Function to perform the rebase
perform_rebase() {
    log_info "Rebasing $PERSONAL_BRANCH onto $UPSTREAM_BRANCH..."
    
    # Attempt rebase
    if git rebase "$UPSTREAM_BRANCH"; then
        log_success "Rebase completed without conflicts"
        return 0
    else
        # Rebase failed, likely due to conflicts
        log_warn "Rebase encountered conflicts"
        
        # Try to resolve with opencode
        if resolve_conflicts_with_opencode; then
            return 0
        else
            log_error "Failed to resolve conflicts automatically"
            git rebase --abort 2>/dev/null || true
            return 1
        fi
    fi
}

# Function to build the project
build_project() {
    log_info "Building project..."
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]] || [[ "package.json" -nt "node_modules" ]]; then
        log_info "Installing dependencies..."
        bun install
    fi
    
    # Clean and build
    bun run clean 2>/dev/null || true
    if bun run build; then
        log_success "Build completed successfully"
        return 0
    else
        log_error "Build failed"
        return 1
    fi
}

# Function to link plugin to opencode
link_plugin() {
    log_info "Linking plugin to opencode..."
    
    # Use bun link to create global link
    if bun link; then
        log_success "Plugin linked successfully"
        
        # Verify the plugin is in opencode config
        if [[ -f "$OPENCODE_CONFIG_DIR/config.json" ]]; then
            if grep -q "oh-my-opencode" "$OPENCODE_CONFIG_DIR/config.json"; then
                log_success "Plugin is configured in opencode"
            else
                log_warn "Plugin not found in opencode config. Add 'oh-my-opencode' to plugins array in $OPENCODE_CONFIG_DIR/config.json"
            fi
        fi
        return 0
    else
        log_error "Failed to link plugin"
        return 1
    fi
}

# Main execution
main() {
    log_info "Starting sync of personal branch with upstream dev..."
    log_info "Project directory: $PROJECT_DIR"
    
    # Step 0: Ensure clean working tree
    check_clean_working_tree
    
    # Step 1: Fetch latest from origin
    log_info "Fetching latest from origin..."
    git fetch origin "$UPSTREAM_BRANCH"
    
    # Step 2: Switch to personal branch if not already on it
    if [[ "$CURRENT_BRANCH" != "$PERSONAL_BRANCH" ]]; then
        log_info "Switching to $PERSONAL_BRANCH branch..."
        git checkout "$PERSONAL_BRANCH"
    fi
    
    # Check if rebase is needed
    local dev_head
    local personal_base
    dev_head=$(git rev-parse "origin/$UPSTREAM_BRANCH")
    personal_base=$(git merge-base HEAD "origin/$UPSTREAM_BRANCH")
    
    if [[ "$dev_head" == "$personal_base" ]] && [[ "$FORCE_REBUILD" == "false" ]]; then
        log_info "Personal branch is already up to date with $UPSTREAM_BRANCH"
        log_info "Use --force to rebuild anyway"
        
        # Still verify build is current
        if [[ ! -d "dist" ]]; then
            log_warn "No dist directory found, building..."
            build_project || exit 3
            link_plugin || exit 4
        fi
        
        log_success "Sync complete (no changes needed)"
        exit 0
    fi
    
    # Step 3: Perform rebase
    perform_rebase || exit 1
    
    # Step 4: Typecheck before building
    log_info "Running typecheck..."
    if ! bun run typecheck; then
        log_error "Typecheck failed after rebase. Manual fixes required."
        exit 3
    fi
    
    # Step 5: Build
    build_project || exit 3
    
    # Step 6: Link
    link_plugin || exit 4
    
    # Summary
    echo ""
    log_success "========================================="
    log_success "Sync completed successfully!"
    log_success "========================================="
    log_info "Personal branch is now rebased on latest $UPSTREAM_BRANCH"
    log_info "Plugin has been rebuilt and linked to opencode"
    echo ""
    log_info "To push your rebased branch (if needed):"
    echo "  git push --force-with-lease origin $PERSONAL_BRANCH"
}

main "$@"
