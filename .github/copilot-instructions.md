# Thymestamp Repository Instructions

## Project Overview

Thymestamp is a custom date formatter for writers and journalers, available as both a web application and desktop app. It provides a comprehensive set of date/time tokens for flexible timestamp formatting with locale and timezone support.

**Tech Stack:**
- Frontend: Next.js 15.4.6 with App Router, React 19, TypeScript
- Styling: Tailwind CSS v4, shadcn/ui components
- Desktop: Tauri 2.x (Rust + web frontend)
- Date/Time: date-fns, date-fns-tz, chrono (Rust)
- State: React hooks, Tauri plugin-store
- Icons: Lucide React, Tabler Icons

## Build Instructions

### Prerequisites
- Node.js (for npm commands)
- Rust/Cargo (for Tauri desktop builds)

### Web Development
```bash
# Always run install first
npm install

# Development server (with Turbopack)
npm run dev
# Opens http://localhost:3000

# Production build (exports static files to ./out/)
npm run build

# Linting
npm run lint

# Production preview
npm run start
```

### Desktop Development (Tauri)
```bash
# Development (runs Next.js dev + Tauri)
npm run tauri:dev

# Production build (creates platform-specific installers)
npm run tauri:build
```

**Important Build Notes:**
- Always run `npm install` before any build commands
- Web builds export static files due to `output: 'export'` in next.config.ts
- Tauri builds require Rust toolchain (cargo)
- The tauri.conf.json configures desktop app behavior and sets frontend dist to `../out`
- Build process: Next.js build → static export → Tauri bundles into desktop app

### Validation Steps
1. `npm run lint` - ESLint validation (must pass)
2. `npm run build` - Web build validation
3. Test both web and desktop functionality
4. Verify timestamp formatting across different locales/timezones

## Project Architecture

### Directory Structure
```
/                           # Root contains config files
├── src/                    # Next.js source
│   ├── app/               # App Router pages
│   │   ├── page.tsx       # Main timestamp formatter (685 lines)
│   │   ├── docs/          # Documentation page
│   │   ├── preferences/   # Desktop preferences UI
│   │   └── tray/          # Desktop tray widget UI
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── theme-provider.tsx
│   ├── lib/              # Utilities
│   └── types/            # TypeScript definitions
├── src-tauri/            # Rust desktop backend
│   ├── src/              # Rust source code
│   │   ├── lib.rs        # Main Tauri app setup
│   │   ├── main.rs       # Entry point
│   │   ├── timestamp.rs  # Date formatting logic
│   │   ├── tray.rs       # System tray functionality
│   │   ├── shortcuts.rs  # Global shortcuts
│   │   └── prefs.rs      # Preferences management
│   ├── tauri.conf.json   # Tauri configuration
│   └── Cargo.toml        # Rust dependencies
└── public/               # Static assets
```

### Key Configuration Files
- `package.json` - Dependencies and scripts
- `next.config.ts` - Static export configuration
- `tsconfig.json` - TypeScript configuration
- `eslint.config.mjs` - Linting rules
- `components.json` - shadcn/ui configuration
- `src-tauri/tauri.conf.json` - Desktop app configuration
- `src-tauri/Cargo.toml` - Rust dependencies

### Core Features Architecture
1. **Timestamp Formatting**: Comprehensive token system ({day}, {month}, {time}, etc.)
2. **Web UI**: Single-page React app with input field and live preview
3. **Desktop UI**: Three windows (main widget, preferences, tray) with system tray integration
4. **Cross-platform State**: Shared formatting logic between web and desktop
5. **Preferences**: Persistent storage using Tauri plugin-store

### Desktop-specific Features
- System tray with toggle functionality
- Global shortcut (Cmd+Alt+T on macOS)
- Native clipboard integration via Tauri plugins
- Window management (always-on-top, close-on-blur, transparent, decorationless)
- Preferences persistence across app restarts

### Development Workflow
1. Make changes to React components in `src/`
2. Test web version with `npm run dev`
3. Test desktop version with `npm run tauri:dev`
4. For Rust changes, modify files in `src-tauri/src/`
5. Run `npm run lint` before committing
6. Build both versions for validation

### Important Implementation Details
- Next.js configured for static export (no server-side features)
- Tauri uses web frontend but runs in native desktop container
- Date formatting shared between JS (date-fns) and Rust (chrono) implementations
- Theme system supports dark/light mode with next-themes
- Global state managed through React hooks and Tauri stores
- Desktop preferences stored in platform-specific locations via plugin-store

### Common Patterns
- shadcn/ui components for consistent UI
- Tailwind classes for styling (v4 syntax)
- Tauri invoke API for frontend-backend communication
- Error handling with try/catch and toast notifications
- Responsive design principles for web version
- Native OS integration for desktop features

**Trust these instructions** - only search for additional information if something is unclear or appears incorrect.
