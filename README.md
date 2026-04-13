# TTC Rubengera Frontend (React + Vite)

Beginner-friendly React project with routing and translations.

## Run the project

```bash
npm install
npm run dev
```

## Build the project

```bash
npm run build
```

## Project structure

- `index.html`: app shell + CDN setup (Tailwind, Font Awesome, Google Fonts)
- `src/main.jsx`: React entry point
- `src/App.jsx`: main pages and routes
- `src/Components/LanguageSwitcher.jsx`: language switch dropdown
- `src/i18n.js`: i18next configuration
- `src/locales/`: translation files (`en`, `fr`, `rw`, `sw`)
- `src/index.css` and `src/App.css`: global and app styles

## Notes for beginners

- Start editing UI from `src/App.jsx`.
- If you add a new component, place it in `src/Components/` and import it where needed.
- Keep only files that are used by imports to avoid confusion.
