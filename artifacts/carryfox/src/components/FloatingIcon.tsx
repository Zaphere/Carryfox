import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, X } from "lucide-react";
import { useTheme } from "@/lib/theme";

type Side = "left" | "right";

interface FloatingIconProps {
  /** Which edge of the content column the icon sits near. */
  side?: Side;
  /** Soft glow behind the icon — use sparingly (About page). */
  glow?: boolean;
  /** Content container width to align with, e.g. max-w-6xl / max-w-7xl. */
  container?: string;
}

const CHIPS = [
  { href: "/quote", label: "Get a free quote" },
  { href: "/services", label: "Browse services" },
  { href: "/track", label: "Track my move" },
];

/**
 * Floating Carryfox mascot, aligned to the left edge of the page's content
 * column and pinned near the bottom of the viewport.
 *
 * - Artwork swaps with the theme: V1 light mode, V2 dark mode.
 * - Gentle floating bob; subtle scale-up on hover, shrink on press.
 * - Clicking opens a chat bubble above it with quick actions (opens upward so
 *   it is never clipped by the bottom of the screen).
 * - Responsive sizing: smaller on mobile, larger on desktop.
 */
export default function FloatingIcon({
  side = "left",
  glow = false,
  container = "max-w-6xl",
}: FloatingIconProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const base = import.meta.env.BASE_URL;
  const src = theme === "dark" ? `${base}floating-icon-dark.png` : `${base}floating-icon-light.png`;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-4 left-0 right-0 z-20 xl:bottom-12"
    >
      <div className={`mx-auto w-full px-4 md:px-6 ${container}`}>
        <div className={`group relative flex w-fit items-end ${side === "right" ? "ml-auto" : "mr-auto"}`}>
          {glow && (
            <span className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 opacity-[0.15] blur-3xl transition-opacity duration-300 group-hover:opacity-100" />
          )}

          <AnimatePresence>
            {open && (
              <motion.div
                key="bubble"
                initial={{ opacity: 0, y: 12, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.94 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={`pointer-events-auto absolute bottom-full mb-3 w-64 rounded-2xl border border-border bg-card/95 p-3 shadow-2xl backdrop-blur md:w-72 md:p-4 ${
                  side === "right" ? "right-0" : "left-0"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground md:text-sm">Hi, I&apos;m Foxey 👋</p>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground md:text-xs">
                      Need a hand with your move? Pick an option and we&apos;ll take it from there.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close chat"
                    className="-mr-1 -mt-1 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="h-3 w-3 md:h-3.5 md:w-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-col gap-1.5">
                  {CHIPS.map((chip) => (
                    <Link
                      key={chip.href}
                      href={chip.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-2.5 py-1.5 text-[10px] font-semibold text-foreground transition-colors hover:border-primary/50 hover:text-primary md:px-3 md:py-2 md:text-xs"
                    >
                      {chip.label}
                      <ArrowRight className="h-3 w-3 md:h-3.5 md:w-3.5" />
                    </Link>
                  ))}
                </div>

                <span
                  className={`absolute -bottom-1.5 h-3 w-3 rotate-45 border-b border-r border-border bg-card ${
                    side === "right" ? "right-6" : "left-6"
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close chat with Foxey" : "Chat with Foxey"}
            className={`pointer-events-auto relative cursor-pointer rounded-full opacity-[0.15] outline-none transition-opacity duration-300 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 group-hover:opacity-100 ${
              open ? "opacity-100" : ""
            }`}
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            animate={open ? { y: -6 } : { y: [0, -14, 0] }}
            transition={
              open
                ? { duration: 0.25, ease: "easeOut" }
                : { duration: 6, repeat: Infinity, ease: "easeInOut" }
            }
          >
            <img
              src={src}
              alt=""
              draggable={false}
              className="w-14 select-none drop-shadow-[0_12px_30px_rgba(255,100,0,0.25)] md:w-20 xl:w-24"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
