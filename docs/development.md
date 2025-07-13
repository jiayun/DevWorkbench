---
layout: default
title: Development
---

# Development Guide

Welcome to the DevWorkbench development guide! This page contains everything you need to know about contributing to the project.

## 🤖 The AI-First Development Story

DevWorkbench is unique in that it's a **100% AI-generated application**. Every line of code, configuration, and documentation was created through natural language conversations with AI assistants:

- **Code Generation**: Claude Code (Anthropic)
- **UI Design**: Google Stitch
- **Development Workflow**: Vibe Coding methodology

This project demonstrates the potential of AI-assisted development in creating production-ready applications.

## 🏗️ Architecture Overview

DevWorkbench is built with a modern tech stack optimized for performance and developer experience:

### Frontend (React + TypeScript)
```
src/
├── components/          # React components for each tool
│   ├── Base64EncoderDecoder.tsx
│   ├── HashGenerator.tsx
│   └── ...
├── lib/                 # Utility functions
├── contexts/           # React contexts (theme, etc.)
└── main.tsx           # Application entry point
```

### Backend (Rust + Tauri)
```
src-tauri/
├── src/
│   ├── main.rs        # Tauri application setup
│   ├── lib.rs         # Command definitions
│   └── *.rs           # Feature-specific modules
└── tauri.conf.json    # Tauri configuration
```

## 🛠️ Development Setup

### Prerequisites

1. **Node.js** (v18 or higher)
   ```bash
   node --version  # Should output v18.x.x or higher
   ```

2. **Rust** (v1.70 or higher)
   ```bash
   rustc --version  # Should output 1.70.0 or higher
   ```

3. **Platform-specific dependencies**:
   - **macOS**: Xcode Command Line Tools
   - **Linux**: `libwebkit2gtk-4.1-dev`, `libssl-dev`, `libgtk-3-dev`
   - **Windows**: Windows Build Tools

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/jiayun/DevWorkbench.git
   cd DevWorkbench
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run tauri dev
   ```

## 📝 Development Workflow

### Adding a New Tool

1. **Create the React component**
   ```tsx
   // src/components/YourNewTool.tsx
   import React from 'react';
   
   export function YourNewTool() {
     return (
       <div className="tool-container">
         {/* Your tool implementation */}
       </div>
     );
   }
   ```

2. **Add Rust backend (if needed)**
   ```rust
   // src-tauri/src/your_tool.rs
   #[tauri::command]
   pub fn your_tool_function(input: String) -> Result<String, String> {
       // Implementation
       Ok(result)
   }
   ```

3. **Register the command**
   ```rust
   // src-tauri/src/main.rs
   tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![
           your_tool_function,
           // ... other commands
       ])
   ```

4. **Add to the main app**
   ```tsx
   // src/App.tsx
   import { YourNewTool } from './components/YourNewTool';
   
   // Add to the tools array
   ```

### Code Style Guidelines

- **TypeScript**: Strict mode enabled, all types must be explicit
- **React**: Functional components with hooks
- **Rust**: Follow standard Rust conventions, use `cargo fmt`
- **CSS**: Tailwind CSS utility classes, custom styles in component files

### Testing

```bash
# Run TypeScript type checking
npx tsc --noEmit

# Format Rust code
cd src-tauri && cargo fmt

# Run Rust tests
cd src-tauri && cargo test
```

## 🚀 Building for Production

### Build Commands

```bash
# Build for current platform
npm run tauri build

# The output will be in:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/appimage/
```

### Release Process

1. **Update version numbers**
   - `package.json`
   - `src-tauri/tauri.conf.json`
   - `src-tauri/Cargo.toml`

2. **Update CHANGELOG.md**
   ```markdown
   ## [X.X.X] - YYYY-MM-DD
   ### Added
   - New features
   ### Changed
   - Updates
   ### Fixed
   - Bug fixes
   ```

3. **Run pre-release check**
   ```bash
   npm run pre-release-check
   ```

4. **Create git tag**
   ```bash
   git tag -a v0.x.x -m "Release version 0.x.x"
   git push origin v0.x.x
   ```

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

### Contribution Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
   - Follow the code style guidelines
   - Add tests if applicable
   - Update documentation

4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

6. **Open a Pull Request**

### What We're Looking For

- 🐛 Bug fixes
- ✨ New developer tools
- 🎨 UI/UX improvements
- 📚 Documentation updates
- 🌐 Internationalization
- ⚡ Performance optimizations

### Code Review Process

1. All PRs require at least one review
2. CI must pass (TypeScript compilation, tests)
3. Follow the existing code patterns
4. Update relevant documentation

## 📚 Resources

### Documentation
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Rust Book](https://doc.rust-lang.org/book/)

### Tools
- [VS Code](https://code.visualstudio.com/) with Rust and TypeScript extensions
- [Rust Analyzer](https://rust-analyzer.github.io/)
- [Tauri VS Code Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)

## 🐛 Debugging

### Frontend Debugging
- Open DevTools: Right-click in the app and select "Inspect Element"
- Use React Developer Tools browser extension

### Backend Debugging
- Use `println!()` for basic debugging
- Check the console where you ran `npm run tauri dev`
- Use `RUST_BACKTRACE=1` for detailed error traces

### Common Issues

**Build fails with TypeScript errors**
```bash
npx tsc --noEmit  # Check for type errors
```

**Rust compilation errors**
```bash
cd src-tauri
cargo clean
cargo build
```

**Missing system dependencies**
- Check the platform-specific requirements in the Prerequisites section

## 💡 Tips for AI-Assisted Development

Since this project was built entirely with AI, here are tips for continuing that approach:

1. **Be specific** in your prompts
2. **Provide context** about existing code patterns
3. **Iterate** on the generated code
4. **Review** all generated code carefully
5. **Test** thoroughly before committing

## 🎯 Future Roadmap

Planned features and improvements:

- [ ] Plugin system for custom tools
- [ ] Cloud sync for settings
- [ ] More encoding/decoding tools
- [ ] Advanced text processing
- [ ] API testing tools
- [ ] Database utilities

## 📞 Get Help

- **Issues**: [GitHub Issues](https://github.com/jiayun/DevWorkbench/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jiayun/DevWorkbench/discussions)
- **Security**: Report security issues privately via GitHub Security tab

Happy coding! 🚀
