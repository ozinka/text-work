#!/bin/bash

# Extension update script
# This script packages the extension, uninstalls the old version, and installs the new one

echo "Starting extension update process..."

# Step 1: Package the extension
echo "📦 Packaging extension..."
vsce package

if [ $? -ne 0 ]; then
    echo "❌ Failed to package extension"
    exit 1
fi

# Step 2: Uninstall existing extension
echo "🗑️  Uninstalling existing extension..."
code --uninstall-extension ozi-dev.ozi-highlighting

# Step 3: Install the new package
echo "⚙️  Installing new extension..."
code --install-extension ozi-highlighting-0.0.1.vsix

if [ $? -eq 0 ]; then
    echo "✅ Extension updated successfully!"
    echo "💡 You may need to reload VS Code to see the changes."
else
    echo "❌ Failed to install extension"
    exit 1
fi