# DevWrokbench

A developer utilities application built with Tauri and React, similar to DevToys/DevUtils.

## 🌟 Features (Planned)

- 🔤 **Text Utilities** - Encode/decode, formatting, case conversion
- 📝 **JSON Tools** - Formatter, validator, minifier
- 🆔 **UUID Generator** - Various UUID formats
- 🔐 **Hash Generators** - MD5, SHA-1, SHA-256, etc.
- 📊 **Base64 Tools** - Encoder/decoder for text and files
- 🌐 **URL Tools** - Encoder/decoder, parser
- 🎨 **Color Picker** - Color converter and palette generator
- 🖼️ **Image Tools** - Resize, format conversion, optimization
- 🛠️ **Developer Tools** - More utilities coming soon

## 🚀 Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Rust with Tauri 2.6
- **UI Framework**: Tailwind CSS + Radix UI
- **Package Manager**: npm

## 📦 Installation

### Prerequisites

- Node.js 18+ and npm
- Rust 1.70+
- Platform-specific dependencies for Tauri

### Development

```bash
# Clone the repository
git clone https://github.com/jiayun/DevWrokbench.git
cd DevWrokbench

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

### Build

```bash
# Build for production
npm run tauri build
```

## 🛠️ Development

```bash
# Frontend only development
npm run dev

# Type checking
npx tsc --noEmit

# Format code
cd src-tauri && cargo fmt
```

## 📁 Project Structure

```
DevWrokbench/
├── src/                   # React frontend
│   ├── components/        # UI components
│   ├── lib/               # Utilities
│   └── assets/            # Static assets
├── src-tauri/             # Rust backend
│   ├── src/               # Rust source code
│   └── icons/             # App icons
└── public/                # Public assets
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by [DevToys](https://github.com/veler/DevToys) and DevUtils
- Built with [Tauri](https://tauri.app/) - The secure framework for building desktop apps
- UI components from [Radix UI](https://www.radix-ui.com/)

---

⭐ Star this repo if you find it useful!