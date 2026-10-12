# Voca — Japanese Vocabulary Trainer (N4)

A lesson-based Japanese vocabulary practice app designed for Bengali-speaking learners.

## Use the web version

Open: https://j-baki.github.io/Japanese_N4_vocabulary_App/

Your quiz progress and mistake memory are stored in the browser on the device you use. They are not automatically shared between your local copy and the hosted website, or between different browsers/devices.

## Run locally on Windows

### Easy way

1. Install the current Node.js LTS version from https://nodejs.org/ (npm is included).
2. Download this repository using **Code → Download ZIP**, then extract the ZIP.
3. Double-click `run-local.bat`.
4. On the first run, the script installs the project dependencies. It then starts Voca and opens it in your browser.
5. Keep the Command Prompt window open while using Voca. Close that window to stop the local server.

### Manual way

1. Install Node.js LTS from https://nodejs.org/.
2. Open Command Prompt in the project folder.
3. Run:

   ```bash
   npm install
   npm run dev
   ```

4. Open the local address printed by Vite (usually http://localhost:5173/).

## Build the production website locally

```bash
npm install
npm run build
npm run preview
```

The GitHub Actions workflow builds the Vite app and deploys the `dist/` folder to GitHub Pages whenever code is pushed to `main`.

## Tech

React, TypeScript, Vite, and Tailwind CSS.
