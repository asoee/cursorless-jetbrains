#!/bin/bash
#
# Script to update WASM files from pokey.parse-tree VSCode extension,
# SCM query files from cursorless-dev repository, and language mappings.
#
# Usage:
#   ./update-wasm-and-scm.sh [wasm|scm|mapping|all|status]
#
# Sources:
#   - WASM files: pokey.parse-tree extension from Open VSX
#   - SCM files:  ../cursorless-dev/queries/
#   - Language mapping: vscode-parse-tree GitHub repository
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

WASM_DIR="$PROJECT_ROOT/extraFiles/treesitter/wasm"
SCM_DIR="$PROJECT_ROOT/src/main/resources/cursorless/queries"
CURSORLESS_DEV_QUERIES="$PROJECT_ROOT/../cursorless-dev/queries"
CURSORLESS_DEV_ROOT="$PROJECT_ROOT/../cursorless-dev"
LANGUAGE_MAPPING_FILE="$CURSORLESS_DEV_ROOT/packages/cursorless-jetbrains/src/ide/languageToWasmModule.ts"

# Open VSX API for pokey.parse-tree extension
OPEN_VSX_API="https://open-vsx.org/api/pokey/parse-tree"

# vscode-parse-tree extension.ts URL
VSCODE_PARSE_TREE_URL="https://raw.githubusercontent.com/cursorless-dev/vscode-parse-tree/main/src/extension.ts"

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

echo "=== Updating WASM, SCM files, and language mappings ==="
echo ""

