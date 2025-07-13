---
layout: default
title: Installation
---

# Installation Guide

DevWorkbench is available for Windows, macOS, and Linux. Choose your platform below for specific installation instructions.

## 📥 Download Pre-built Binaries

The easiest way to get started is to download the pre-built binaries from our releases page.

<div class="download-section">
  <a href="https://github.com/jiayun/DevWorkbench/releases/latest" class="btn btn-primary btn-large">
    Download Latest Release
  </a>
</div>

### Available Downloads:
- **Windows**: `.msi` installer or `.exe` portable version
- **macOS**: `.dmg` disk image (Universal binary for Intel and Apple Silicon)
- **Linux**: `.AppImage` (universal) or `.deb` package

## 🍎 macOS Installation

### Step 1: Download the DMG file

Download the latest `.dmg` file from the [releases page](https://github.com/jiayun/DevWorkbench/releases).

### Step 2: Install the Application

1. Double-click the downloaded `.dmg` file
2. Drag DevWorkbench.app to your Applications folder
3. Eject the DMG

### Step 3: Handle Security Warnings

Since DevWorkbench is not signed with an Apple Developer certificate, macOS may show a security warning. Here are three ways to resolve this:

#### Option 1: Remove Quarantine Attribute (Recommended)

Open Terminal and run:
```bash
xattr -cr /Applications/DevWorkbench.app
```

#### Option 2: Right-click to Open

1. Right-click (or Control-click) on DevWorkbench.app
2. Select "Open" from the context menu
3. Click "Open" in the dialog that appears

#### Option 3: System Settings

1. Go to **System Settings → Privacy & Security**
2. Find the blocked app notification
3. Click **"Open Anyway"**

## 🪟 Windows Installation

### MSI Installer (Recommended)

1. Download the `.msi` installer from the [releases page](https://github.com/jiayun/DevWorkbench/releases)
2. Double-click the installer
3. Follow the installation wizard
4. DevWorkbench will be available in your Start Menu

### Portable Version

1. Download the `.exe` file
2. Place it in your desired folder
3. Double-click to run (no installation required)

### Windows Defender SmartScreen

If you see a SmartScreen warning:
1. Click "More info"
2. Click "Run anyway"

## 🐧 Linux Installation

### AppImage (Universal)

1. Download the `.AppImage` file
2. Make it executable:
   ```bash
   chmod +x DevWorkbench_*.AppImage
   ```
3. Run the application:
   ```bash
   ./DevWorkbench_*.AppImage
   ```

### Debian/Ubuntu (.deb)

1. Download the `.deb` package
2. Install using dpkg:
   ```bash
   sudo dpkg -i devworkbench_*.deb
   ```
3. If you encounter dependency issues:
   ```bash
   sudo apt-get install -f
   ```

### Desktop Integration

To add DevWorkbench to your application menu:

1. Create a desktop entry:
   ```bash
   nano ~/.local/share/applications/devworkbench.desktop
   ```

2. Add the following content:
   ```ini
   [Desktop Entry]
   Name=DevWorkbench
   Exec=/path/to/DevWorkbench.AppImage
   Icon=/path/to/icon.png
   Type=Application
   Categories=Development;Utility;
   ```

## 🔨 Build from Source

If you prefer to build DevWorkbench from source, follow these instructions.

### Prerequisites

- **Node.js** 18 or higher
- **npm** (comes with Node.js)
- **Rust** 1.70 or higher
- Platform-specific dependencies:
  - **Windows**: Windows Build Tools
  - **macOS**: Xcode Command Line Tools
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libgtk-3-dev`

### Clone the Repository

```bash
git clone https://github.com/jiayun/DevWorkbench.git
cd DevWorkbench
```

### Install Dependencies

```bash
npm install
```

### Development Mode

Run the application in development mode:
```bash
npm run tauri dev
```

### Build for Production

Build the application for your platform:
```bash
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## 🔧 Troubleshooting

### macOS: "App is damaged and can't be opened"

This is a common issue with unsigned apps. Use one of the solutions in the macOS installation section above.

### Linux: Missing Dependencies

If you encounter missing library errors, install the required dependencies:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install libwebkit2gtk-4.1-0 libgtk-3-0

# Fedora
sudo dnf install webkit2gtk4.1 gtk3

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3
```

### Windows: Missing Visual C++ Redistributables

If the application fails to start, install the Visual C++ Redistributables:
- [Download from Microsoft](https://aka.ms/vs/17/release/vc_redist.x64.exe)

## 🆘 Need Help?

If you encounter any issues during installation:

1. Check the [GitHub Issues](https://github.com/jiayun/DevWorkbench/issues) page
2. Create a new issue with:
   - Your operating system and version
   - The error message you're seeing
   - Steps to reproduce the problem

## 🚀 Next Steps

Once installed, check out our [Features](/DevWorkbench/features) page to learn about all the available tools!
