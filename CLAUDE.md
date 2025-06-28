# DevWorkbench

DevWorkbench is a developer utilities application built with Tauri and React, similar to DevToys/DevUtils.

## Project Structure

```
DevWorkbench/
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── lib/               # Utilities
│   └── assets/            # Static assets
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── icons/             # App icons
└── public/                # Public assets
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust with Tauri 2.6
- **UI Framework**: Tailwind CSS + Radix UI
- **Package Manager**: npm

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run tauri dev

# Build for production
npm run tauri build

# Frontend only development
npm run dev

# Type checking
npx tsc --noEmit
```

## Implemented Features

- [x] **Number Base Converter** - Convert between binary, octal, decimal, hex, and custom bases
- [x] **Base64 String Encode/Decode** - Encode/decode text using Base64 with smart detection
- [x] **Base58 String Encode/Decode** - Bitcoin/IPFS-friendly encoding without confusing characters
- [x] **Multi-line to JSON Array** - Convert multi-line text to JSON array with auto-trim and smart type detection
- [x] **Hash Generator** - Generate MD5/SHA1/SHA2/SHA3/Keccak hashes using Rust for high performance

## Features to Implement

- [ ] JSON formatter and validator
- [ ] UUID generator
- [ ] Hash generators (MD5, SHA)
- [ ] URL encoder/decoder
- [ ] Text utilities (HTML entities, Unicode)
- [ ] Color picker and converter
- [ ] Image tools
- [ ] Developer tools collection

## Architecture Notes

- Uses Tauri's command system for Rust-React communication
- Tailwind CSS for styling with Radix UI components
- TypeScript for type safety
- Vite for fast development and building

## Development Guidelines

### Version Management
- **CRITICAL**: Always sync version numbers before creating releases
- Update both `package.json` and `src-tauri/tauri.conf.json` to match git tag
- Tauri uses these version numbers for build artifact filenames
- Example: v0.2.2 tag requires "version": "0.2.2" in both files

### TypeScript Best Practices
- Run `npx tsc --noEmit` before commits to catch type errors
- Remove unused imports to prevent TS6133 errors in CI
- Strict mode enabled - all imports must be used

### GitHub Actions & CI/CD
- Multi-platform builds: macOS (Intel + ARM64), Windows, Linux
- Artifacts are uploaded with version-specific filenames
- Build failures often due to TypeScript errors or version mismatches
- Use `shell: bash` for cross-platform compatibility in workflows

### Release Process
1. Update features in CLAUDE.md
2. Sync version numbers in package.json and tauri.conf.json
3. Create git tag matching the version numbers
4. GitHub Actions automatically builds and creates release
5. Verify artifact filenames include correct version numbers

### Component Development Patterns
- Each tool is a separate component in `src/components/`
- Follow existing patterns from NumberBaseConverter for consistency
- Include smart detection, mode switching, and error handling
- Maintain unified UI design with consistent button layouts
- Support clipboard operations and sample data generation

### Icon and Asset Management
- Icons stored in `src-tauri/icons/` directory
- Generate all required formats: PNG (multiple sizes), ICO, ICNS
- Use Tauri's standard icon naming conventions
- Remove unnecessary platform-specific icons to reduce bloat
