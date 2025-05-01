# Daily Planner App

A modern task planning application built with Next.js and TailwindCSS.

## Setup Instructions

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
# Regular start
npm run dev

# Clean start (clears cache first)
npm run dev:clean
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Memory Management

- The app is configured to use 4GB of memory for better performance
- If you experience any issues:
  - Use `npm run clean` to clear the cache
  - Restart with `npm run dev:clean`

## Features

- Task management with drag-and-drop
- Dark mode support
- Copy/paste tasks
- Time-based task organization
- Responsive design

## Troubleshooting

If you encounter any issues:

1. Clear the cache:
```bash
npm run clean
```

2. Delete node_modules and reinstall:
```bash
rm -rf node_modules
npm install
```

3. Start fresh:
```bash
npm run dev:clean
``` 