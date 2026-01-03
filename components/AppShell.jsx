"use client";
import { motion } from "framer-motion";
import Button from "./ui/Button";

export default function AppShell({ title, right, sidebar, children }) {
  const hasSidebar = Boolean(sidebar);
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex">
      {hasSidebar && (
        <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-neutral-800 bg-neutral-950">
          <div className="h-16 border-b border-neutral-800 flex items-center px-4 font-semibold">LocalChat</div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">{sidebar}</div>
          <div className="p-3 border-t border-neutral-800 text-xs text-neutral-500">v1.0</div>
        </aside>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-4 sticky top-0 bg-neutral-950/80 backdrop-blur">
          <div className="font-semibold">{title}</div>
          <div className="flex items-center gap-2">{right}</div>
        </header>
        <motion.main
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="p-4 md:p-6 lg:p-8 space-y-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
