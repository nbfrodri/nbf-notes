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
- **Folder Personalization**: Customize folder icons with a **Neon Color Palette** (Magenta, Cyan, Lime, Orange, etc.) for visual distinction.
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

- **Desktop**: `%APPDATA%\nbf-notes` (Wiped on uninstall)
- **Mobile**: App-specific internal storage (Wiped on uninstall)

### File Structure

- **Notes**: Stored as individual `.json` files in the `notes/` directory.
- **Images**:
  - **Desktop**: Stored in the `images/` subdirectory.
  - **Mobile**: Stored directly in the app's root data directory for maximum compatibility.

### 📱 Mobile Storage Strategy

- **Internal Storage**: On Android, data is stored in the app's protected internal storage (`Directory.Data`).
- **Data Persistence**: Files are preserved across app restarts and updates.
- **Uninstall Data Wipe**: Uninstalling the app automatically and securely wipes all stored data (notes and images) from the device, ensuring no residual files are left behind.

### 🧹 Maintenance & Cleanup

To keep your storage optimized:

- **Instant Deletion**: When you delete a note, its JSON file is immediately removed from disk.
- **Image Cleanup**: Deleting a note automatically deletes all associated images referenced within it.
- **Manual Control**: Unlike cloud apps that keep "trash" folders, deletion here is permanent and immediate to respect your storage space.

---

_Happy Note Taking!_ 🚀
