"use client";

import React from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Section } from "./canvas/Section";
import { cn } from "@/lib/utils";

export const Canvas: React.FC = () => {
  const {
    syllabus_sections,
    isExporting,
    meta,
    isAuthenticated,
    encryptionPassword,
    isSyncing,
    lastSyncedAt,
    syncError,
    loadCanvas,
    fetchSections,
  } = useCanvasStore();
  const cols = meta.grid_columns || 1;

  React.useEffect(() => {
    fetchSections();
    // If we have a password, we can sync.
    // If not, we are likely offline or just logged in.
    if (encryptionPassword) {
      loadCanvas();
    }
  }, [encryptionPassword]);

  return (
    <div
      id="main-canvas-container"
      className={cn(
        "mx-auto py-12 px-6 pb-32 bg-[var(--color-background)] transition-all duration-300",
        cols === 1 ? "max-w-4xl" : "max-w-[1400px]", // Wider container for grid
        isExporting && "pb-12 max-w-4xl", // Enforce width on export for consistency? Or allow grid export? Let's default to standard width for PDF unless grid is desired.
      )}
    >
      {/* Sync Status Indicator */}
      {!isExporting && isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs shadow-xl">
          <>
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                isSyncing
                  ? "bg-blue-500 animate-pulse"
                  : syncError
                    ? "bg-red-500"
                    : "bg-green-500",
              )}
            />
            <span className="text-zinc-400">
              {isSyncing
                ? "Syncing..."
                : syncError
                  ? "Sync Error"
                  : lastSyncedAt
                    ? "Saved"
                    : "Local"}
            </span>
          </>
        </div>
      )}

      {/* Export Header with Logo */}
      <div className={cn("hidden mb-8 text-center", isExporting && "block")}>
        <img
          src="/LOGOGROWTH.png"
          alt="Growth Rockstar"
          className="h-16 mx-auto mb-4"
        />
        <h1 className="text-3xl font-title font-bold text-[var(--color-primary)]">
          GROWTH CANVAS
        </h1>
        <p className="text-sm text-[var(--color-text)] opacity-70 uppercase tracking-widest mt-2">
          Strategy Portfolio
        </p>
      </div>

      <div
        className={cn(
          "grid gap-8",
          isExporting
            ? "grid-cols-1"
            : {
                // Force 1 column for PDF export usually safer, but user might want grid. Let's respect user choice if they asked for grid. BUT PDF usually implies A4 portrait sequence.
                "grid-cols-1": cols === 1,
                "grid-cols-1 md:grid-cols-2": cols === 2,
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3": cols === 3,
              },
        )}
      >
        {syllabus_sections.map((section, index) => (
          <div key={section.id} className="min-w-0">
            {" "}
            {/* Wrapper to prevent grid blowout */}
            <Section section={section} index={index} />
          </div>
        ))}
      </div>

      <footer
        className={cn(
          "text-center text-white/20 mt-20",
          isExporting ? "hidden" : "print:hidden",
        )}
      >
        <p className="text-sm">Growth Rockstar Canvas</p>
      </footer>
    </div>
  );
};
