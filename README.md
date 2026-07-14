# System Master - Desktop System Utility

A modern, beautiful desktop app for managing your Windows system - unlock files, manage processes, edit the registry, and troubleshoot networks!

## 🚀 How to Run

### Step 1: Install Dependencies
First, open your terminal in the project folder and run:
```bash
npm install
```

### Step 2: Compile Electron TypeScript
Next, compile the Electron backend:
```bash
npx tsc -p tsconfig.electron.json
```

### Step 3: Start the Vite Dev Server (for React UI)
Start the Vite dev server (this runs in one terminal):
```bash
npx vite
```
> Note: If port 3000 is busy, it will use another port like 3001. Make sure `electron/main.ts` is using that port!

### Step 4: Launch Electron
Open another terminal in the same project folder and run:
```bash
npx electron .
```

That's it! Your app window should open!

## 📝 Features

- **Dashboard** - Quick overview of system info
- **File Unlocker** - Unlock and delete stubborn files
- **Process Manager** - View and terminate running processes
- **Services** - Manage Windows services
- **Registry Editor** - Browse and edit the Windows Registry
- **Network & Connectivity** - Ping, ipconfig, flush DNS, reset network, and more!

## 🛠️ Build for Production

To create a production build:
```bash
npm run build
```

Or build a Windows package:
```bash
npm run build:win
```

## 📁 Project Structure

```
.
├── electron/          # Electron backend (main and preload)
│   ├── main.ts        # Main process (IPC handlers, window management)
│   └── preload.ts     # Preload script (exposes APIs to renderer)
├── src/               # React frontend
│   ├── components/    # Reusable React components
│   ├── pages/         # App pages (Dashboard, Unlocker, Network, etc.)
│   ├── types/         # TypeScript type definitions
│   ├── App.tsx        # Main app component
│   ├── main.tsx       # React entry point
│   └── index.css      # Global styles and Tailwind
├── index.html         # HTML template
├── vite.config.ts     # Vite configuration
├── tailwind.config.cjs# Tailwind configuration
├── tsconfig.json      # React TypeScript config
├── tsconfig.electron.json # Electron TypeScript config
└── package.json       # Project dependencies and scripts
```

## 💡 Dev Tips

- **Hot Reload** - When you edit React files, the UI updates automatically!
- **Electron Changes** - If you edit electron/main.ts or electron/preload.ts, re-run:
  ```bash
  npx tsc -p tsconfig.electron.json
  ```
  then close and re-open Electron:
  ```bash
  npx electron .
  ```



# node version 20.19.6