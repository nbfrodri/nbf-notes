# NBF Notes 📝

**A Local-First, Fast, and Beautiful Note-Taking Experience.**

![Banner](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Tech](https://img.shields.io/badge/Built%20With-Electron%20%2B%20React-purple)

**NBF Notes** is a robust desktop application designed for speed, privacy, and ease of use. Created as an educational project to explore modern desktop development, it serves as a fully functional personal knowledge base that lives entirely on your machine.

---

## 🚀 Why NBF Notes?

- **Local Environment**: Your data never leaves your computer. 100% private, 100% offline.
- **Learning Project**: Built to demonstrate the power of integrating modern web technologies (React/Vite) with desktop wrappers (Electron).
- **Human-in-the-Loop AI**: Developed using advanced AI agents collaborating with human oversight to implement complex features like drag-and-drop lists and rich text editing.

---

## ✨ Key Features

### 🖋️ Rich Text Editor

A powerful writing experience powered by **TipTap**:

- **Custom Styling**: Change **text colors**, adjust **font sizes**, and control **line height** (interlineado) with precision.
- **Developer Friendly**: Toggle **Line Numbers** for code-like readability.
- **Smart Links**: Auto-linking and easy URL management.
- **Typography**: Headings, lists, bold, italic, and more.

### ✅ Advanced Checklists

Stay organized with a task manager that goes beyond simple checkboxes:

- **Drag & Drop**: Reorder your tasks intuitively using **@dnd-kit**.
- **Deep Details**: Expand any task to add a detailed **description**.
- **Subtasks**: Break down complex items into manageable sub-steps.

### 🖼️ Image Collections

- **Visual Notes**: Create dedicated folders for your images.
- **Gallery Mode**: View images in full screen with keyboard navigation.

### 🎨 Modern UI

- **Sleek Sidebar**: Gradient titles and intuitive navigation.
- **Dark Mode**: Built with a "dark-first" aesthetic using **TailwindCSS**.
- **Distraction Free**: No clutter, just your notes.

---

## 🛠️ Tech Stack

This project leverages the latest ecosystem tools for maximum performance:

- **Core**: [Electron](https://www.electronjs.org/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build**: [Vite](https://vitejs.dev/) (Super fast HMR and bundling)
- **Styling**: [TailwindCSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) + LocalStorage persistence
- **Rich Text**: [TipTap](https://tiptap.dev/) + Extensions (Color, TextStyle, Link)
- **Drag & Drop**: [dnd-kit](https://dndkit.com/)

---

## 🤖 Built with AI

NBF Notes represents a new era of software development: **AI-Assisted Engineering**.

- **Role of AI**: Handled boilerplate, complex logic implementation (DnD, Editor extensions), and bug fixing.
- **Human Role**: Architecture decisions, design direction, verification, and "Human-in-the-Loop" guidance.

---

## 📦 Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/nbfrodri/proton-notes.git
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Run Locally (Dev Mode)**

   ```bash
   npm run electron:dev
   ```

4. **Build for Production**
   ```bash
   npm run dist
   ```
   _Generates an installer in the `release` folder._

---

## 💾 Data Storage

Your privacy is paramount. **NBF Notes** stores all data locally on your device:

- **Location**: Your notes are saved in the application's secure Local Storage.
- **Path (Windows)**: Typically located at `%APPDATA%\nbf-notes` (e.g., `C:\Users\You\AppData\Roaming\nbf-notes`).
- **Backup**: Since data is local, you can easily back up this folder or export your notes (feature coming soon!).

---

_Happy Note Taking!_ 🚀
