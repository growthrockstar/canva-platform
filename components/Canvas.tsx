"use client";

import React from "react";
import { useCanvasStore } from "@/lib/store/useCanvasStore";
import { Section } from "./canvas/Section";
import { cn } from "@/lib/utils";

export const Canvas: React.FC = () => {
  const { syllabus_sections, isExporting, meta, encryptionPassword, setEncryptionPassword, isSyncing, lastSyncedAt, syncError, saveCanvas, loadCanvas } = useCanvasStore();
  const cols = meta.grid_columns || 1;
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [passwordInput, setPasswordInput] = React.useState('');

  React.useEffect(() => {
    // Check for existing password or prompt
    if (!encryptionPassword) {
      // Check localStorage or just prompt?
      // For now, prompt.
      setShowPasswordModal(true);
    } else {
      // Start initial load/sync
      loadCanvas('user-123'); // FIXME: UserId handling
    }
  }, [encryptionPassword]);

  const handleSetPassword = () => {
    if (passwordInput.length < 4) return;
    setEncryptionPassword(passwordInput);
    setShowPasswordModal(false);
  };

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
      {!isExporting && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-xs shadow-xl">
          {!encryptionPassword ? (
            <button onClick={() => setShowPasswordModal(true)} className="text-amber-500 font-medium hover:underline">
              Setup Sync Pwd
            </button>
          ) : (
            <>
              <div className={cn("w-2 h-2 rounded-full",
                isSyncing ? "bg-blue-500 animate-pulse" :
                  syncError ? "bg-red-500" : "bg-green-500"
              )} />
              <span className="text-zinc-400">
                {isSyncing ? "Syncing..." :
                  syncError ? "Sync Error" :
                    lastSyncedAt ? "Saved" : "Local"}
              </span>
            </>
          )}
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1C1C1E] p-6 rounded-xl border border-white/10 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Secure Your Canvas</h3>
            <p className="text-sm text-zinc-400 mb-4">
              Enter a password to encrypt your data. This password is required to access your canvas from other devices. We do not store this password.
            </p>
            <input
              type="password"
              placeholder="Enter encryption password..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white mb-4 focus:outline-none focus:border-amber-500"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              {/* Allow skip for verify-only? No, enforce it for safety per requirement */}
              <button
                onClick={handleSetPassword}
                disabled={passwordInput.length < 4}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enable Sync & Encryption
              </button>
            </div>
          </div>
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
        <p className="text-sm">Growth Rockstar Canvas - Local First Edition</p>
      </footer>
    </div>
  );
};
