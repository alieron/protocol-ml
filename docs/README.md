# Protocol-ML Demo

Interactive demo for the protocol-ml diagram renderer.

## Development

To run the demo in development mode:

```bash
npm run dev:docs
```

This starts a dev server that watches for changes in both the demo HTML and the source TypeScript files.

## Building for GitHub Pages

Build the production version:

```bash
npm run build:docs
```

This creates a self-contained `docs/dist/index.html` with all JavaScript bundled and minified.

## GitHub Pages Setup

1. Build the demo: `npm run build:docs`
2. Commit the generated `docs/dist/` folder
3. Push to GitHub
4. Go to repository Settings → Pages
5. Set source to "Deploy from a branch"
6. Select branch: `dev` (or your main branch)
7. Set folder to: `/docs/dist`
8. Click Save

Your demo will be available at: `https://<username>.github.io/<repository>/`

## Demo Features

- **Live Editor**: Edit protocol markup code in real-time
- **Instant Preview**: SVG diagram updates automatically
- **Copy Buttons**: Copy both the code and generated SVG
- **Responsive Layout**: Works on desktop and mobile
