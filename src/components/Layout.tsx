import React from "react";
import { Menu, X } from "lucide-react";

interface LayoutProps {
  sidebar: React.ReactNode;
  content: React.ReactNode;
  isSidebarOpen: boolean;
  onSidebarChange: (isOpen: boolean) => void;
}

export const Layout: React.FC<LayoutProps> = ({
  sidebar,
  content,
  isSidebarOpen,
  onSidebarChange,
}) => {
  return (
    <div className="flex h-screen w-screen bg-transparent text-slate-100 overflow-hidden relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => onSidebarChange(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed z-50 flex flex-col transition-all duration-300 ease-in-out border-r border-white/10
          md:relative md:inset-auto md:top-0 md:left-0 md:transform-none md:w-64 md:h-full md:shadow-none md:opacity-100 md:pointer-events-auto md:translate-x-0 md:translate-y-0
          glass-panel
          ${
            isSidebarOpen
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm h-[80%] rounded-2xl bg-slate-950/80"
              : "top-1/2 left-1/2 -translate-x-[200%] -translate-y-1/2 w-[90%] h-[80%] opacity-0 pointer-events-none md:bg-transparent md:opacity-100 md:pointer-events-auto"
          }
        `}
      >
        {/* Mobile Close Button */}
        {sidebar}

        {/* Mobile Close Button */}
        <button
          onClick={() => onSidebarChange(false)}
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 z-50 p-2 text-slate-400 hover:text-white md:hidden bg-slate-900/50 rounded-full backdrop-blur-sm"
          style={
            { WebkitAppRegion: "no-drag" } as unknown as React.CSSProperties
          }
        >
          <X size={20} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-transparent relative w-full h-full overflow-hidden">
        {/* Drag region for Electron title bar - Desktop & Mobile */}
        <div
          className="min-h-10 md:h-8 w-full select-none flex items-center px-4 md:px-0 shrink-0 pt-[env(safe-area-inset-top)] pb-2 md:pb-0 md:pt-0"
          style={{ WebkitAppRegion: "drag" } as unknown as React.CSSProperties}
        >
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => onSidebarChange(true)}
            className="text-cyan-400 hover:text-white md:hidden mr-4"
            style={
              { WebkitAppRegion: "no-drag" } as unknown as React.CSSProperties
            }
          >
            <Menu size={28} />
          </button>
        </div>

        <div className="flex-1 overflow-auto w-full">{content}</div>
      </main>
    </div>
  );
};
