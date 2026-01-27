# NBF Notes 📝

**A Local-First, Fast, and Beautiful Note-Taking Experience.**

![Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Tech](https://img.shields.io/badge/Stack-Electron%20%7C%20React%20%7C%20Capacitor-purple)

**NBF Notes** is a robust cross-platform application designed for speed, privacy, and ease of use. Originally built for desktop, it now fully supports **Mobile (Android)**, serving as a personal knowledge base that lives entirely on your device, whether computer or phone.

---

## 🚀 Why NBF Notes?

- **Local Environment**: Your data never leaves your device. 100% private, 100% offline.
- **Cross-Platform**: Seamless experience on both **Windows** and **Android**.
- **Learning Project**: Built to demonstrate the integration of modern web technologies (React/Vite) with desktop wrappers (Electron) and mobile runtimes (Capacitor).
- **Human-in-the-Loop AI**: Developed using advanced AI agents collaborating with human oversight to implement complex features like gesture navigation and rich text editing.

---

## ✨ Key Features

### 🖋️ Rich Text Editor (Mobile Optimized)

A powerful writing experience powered by **TipTap**, now fully responsive:

- **Custom Styling**: Change **text colors**, adjust **font sizes**, and control **line height** (interlineado) with precision.
- **Mobile Toolbar**: Smartly grouped tools that fit perfectly on small screens without clutter.
- **Developer Friendly**: Toggle **Line Numbers** for code-like readability.
- **Smart Links**: Auto-linking and easy URL management.
- **Typography**: Headings, lists, bold, italic, **blockquotes**, **code blocks**, and more.

### 📂 Smart Organization

- **Folders**: Create folders to organize your notes.
- **Drag & Drop Reordering**: Long-press and drag to reorder notes, folders, tasks, and images on both desktop and mobile.
- **Drag to Move**: Drag notes into folders to file them away.

### ✅ Advanced Checklists

Stay organized with a task manager that goes beyond simple checkboxes:

- **Drag & Drop**: Reorder your tasks intuitively using **@dnd-kit** (works with touch!).
- **Deep Details**: Expand any task to add a detailed **description**.
- **Subtasks**: Break down complex items into manageable sub-steps.

### 🖼️ Image Collections & Gestures

- **Visual Notes**: Create dedicated folders for your images.
- **Swipe Navigation**: On mobile, simple **swipe left/right** gestures let you browse your gallery effortlessly.
- **Drag Reordering**: Organize your image collections by dragging images to new positions.
- **Native Storage**: Uses your device's native file system for efficient storage.

### 🎨 Neon Glass Fusion UI

- **Aesthetic**: A high-fidelity **"Neon Glass Fusion"** design featuring a deep midnight navy background, floating glassmorphic panels, and vibrant neon accents (Cyan/Magenta).
- **Responsive Glass**: Translucent components that adapt beautifully to any screen size, featuring real-time background blur and glowing borders.
- **Smooth Interactions**: Enhanced drag-and-drop mechanics with fluid transitions and visual feedback (`transition-colors` optimizations).
- **Mobile Optimized**: Sidebar allows swipe gestures, and modals are designed for touch with specific "safe area" handling.
- **Premium Feel**: Custom scrollbars, glowing typography, and a cohesive dark-first experience.

---

## 🛠️ Tech Stack

This project leverages the latest ecosystem tools for maximum performance:

- **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Desktop**: [Electron](https://www.electronjs.org/)
- **Mobile**: [Capacitor](https://capacitorjs.com/) (Android)
- **Build**: [Vite](https://vitejs.dev/) (Super fast HMR and bundling)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **Iconography**: [Lucide React](https://lucide.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) + File System persistence
- **Rich Text**: [TipTap](https://tiptap.dev/) + Extensions

---

## 📦 Getting Started

### Prerequisites

- Node.js (Latest LTS)
- Android Studio (for Mobile builds)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/nbfrodri/proton-notes.git
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

### Running Locally

#### 🖥️ Desktop (Development)

```bash
npm run electron:dev
```

#### 📱 Mobile (Android)

```bash
# First, build the web assets
npm run build
# Sync with Android project
npx cap sync
# Open in Android Studio to run
npx cap open android
```

### Build for Release

#### Windows Installer (.exe)

```bash
npm run dist
```

_Generates an installer in the `release` folder._

#### Android APK

Build via Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

---

## 💾 Data Storage & Privacy

Your privacy is paramount. **NBF Notes** stores all data locally on your device using a transparent file structure:

- **Desktop**: `%APPDATA%\nbf-notes`
- **Mobile**: App-specific internal storage

### File Structure

- **Notes**: Stored as individual `.json` files in the `notes/` directory.
- **Images**: Stored as standard image files in the `images/` directory.

### 🧹 Automatic Cleanup

To keep your device clean, the app performs intelligent maintenance:

- **Instant Deletion**: When you delete a note, its file is immediately removed.
- **Image Cleanup**: Deleting a note automatically deletes all its associated images.
- **Orphan Removal**: On every startup, the app scans for "orphan" images (files not referenced by any note) and safely removes them to free up space.

---

_Happy Note Taking!_ 🚀
