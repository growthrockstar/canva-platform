"use client";

import React from "react";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import { Section } from "./canvas/Section";
import { cn } from "@/public/lib/utils";

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
    focusedSectionId,
  } = useCanvasStore();

  // Force 1 column on mobile via CSS usually, but let's check logic.
  // We can also check window width but hydration mismatch risk.
  // Best rely on CSS classes.
  // The current logic: cols === 1 || focusedSectionId ? "grid-cols-1"
  // Responsive classes: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
  // If cols=3 (desktop), it uses responsive. So mobile gets grid-cols-1.
  // If cols=2 (desktop), mobile gets grid-cols-1.
  // So "strictly 1 col on mobile" is already handled by Tailwind's mobile-first `grid-cols-1`.

  const cols = meta.grid_columns || 1;

  React.useEffect(() => {
    fetchSections();
    // If we have a password, we can sync.
    // If not, we are likely offline or just logged in.
    if (encryptionPassword) {
      loadCanvas();
    }
  }, [encryptionPassword]);

  // Filter sections if focused
  const visibleSections = focusedSectionId
    ? syllabus_sections.filter((s) => s.id === focusedSectionId)
    : syllabus_sections;

  return (
    <div
      id="main-canvas-container"
      className={cn(
        "relative w-full min-h-screen bg-[var(--color-background)] transition-all duration-300 p-8",
        // Remove max-width constraints to fill the center column
      )}
    >
      {/* Sync Status Indicator - Positioned Absolute in Top Right of Canvas Area */}
      {!isExporting && isAuthenticated && (
        <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2 bg-white/50 border border-[#010101]/10 p-2 rounded-full text-[10px] shadow-sm backdrop-blur-sm">
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
            <span className="text-[#010101]/60 font-medium">
              {isSyncing
                ? "SYNCING"
                : syncError
                  ? "ERROR"
                  : lastSyncedAt
                    ? "SAVED"
                    : "LOCAL"}
            </span>
          </>
        </div>
      )}

      {/* Export Header with Logo - Keep for PDF exports */}
      <div className={cn("hidden mb-8 text-center", isExporting && "block")}>
        <img
          src="/IMAGOTIPO.png"
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
          "grid gap-8 pb-10", // Added padding bottom for scrolling
          isExporting
            ? "grid-cols-1"
            : {
                "grid-cols-1": cols === 1 || focusedSectionId, // Force 1 col if focused
                "grid-cols-1 md:grid-cols-2": cols === 2 && !focusedSectionId,
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3":
                  cols === 3 && !focusedSectionId,
              },
        )}
      >
        {visibleSections.map((section, index) => (
          <div key={section.id} className="min-w-0">
            {/* Wrapper to prevent grid blowout */}
            {/* We need to pass the original index if we are filtering, 
                so the number remains correct (e.g. Section 5 should show "05" not "01") 
            */}
            <Section
              section={section}
              index={syllabus_sections.findIndex((s) => s.id === section.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