# ================================
# Update WASM files
# ================================
update_wasm_files() {
    echo "--- Downloading pokey.parse-tree extension ---"

    # Get latest version info from Open VSX
    echo "Fetching latest version info from Open VSX..."
    VERSION_INFO=$(curl -sL "$OPEN_VSX_API")

    if [ -z "$VERSION_INFO" ]; then
        echo "Error: Failed to fetch extension info from Open VSX"
        exit 1
    fi

    # Extract version and download URL
    VERSION=$(echo "$VERSION_INFO" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
    DOWNLOAD_URL=$(echo "$VERSION_INFO" | grep -o '"download":"[^"]*"' | head -1 | cut -d'"' -f4)

    if [ -z "$VERSION" ] || [ -z "$DOWNLOAD_URL" ]; then
        echo "Error: Could not parse extension info"
        echo "Response: $VERSION_INFO"
        exit 1
    fi

    echo "Latest version: $VERSION"
    echo "Download URL: $DOWNLOAD_URL"

    VSIX_FILE="$TEMP_DIR/parse-tree.vsix"

    echo "Downloading extension..."
    curl -sL -o "$VSIX_FILE" "$DOWNLOAD_URL"

    if [ ! -f "$VSIX_FILE" ] || [ ! -s "$VSIX_FILE" ]; then
        echo "Error: Failed to download extension"
        exit 1
    fi

    VSIX_SIZE=$(stat -c%s "$VSIX_FILE" 2>/dev/null || stat -f%z "$VSIX_FILE" 2>/dev/null)
    echo "Downloaded: $(numfmt --to=iec-i --suffix=B $VSIX_SIZE 2>/dev/null || echo "$VSIX_SIZE bytes")"

    echo "Extracting VSIX package..."
    EXTRACT_DIR="$TEMP_DIR/extracted"
    mkdir -p "$EXTRACT_DIR"
    unzip -q "$VSIX_FILE" -d "$EXTRACT_DIR"

    # WASM files are in extension/parsers/ directory
    PARSERS_DIR="$EXTRACT_DIR/extension/parsers"
    WEB_TS_DIR="$EXTRACT_DIR/extension/node_modules/web-tree-sitter"

    if [ ! -d "$PARSERS_DIR" ]; then
        echo "Error: Could not find parsers directory in extension"
        echo "Extension contents:"
        find "$EXTRACT_DIR" -type d | head -20
        exit 1
    fi

    echo "Found parser WASM files in: $PARSERS_DIR"

    # Create backup of current WASM files
#    if [ -d "$WASM_DIR" ] && [ "$(ls -A "$WASM_DIR" 2>/dev/null)" ]; then
#        echo "Backing up current WASM files..."
#        BACKUP_DIR="$WASM_DIR.backup.$(date +%Y%m%d_%H%M%S)"
#        cp -r "$WASM_DIR" "$BACKUP_DIR"
#        echo "Backup created: $BACKUP_DIR"
#    fi

    # Copy new WASM files
    echo "Copying WASM files to $WASM_DIR..."
    mkdir -p "$WASM_DIR"

    WASM_COUNT=0

    # Copy tree-sitter language parsers
    for wasm_file in "$PARSERS_DIR"/*.wasm; do
        if [ -f "$wasm_file" ]; then
            cp "$wasm_file" "$WASM_DIR/"
            WASM_COUNT=$((WASM_COUNT + 1))
        fi
    done

    # Copy tree-sitter.wasm from web-tree-sitter
    if [ -f "$WEB_TS_DIR/tree-sitter.wasm" ]; then
        cp "$WEB_TS_DIR/tree-sitter.wasm" "$WASM_DIR/"
        WASM_COUNT=$((WASM_COUNT + 1))
        echo "Included tree-sitter.wasm from web-tree-sitter"
    fi

    echo "Copied $WASM_COUNT WASM files"
    echo ""
    echo "WASM files updated to version $VERSION"
}

# ================================
# Update SCM files
# ================================
update_scm_files() {
    echo ""
    echo "--- Updating SCM query files ---"

    if [ ! -d "$CURSORLESS_DEV_QUERIES" ]; then
        echo "Error: Cursorless dev queries directory not found at: $CURSORLESS_DEV_QUERIES"
        echo "Please ensure the cursorless-dev repository is cloned at ../cursorless-dev"
        exit 1
    fi

    # Count source files
    SOURCE_COUNT=$(find "$CURSORLESS_DEV_QUERIES" -maxdepth 1 -name "*.scm" -type f | wc -l)
    echo "Found $SOURCE_COUNT SCM files in source directory"

    # Create backup of current SCM files
#    if [ -d "$SCM_DIR" ] && [ "$(ls -A "$SCM_DIR" 2>/dev/null)" ]; then
#        echo "Backing up current SCM files..."
#        BACKUP_DIR="$SCM_DIR.backup.$(date +%Y%m%d_%H%M%S)"
#        cp -r "$SCM_DIR" "$BACKUP_DIR"
#        echo "Backup created: $BACKUP_DIR"
#    fi

    # Copy new SCM files
    echo "Copying SCM files from $CURSORLESS_DEV_QUERIES..."
    mkdir -p "$SCM_DIR"

    SCM_COUNT=0
    for scm_file in "$CURSORLESS_DEV_QUERIES"/*.scm; do
        if [ -f "$scm_file" ]; then
            cp "$scm_file" "$SCM_DIR/"
            SCM_COUNT=$((SCM_COUNT + 1))
        fi
    done

    echo "Copied $SCM_COUNT SCM files"
}

# ================================
# Update language mapping
# ================================
update_language_mapping() {
    echo ""
    echo "--- Updating language mapping ---"

    # Ensure parent directory exists
    MAPPING_DIR=$(dirname "$LANGUAGE_MAPPING_FILE")
    if [ ! -d "$MAPPING_DIR" ]; then
        echo "Error: Directory not found: $MAPPING_DIR"
        echo "Please ensure the cursorless-dev repository is cloned at ../cursorless-dev"
        exit 1
    fi

    # Fetch extension.ts from vscode-parse-tree
    echo "Fetching language mapping from vscode-parse-tree..."
    EXTENSION_TS="$TEMP_DIR/extension.ts"
    curl -sL -o "$EXTENSION_TS" "$VSCODE_PARSE_TREE_URL"

    if [ ! -f "$EXTENSION_TS" ] || [ ! -s "$EXTENSION_TS" ]; then
        echo "Error: Failed to download extension.ts"
        exit 1
    fi

    echo "Parsing language mappings..."

    # Extract the mapping entries using grep and sed
    # Source format: "languageId": { module: "tree-sitter-xxx" },
    # or: languageId: { module: "tree-sitter-xxx" },
    MAPPING_FILE="$TEMP_DIR/mapping_entries.txt"

    grep -E '^\s*"?[a-zA-Z0-9_-]+"?\s*:\s*\{\s*module:\s*"tree-sitter-[^"]+"\s*\}' "$EXTENSION_TS" | \
    sed -E 's/^\s*"?([^":{]+)"?\s*:\s*\{\s*module:\s*"([^"]+)".*/\1 \2/' > "$MAPPING_FILE"

    MAPPING_COUNT=$(wc -l < "$MAPPING_FILE")
    echo "Found $MAPPING_COUNT language mappings"

    if [ "$MAPPING_COUNT" -lt 10 ]; then
        echo "Error: Too few mappings found ($MAPPING_COUNT). Parsing may have failed."
        echo "First 50 lines of extension.ts:"
        head -50 "$EXTENSION_TS"
        exit 1
    fi

    # Generate the new TypeScript file
    OUTPUT_FILE="$TEMP_DIR/languageToWasmModule.ts"

    cat > "$OUTPUT_FILE" << 'HEADER'
/**
 * Mapping from language IDs to tree-sitter WASM module names.
 * This mapping matches the one used by vscode-parse-tree extension.
 *
 * AUTO-GENERATED - Do not edit manually.
 * Update using: cursorless-jetbrains/scripts/update-wasm-and-scm.sh mapping
 *
 * @see https://github.com/cursorless-dev/vscode-parse-tree/blob/main/src/extension.ts
 */
export const languageToWasmModule: Record<string, string> = {
HEADER

    # Add each mapping entry
    while read -r lang module; do
        # Quote keys that contain hyphens
        if echo "$lang" | grep -q '-'; then
            echo "  \"$lang\": \"$module\"," >> "$OUTPUT_FILE"
        else
            echo "  $lang: \"$module\"," >> "$OUTPUT_FILE"
        fi
    done < "$MAPPING_FILE"

    cat >> "$OUTPUT_FILE" << 'FOOTER'
};

/**
 * Get the WASM module name for a given language ID.
 * Falls back to `tree-sitter-${languageId}` if no mapping exists.
 */
export function getWasmModuleName(languageId: string): string {
  return languageToWasmModule[languageId] ?? `tree-sitter-${languageId}`;
}
FOOTER

    # Copy the new file
    echo "Writing $LANGUAGE_MAPPING_FILE..."
    cp "$OUTPUT_FILE" "$LANGUAGE_MAPPING_FILE"

    echo "Successfully updated language mapping with $MAPPING_COUNT entries"
}

# ================================
# Show current versions
# ================================
show_status() {
    echo "--- Current Status ---"
    echo ""

    # Count current WASM files
    if [ -d "$WASM_DIR" ]; then
        CURRENT_WASM=$(find "$WASM_DIR" -name "*.wasm" -type f | wc -l)
        echo "WASM files: $CURRENT_WASM files in $WASM_DIR"
    else
        echo "WASM files: Directory not found"
    fi

    # Count current SCM files
    if [ -d "$SCM_DIR" ]; then
        CURRENT_SCM=$(find "$SCM_DIR" -name "*.scm" -type f | wc -l)
        echo "SCM files:  $CURRENT_SCM files in $SCM_DIR"
    else
        echo "SCM files:  Directory not found"
    fi

    # Check language mapping file
    if [ -f "$LANGUAGE_MAPPING_FILE" ]; then
        MAPPING_COUNT=$(grep -c 'tree-sitter-' "$LANGUAGE_MAPPING_FILE" 2>/dev/null || echo "0")
        echo "Language mappings: $MAPPING_COUNT entries in languageToWasmModule.ts"
    else
        echo "Language mappings: languageToWasmModule.ts not found"
    fi

    # Check source directories
    echo ""
    echo "Source directories:"
    if [ -d "$CURSORLESS_DEV_QUERIES" ]; then
        echo "  cursorless-dev queries: found"
    else
        echo "  cursorless-dev queries: NOT FOUND"
    fi

    if [ -f "$LANGUAGE_MAPPING_FILE" ]; then
        echo "  languageToWasmModule.ts: found"
    else
        echo "  languageToWasmModule.ts: NOT FOUND"
    fi

    # Check latest available version
    echo ""
    echo "Checking Open VSX for latest parse-tree version..."
    LATEST_VERSION=$(curl -sL "$OPEN_VSX_API" | grep -o '"version":"[^"]*"' | head -1 | cut -d'"' -f4)
    if [ -n "$LATEST_VERSION" ]; then
        echo "  Latest available: $LATEST_VERSION"
    else
        echo "  Could not fetch version info"
    fi
}

# ================================
# Main
# ================================
main() {
    case "${1:-all}" in
        wasm)
            update_wasm_files
            ;;
        scm)
            update_scm_files
            ;;
        mapping)
            update_language_mapping
            ;;
        all)
            update_wasm_files
            update_scm_files
            update_language_mapping
            ;;
        status)
            show_status
            ;;
        *)
            echo "Usage: $0 [wasm|scm|mapping|all|status]"
            echo ""
            echo "  wasm    - Update WASM files from pokey.parse-tree extension"
            echo "  scm     - Update SCM query files from cursorless-dev"
            echo "  mapping - Update language mapping in languageToWasmModule.ts"
            echo "  all     - Update all (default)"
            echo "  status  - Show current file counts and check for updates"
            exit 1
            ;;
    esac

    echo ""
    echo "=== Done ==="
}

main "$@"
