# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HireScore AI is an AI-powered CV/resume screening application built with React 19, TypeScript, and Vite. It allows recruiters to upload job descriptions and CVs, then uses AI to score and rank candidates based on job requirements.

## Development Commands

```bash
# Start development server (runs on port 3000, auto-opens browser)
bun run dev

# Type-check and build for production
bun run build

# Run ESLint
bun run lint

# Preview production build
bun run preview
```

## Architecture

### Tech Stack
- **React 19** with TypeScript
- **Vite 7** with @vitejs/plugin-react
- **Tailwind CSS 4** via @tailwindcss/vite plugin
- **Zustand** for state management with persist middleware
- **Framer Motion** for animations
- **Lucide React** for icons
- **Recharts** for data visualization

### State Management

Global state is managed by Zustand in `src/store/useStore.ts`. The store handles:
- Navigation between screens
- Job descriptions (current and saved)
- CV uploads
- Screening sessions and candidate results
- AI provider configuration (with encrypted API key storage)

Access state with: `useStore((s) => s.propertyName)`

### Screen-Based Navigation

The app uses a custom screen-based navigation pattern (not React Router despite the dependency). Screens are defined as a union type and rendered via switch statement in `App.tsx`:
- `landing` - Marketing landing page
- `job` - Job description input
- `upload` - CV upload interface
- `screening` - AI processing view
- `results` - Candidate rankings and details
- `settings` - AI provider configuration

Navigate with: `useStore((s) => s.setScreen)('screenName')`

### Component Structure

```
src/
├── components/
│   ├── screens/     # Full-page screen components
│   │   └── index.ts # Barrel exports
│   └── ui/          # Reusable UI components (Button, Card, Input)
│       └── index.ts # Barrel exports
├── store/
│   └── useStore.ts  # Zustand store with persistence
├── types/
│   └── index.ts     # TypeScript type definitions
├── App.tsx          # Main app with screen routing
└── main.tsx         # Entry point
```

### Key Types

Core types are in `src/types/index.ts`:
- `Screen` - Navigation screen names
- `AIConfig` - AI provider settings (supports OpenAI, Anthropic, OpenRouter, custom)
- `JobDescription` - Job posting data
- `Candidate` - Scored candidate with skills analysis
- `ScreeningSession` - Batch processing state

### UI Conventions

- Dark theme using custom color tokens (void, graphite, steel, snow, cyan, coral, etc.)
- Motion variants using Framer Motion for page transitions and interactions
- Responsive design with mobile-first approach
- Glass-morphism effects with backdrop blur

### Custom Tailwind Colors

The app uses custom color names defined in CSS (not tailwind.config):
- `void` - Deep black background
- `graphite`, `slate`, `steel` - Gray tones
- `silver`, `cloud`, `snow` - Light text colors
- `cyan`, `coral`, `violet`, `amber`, `emerald` - Accent colors
