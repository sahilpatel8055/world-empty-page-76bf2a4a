import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AdmissionPopup } from "@/components/common/AdmissionPopup";
import { CounsellingForm } from "@/components/common/CounsellingForm";
import { X } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Surfaces that can appear on top of the page. Only one may be visible at a
 * time — PopupManager owns the lock, the priority order and the cooldown.
 */
export type SurfaceId = "admission" | "counselling" | "botTeaser" | "contactHint" | "botChat";

const COOLDOWN_MS = 45000;

type Ctx = {
  active: SurfaceId | null;
  /** Try to take the surface lock. Returns false if busy, cooling down or dismissed. */
  request: (id: SurfaceId) => boolean;
  /** Release the lock and start the cooldown. `dismiss` blocks the surface for the session. */
  release: (id: SurfaceId, dismiss?: boolean) => void;
  /** User intent — always wins and replaces whatever is on screen. */
  openCounselling: () => void;
};

const PopupCtx = createContext<Ctx>({
  active: null,
  request: () => false,
  release: () => {},
  openCounselling: () => {},
});

export const usePopupSurface = () => useContext(PopupCtx);

/**
 * Poll-based helper: keeps asking for the lock between `fromMs` and `untilMs`
 * so a surface that lost the race still gets its turn once the lock frees up.
 */
export function useTimedSurface(id: SurfaceId, fromMs: number, untilMs: number) {
  const { request, release, active } = usePopupSurface();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let poll = 0;
    const start = window.setTimeout(() => {
      const tryOnce = () => {
        if (request(id)) {
          setShown(true);
          window.clearInterval(poll);
        }
      };
      tryOnce();
      poll = window.setInterval(tryOnce, 5000);
    }, fromMs);
    const stop = window.setTimeout(() => {
      window.clearInterval(poll);
      setShown((v) => {
        if (v) release(id);
        return false;
      });
    }, untilMs);
    return () => {
      window.clearTimeout(start);
      window.clearTimeout(stop);
      window.clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, fromMs, untilMs]);

  const close = useCallback(
    (dismiss = true) => {
      setShown(false);
      release(id, dismiss);
    },
    [id, release],
  );

  return { shown: shown && active === id, close };
}

export function PopupProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState<SurfaceId | null>(null);
  const activeRef = useRef<SurfaceId | null>(null);
  const dismissed = useRef<Set<SurfaceId>>(new Set());
  const cooldownUntil = useRef(0);

  const request = useCallback((id: SurfaceId) => {
    if (dismissed.current.has(id)) return false;
    if (activeRef.current !== null) return false;
    if (Date.now() < cooldownUntil.current) return false;
    activeRef.current = id;
    setActive(id);
    return true;
  }, []);

  const release = useCallback((id: SurfaceId, dismiss = true) => {
    if (dismiss) dismissed.current.add(id);
    if (activeRef.current !== id) return;
    activeRef.current = null;
    cooldownUntil.current = Date.now() + COOLDOWN_MS;
    setActive(null);
  }, []);

  const openCounselling = useCallback(() => {
    activeRef.current = "counselling";
    setActive("counselling");
  }, []);

  const value = useMemo(
    () => ({ active, request, release, openCounselling }),
    [active, request, release, openCounselling],
  );

  return (
    <PopupCtx.Provider value={value}>
      {children}
      <AdmissionScheduler />
      {active === "counselling" && (
        <CounsellingModal onClose={() => release("counselling", false)} />
      )}
    </PopupCtx.Provider>
  );
}

/** Admission banner: once per session, 60s after load, highest priority. */
function AdmissionScheduler() {
  const { request, release, active } = usePopupSurface();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/";

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isHome) return;
    try {
      if (sessionStorage.getItem("avedu-admission-popup") === "seen") return;
    } catch {
      /* ignore */
    }
    // Any inside page — direct landing or after the homepage — shows it at 5s.
    const id = window.setTimeout(() => {
      if (request("admission")) setOpen(true);
    }, 5000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHome]);

  const close = () => {
    setOpen(false);
    release("admission");
    try {
      sessionStorage.setItem("avedu-admission-popup", "seen");
    } catch {
      /* ignore */
    }
  };

  if (!open || active !== "admission") return null;
  return <AdmissionPopup onClose={close} />;
}

function CounsellingModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-black/50 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Free counselling"
        className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <CounsellingForm compact onDone={onClose} />
      </div>
    </div>
  );
}
