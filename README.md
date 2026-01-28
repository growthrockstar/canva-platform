# Growth Rockstar Canvas (Local-First Edition)

This is a local-first web application for Growth Rockstar students to build their strategy portfolios.

## Tech Stack
- **Framework:** React + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand (with LocalStorage persistence)
- **Drag & Drop:** @dnd-kit

## Features
- **Zero Login:** No backend, no database. Everything is stored in your browser.
- **Widgets:** Rich Text, Accordions, Images (Base64), Dynamic Tables.
- **Export:** Save as `.gr` (JSON) or Export to PDF (Native Print).
- **Theme:** Custom "Rockstar" Dark Mode.

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Project Structure
- `src/store`: Zustand store and persistence logic.
- `src/components/canvas`: Core canvas components (Section, WidgetRenderer).
- `src/components/canvas/widgets`: Individual widget implementations.
- `src/types`: TypeScript definitions.
