"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  LayoutGrid,
  Loader2,
  LogOut,
  MessageCircle,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCanvasStore } from "@/public/lib/store/useCanvasStore";
import { cn } from "@/public/lib/utils";
import { Button } from "@/components/ui/Button";
import { generateSectionImage } from "@/public/lib/exportUtils";

const htmlToPlainText = (html?: string) => {
  if (!html) return "";

  if (globalThis.window === undefined) {
    return html
      .replaceAll(/<br\s*\/?>/gi, "\n")
      .replaceAll(/<\/div>\s*<div>/gi, "\n")
      .replaceAll(/<\/?div>/gi, "")
      .replaceAll(/<[^>]+>/g, "")
      .replaceAll("&nbsp;", " ")
      .replaceAll("&amp;", "&")
      .replaceAll("&lt;", "<")
      .replaceAll("&gt;", ">")
      .replaceAll("\r\n", "\n")
      .replaceAll("\r", "\n");
  }

  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.innerText.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
};

const plainTextToHtml = (value: string) => {
  const escaped = value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  return escaped.replaceAll("\n", "<br>");
};

const getBmcLayoutClass = (index: number) => {
  if (index < 4) return "md:col-span-3 md:row-span-2";
  return "md:col-span-6";
};

export const ModulesOverview = () => {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [captureMode, setCaptureMode] = useState<"bmc" | "classic" | null>(
    null,
  );
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsAppMessage, setWhatsAppMessage] = useState("");
  const [textDrafts, setTextDrafts] = useState<Record<string, string>>({});
  const {
    project,
    setProjectTitle,
    setStudentName,
    syllabus_sections,
    focusedSectionId,
    setFocusedSectionId,
    addWidget,
    updateWidget,
    isSyncing,
    syncError,
    lastSyncedAt,
    setIsAuthenticated,
  } = useCanvasStore();

  const visibleSections = focusedSectionId
    ? syllabus_sections.filter((section) => section.id === focusedSectionId)
    : syllabus_sections;

  const isCapturingAll = captureMode !== null;
  const sectionsToRender =
    captureMode === "bmc" ? syllabus_sections : visibleSections;

  const getSectionText = useCallback(
    (section: (typeof syllabus_sections)[number]) => {
      let textContent: string | undefined;
      for (const widget of section.widgets) {
        if (widget.type === "text_block") {
          textContent = widget.content;
          break;
        }
      }
      return htmlToPlainText(textContent);
    },
    [],
  );

  let syncLabel = "Local";
  if (lastSyncedAt) {
    syncLabel = "Guardado";
  }
  if (syncError) {
    syncLabel = "Error de sincronización";
  }
  if (isSyncing) {
    syncLabel = "Guardando...";
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsAuthenticated(false);
      router.replace("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleTextChange = (sectionId: string, value: string) => {
    const state = useCanvasStore.getState();
    const section = state.syllabus_sections.find(
      (item) => item.id === sectionId,
    );
    const existingTextWidget = section?.widgets.find(
      (widget) => widget.type === "text_block",
    );

    const htmlContent = plainTextToHtml(value);

    if (existingTextWidget) {
      updateWidget(sectionId, existingTextWidget.id, { content: htmlContent });
      return;
    }

    addWidget(sectionId, "text_block");

    const refreshedSection = useCanvasStore
      .getState()
      .syllabus_sections.find((item) => item.id === sectionId);
    const createdTextWidget = [...(refreshedSection?.widgets || [])]
      .reverse()
      .find((widget) => widget.type === "text_block");

    if (createdTextWidget) {
      updateWidget(sectionId, createdTextWidget.id, { content: htmlContent });
    }
  };

  useEffect(() => {
    setTextDrafts((previous) => {
      const next = { ...previous };

      for (const section of syllabus_sections) {
        if (!(section.id in next)) {
          next[section.id] = getSectionText(section);
        }
      }

      return next;
    });
  }, [syllabus_sections, getSectionText]);

  const persistVisibleDrafts = () => {
    visibleSections.forEach((section) => {
      const draftValue = textDrafts[section.id];
      if (draftValue !== undefined) {
        handleTextChange(section.id, draftValue);
      }
    });
  };

  const handleCapture = async (mode: "bmc" | "classic") => {
    try {
      persistVisibleDrafts();

      setCaptureMode(mode);
      await new Promise((resolve) => setTimeout(resolve, 80));
      await generateSectionImage(
        "new-all-modules-capture",
        mode === "bmc" ? "Modulos_BMC" : "Modulos_Clasico",
      );
    } finally {
      setCaptureMode(null);
    }
  };

  const handleShareWhatsApp = async () => {
    try {
      setIsSharingWhatsApp(true);
      persistVisibleDrafts();

      setCaptureMode("bmc");
      await new Promise((resolve) => setTimeout(resolve, 80));
      await generateSectionImage("new-all-modules-capture", "Modulos");

      const message =
        whatsAppMessage.trim() ||
        `Te comparto mi avance de ${project.title}. Ya tengo la imagen lista para enviarla por este chat.`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      globalThis.window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } finally {
      setCaptureMode(null);
      setIsSharingWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--color-background) text-(--color-text)">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "hidden lg:flex border-r bg-white/80 border-(--color-primary)/10 py-6 flex-col transition-all duration-200",
            isSidebarCollapsed ? "w-18 px-2" : "w-60 px-4",
          )}
        >
          <div className="flex items-center justify-between mb-7">
            <Image
              src="/IMAGOTIPO.png"
              alt="Growth Rockstar"
              width={120}
              height={24}
              className={cn(
                "h-6 w-auto object-contain transition-opacity",
                isSidebarCollapsed && "opacity-0 pointer-events-none",
              )}
            />

            <button
              type="button"
              aria-label={
                isSidebarCollapsed ? "Expandir sidebar" : "Comprimir sidebar"
              }
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="h-8 w-8 rounded-md border border-(--color-primary)/15 bg-white/80 flex items-center justify-center hover:bg-white"
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {!isSidebarCollapsed && (
            <>
              <p className="text-[10px] uppercase tracking-wide text-(--color-primary)/50 mb-2">
                Vista general
              </p>

              <button
                onClick={() => setFocusedSectionId(null)}
                className={cn(
                  "w-full text-left px-2.5 py-1.5 text-xs rounded-md border mb-4 transition-colors",
                  focusedSectionId === null
                    ? "bg-white border-(--color-primary)/30"
                    : "border-transparent hover:bg-white/70",
                )}
              >
                Vista general
              </button>

              <p className="text-[10px] uppercase tracking-wide text-(--color-primary)/50 mb-2">
                Módulos
              </p>
            </>
          )}

          <div className="space-y-1">
            {syllabus_sections.map((section, index) => (
              <button
                key={section.id}
                onClick={() => setFocusedSectionId(section.id)}
                className={cn(
                  "w-full rounded-md border transition-colors flex cursor-pointer items-center",
                  isSidebarCollapsed
                    ? "justify-center h-9"
                    : "text-left px-2.5 py-1.5 text-xs justify-between",
                  focusedSectionId === section.id
                    ? "bg-white border-(--color-primary)/30"
                    : "border-transparent hover:bg-white/70",
                )}
                title={section.title}
              >
                {isSidebarCollapsed ? (
                  <span className="text-xs font-semibold">{index + 1}</span>
                ) : (
                  <span className="truncate pr-2 text-xs">{section.title}</span>
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 px-3 md:px-5 py-3">
          <div className="max-w-270 mx-auto mt-10 md:mt-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3">
              <div className="w-full md:max-w-155">
                <input
                  value={project.title}
                  onChange={(event) => setProjectTitle(event.target.value)}
                  className="w-full bg-transparent text-lg md:text-2xl font-title font-bold text-center md:text-left outline-none"
                  placeholder="Nombre de la empresa"
                />
                <input
                  value={project.student_name}
                  onChange={(event) => setStudentName(event.target.value)}
                  className="w-full bg-transparent text-xs text-(--color-primary)/55 text-center md:text-left outline-none mt-1"
                  placeholder="Vista general de tu progreso"
                />
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-white border border-(--color-primary)/10">
                  {syncLabel}
                </span>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="h-8 px-3 text-[11px]"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  Cerrar sesión
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mb-2">
              <input
                value={whatsAppMessage}
                onChange={(event) => setWhatsAppMessage(event.target.value)}
                placeholder="Mensaje para WhatsApp"
                className="h-6 w-44 md:w-64 rounded-md border border-(--color-primary)/10 bg-white px-2 text-[10px] outline-none focus:border-(--color-primary)/40"
              />

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] hover:bg-(--color-cta) hover:no-underline"
                onClick={() => handleCapture("classic")}
                disabled={isCapturingAll || isSharingWhatsApp}
                title="Descargar imagen PNG"
              >
                <Camera className="w-3 h-3 mr-1" />
                PNG
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] hover:bg-(--color-cta) hover:no-underline"
                onClick={() => handleCapture("bmc")}
                disabled={isCapturingAll || isSharingWhatsApp}
                title="Descargar imagen estilo BMC"
              >
                {isCapturingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <LayoutGrid className="w-3 h-3 mr-1" />
                )}
                BMC
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] hover:bg-(--color-cta) hover:no-underline"
                onClick={handleShareWhatsApp}
                disabled={isCapturingAll || isSharingWhatsApp}
                title="Compartir por WhatsApp"
              >
                {isSharingWhatsApp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MessageCircle className="w-3 h-3" />
                )}
              </Button>
            </div>

            <div
              id="new-all-modules-capture"
              className="rounded-xl bg-(--color-background) p-3 md:p-4"
            >
              {isCapturingAll && (
                <div className="mb-3 flex items-end justify-between gap-3 border-b border-(--color-primary)/10 pb-2">
                  <p className="text-xs font-title font-semibold leading-none truncate">
                    {project.title || "Canvas"}
                  </p>

                  <Image
                    src="/IMAGOTIPO.png"
                    alt="Growth Rockstar"
                    width={120}
                    height={24}
                    className="h-6 w-auto object-contain shrink-0"
                  />
                </div>
              )}

              <div
                className={cn(
                  "grid gap-3",
                  captureMode === "bmc"
                    ? "grid-cols-1 md:grid-cols-12 md:grid-rows-3 md:gap-2"
                    : "grid-cols-1 md:grid-cols-2",
                )}
              >
                {sectionsToRender.map((section, index) => {
                  const currentValue =
                    textDrafts[section.id] ?? getSectionText(section);
                  const bmcLayoutClass = getBmcLayoutClass(index);

                  return (
                    <article
                      key={section.id}
                      className={cn(
                        "rounded-xl border border-(--color-primary)/10 bg-white p-3",
                        captureMode === "bmc" && bmcLayoutClass,
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-sm font-title font-semibold leading-none">
                          {section.title}
                        </h3>
                      </div>

                      {captureMode === "bmc" ? (
                        <div
                          className={cn(
                            "w-full rounded-md border border-(--color-primary)/10 px-2 py-1.5 text-[11px] min-h-28 whitespace-pre-wrap wrap-break-word",
                            !currentValue && "text-(--color-primary)/35",
                          )}
                        >
                          {currentValue || "Escribe aquí..."}
                        </div>
                      ) : (
                        <textarea
                          value={currentValue}
                          onChange={(event) =>
                            setTextDrafts((previous) => ({
                              ...previous,
                              [section.id]: event.target.value,
                            }))
                          }
                          onBlur={() =>
                            handleTextChange(section.id, currentValue)
                          }
                          placeholder="Escribe aquí..."
                          className={cn(
                            "w-full resize-none rounded-md border border-(--color-primary)/10 px-2 py-1.5 text-[11px] outline-none focus:border-(--color-primary)/40",
                            "min-h-16",
                          )}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
