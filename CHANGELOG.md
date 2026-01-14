# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.1] - 2025-01-14

### Added
- JSON Formatter search functionality
  - Search JSON keys and values with real-time highlighting
  - Navigate between matches with Previous/Next buttons
  - Keyboard shortcuts: Cmd/Ctrl+F to open search, Enter for next, Shift+Enter for previous, Esc to close
  - Match counter showing current position (e.g., "3 / 15 matches")
  - Auto-scroll to search results while keeping search panel visible

## [0.4.0] - 2025-01-12

### Added
- OpenAPI Spec Filter feature
  - Load OpenAPI/Swagger JSON spec files
  - Multi-select endpoints with search and tag filtering
  - Automatic $ref dependency tracking (schemas, parameters, responses, etc.)
  - Export filtered spec with Copy and Download options
  - HTTP method color-coded badges (GET=blue, POST=green, PUT=orange, DELETE=red)

## [0.3.4] - 2025-08-29

### Fixed
- JWT Token Tool crash when encoding with invalid JSON payload (issue #1)
  - Added real-time JSON validation with clear error messages
  - Improved error handling to prevent application crashes
  - Added JSON format button for better user experience
  - Disabled encode button when JSON is invalid

## [0.3.3] - 2025-07-07

### Added
- Cron Job Parser feature with comprehensive functionality
  - Parse cron expressions with human-readable descriptions
  - Predict execution times with timezone support
  - Browse comprehensive example collections with category filtering
  - Validate cron syntax with detailed error messages
- Unix Time Converter with timezone support
  - Convert Unix timestamps to human-readable dates
  - Detailed time information including relative time, day/week of year
  - Leap year status and multiple format options
  - Timezone-aware conversions
- Text Utilities feature with Unicode surrogate pair support
  - HTML entities encode/decode
  - Unicode conversion and normalization
  - Case conversion (camelCase, PascalCase, snake_case, kebab-case, CONSTANT_CASE)
  - Text statistics and character analysis

## [0.3.2] - 2025-07-06

### Added
- URL Tools feature with comprehensive URL manipulation capabilities
  - URL encoding/decoding
  - URL structure parsing
  - Query string to JSON conversion
  - URL builder from components

### Fixed
- Google Stitch UI collaboration details in README

## [0.3.1] - 2025-07-02

### Fixed
- JSON Formatter display issues with floating punctuation
- Improved visual layout for better readability

## [0.3.0] - 2025-07-02

### Added
- JWT Token Tool with multiple algorithm support (HS256/384/512, RS256/384/512)
  - Token decoding and validation
  - Token encoding with custom claims
  - Signature verification
  - Algorithm detection

### Changed
- Major UI redesign across all tools
  - Implemented unified design system with consistent layouts
  - Added comprehensive light/dark theme support
  - Improved space utilization and visual hierarchy
  - Standardized button layouts and input fields
- Improved UUID Generator UI design with unified layout
- Enhanced Hash Generator UI alignment

### Fixed
- JSON Formatter trailing comma issue in viewer
- Hash Generator lowercase toggle functionality
- JWT Tool algorithm dropdown and UI consistency

## [0.2.7] - 2025-07-01

### Added
- Multi-line to JSON Array tool improvements
  - Better type detection
  - Enhanced UI design

### Changed
- Optimized space usage by removing descriptions and reducing header padding
- Redesigned Base58 tool to match modern UI layout
- Redesigned Base64 tool with modern UI layout

## [0.2.6] - 2025-06-28

### Added
- Light theme support implementation

### Changed
- Improved UI layout consistency across tools
- Redesigned Number Base Converter UI with reference design styling

## [0.2.5] - 2025-06-28

### Changed
- Refactored UI components with unified design system
- Enhanced dark mode support across all components

## [0.2.4] - 2025-06-26

### Added
- Initial JWT Token Tool implementation with resizable panels

## [0.2.3] - 2025-06-25

### Added
- UUID Generator with support for v1/v3/v4/v5/v7
  - Bulk generation capability
  - UUID validation

## [0.2.2] - 2025-06-24

### Added
- JSON Formatter & Validator
  - Format and beautify JSON
  - Validate JSON syntax
  - Collapsible JSON viewer

## [0.2.1] - 2025-06-23

### Added
- Hash Generator using Rust for high performance
  - Support for MD5, SHA1, SHA256, SHA384, SHA512
  - SHA3 variants (224, 256, 384, 512)
  - Keccak variants

## [0.2.0] - 2025-06-22

### Added
- Multi-line to JSON Array converter
  - Auto-trim functionality
  - Smart type detection

## [0.1.2] - 2025-06-21

### Added
- Base58 String Encode/Decode
  - Bitcoin/IPFS-friendly encoding
  - No confusing characters (0, O, I, l)

## [0.1.1] - 2025-06-20

### Added
- Base64 String Encode/Decode with smart detection

## [0.1.0] - 2025-06-19

### Added
- Initial release with Number Base Converter
  - Convert between binary, octal, decimal, hex
  - Support for custom bases (2-36)
- Basic Tauri + React application structure
- Tailwind CSS + Radix UI component framework

[Unreleased]: https://github.com/jiayun/DevWorkbench/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/jiayun/DevWorkbench/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jiayun/DevWorkbench/compare/v0.3.4...v0.4.0
[0.3.4]: https://github.com/jiayun/DevWorkbench/compare/v0.3.3...v0.3.4
[0.3.3]: https://github.com/jiayun/DevWorkbench/compare/v0.3.2...v0.3.3
[0.3.2]: https://github.com/jiayun/DevWorkbench/compare/v0.3.1...v0.3.2
[0.3.1]: https://github.com/jiayun/DevWorkbench/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/jiayun/DevWorkbench/compare/v0.2.7...v0.3.0
[0.2.7]: https://github.com/jiayun/DevWorkbench/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/jiayun/DevWorkbench/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/jiayun/DevWorkbench/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/jiayun/DevWorkbench/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/jiayun/DevWorkbench/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/jiayun/DevWorkbench/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/jiayun/DevWorkbench/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jiayun/DevWorkbench/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/jiayun/DevWorkbench/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/jiayun/DevWorkbench/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jiayun/DevWorkbench/releases/tag/v0.1.0
