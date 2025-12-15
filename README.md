# TypeFlow

<div align="center">

**Developer Typing Trainer**

A lightweight, widget-first typing practice application for developers to master technical terms and code snippets during build times and idle moments.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://opensource.org/licenses/AGPL-3.0)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)

[日本語版はこちら](docs/README-ja.md)

</div>

---

## ✨ Features

- **🎯 Widget-First Design**: Works perfectly even in ultra-compact windows (150px height)
- **📚 Custom Word Management**: Add your own technical terms, code snippets, or any Japanese text
- **🤖 Auto-Processing**: Automatic hiragana and romaji generation using `wanakana`
- **⏱️ Time Attack Mode**: Survival-style typing with adaptive time limits
- **📊 Weakness Tracking**: Focus on words you struggle with using SRS (Spaced Repetition System)
- **📈 Analytics**: Real-time WPM, accuracy, and detailed keystroke statistics
- **🌐 i18n Support**: English and Japanese interface
- **💾 Local-First**: All data stored in browser IndexedDB - no server, no login required
- **⌨️ Keyboard Shortcuts**: Full keyboard navigation for power users

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (or Bun)
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone https://github.com/otomatty/typeflow.git
cd typeflow

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
# or
bun run build
```

The built files will be in the `dist` directory.

## 📖 Usage

1. **Add Words**: Click "Words" in the header or press `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) to add new words
2. **Start Game**: Press `Space` or `Enter` on the menu screen to begin
3. **Type**: Type the romaji for the displayed Japanese text. Correct answers restore time!
4. **Review**: After game over, press `R` to retry weak words, or `Enter` to restart

### Keyboard Shortcuts

- `Space` / `Enter`: Start game (menu screen)
- `Esc`: Exit game / Return to menu
- `R`: Retry weak words (game over screen)
- `Cmd+K` / `Ctrl+K`: Open add word dialog
- `Enter`: Confirm dialogs
- `Esc`: Close dialogs

## 🛠️ Tech Stack

- **Framework**: React 19 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Japanese Processing**: wanakana
- **Storage**: @github/spark (useKV) for IndexedDB
- **i18n**: i18next

## 📁 Project Structure

```
typeflow/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and types
│   ├── i18n/           # Internationalization
│   └── styles/         # Global styles
├── docs/               # Documentation
├── public/             # Static assets
└── dist/               # Build output
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests (if available): `npm test`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📝 License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

See [LICENSE](LICENSE) for details.

**Important**: If you modify this software and make it available as a web service, you must provide the source code under the same license.

## 🔒 Security

If you discover a security vulnerability, please send an email to the maintainer. See [SECURITY.md](SECURITY.md) for details.

## 🙏 Acknowledgments

- [wanakana](https://github.com/WaniKani/wana-kana) for Japanese text processing
- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Framer Motion](https://www.framer.com/motion/) for smooth animations

## 📧 Contact

- **Repository**: [otomatty/typeflow](https://github.com/otomatty/typeflow)
- **Issues**: [GitHub Issues](https://github.com/otomatty/typeflow/issues)

---

<div align="center">

Made with ❤️ for developers who want to type faster

</div>

