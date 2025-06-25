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

## Features to Implement

- [ ] Text utilities (encode/decode, formatting)
- [ ] JSON formatter and validator
- [ ] UUID generator
- [ ] Hash generators (MD5, SHA)
- [ ] Base64 encoder/decoder
- [ ] URL encoder/decoder
- [ ] Color picker and converter
- [ ] Image tools
- [ ] Developer tools collection

## Architecture Notes

- Uses Tauri's command system for Rust-React communication
- Tailwind CSS for styling with Radix UI components
- TypeScript for type safety
- Vite for fast development and building
