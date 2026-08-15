import { useEffect, useState } from "react";
import { X, CalendarDays, Clock, ShieldCheck } from "lucide-react";
import { usePopupSurface } from "@/components/common/PopupManager";


/** Fixed 3-day admission cycle anchored to a stable epoch, in the user's local time. */
const CYCLE_DAYS = 3;
const ANCHOR = new Date(2026, 0, 1).getTime();

/** Next midnight that lands on the rolling 3-day cycle. */
function nextDeadline(now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  const dayMs = 86400000;
  const daysSinceAnchor = Math.floor((midnight.getTime() - ANCHOR) / dayMs);
  const offset = ((CYCLE_DAYS - (daysSinceAnchor % CYCLE_DAYS)) % CYCLE_DAYS) || CYCLE_DAYS;
  return midnight.getTime() + offset * dayMs;
}

const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function AdmissionPopup({ onClose }: { onClose: () => void }) {
  const { openCounselling } = usePopupSurface();
  const [deadline, setDeadline] = useState(() => nextDeadline());
  const [left, setLeft] = useState(() => nextDeadline() - Date.now());

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let end = deadline;
      // Countdown finished — roll forward to the next 3-day deadline automatically.
      if (now >= end) {
        end = nextDeadline(now);
        setDeadline(end);
      }
      setLeft(end - now);
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const total = Math.max(0, Math.floor(left / 1000));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  const d = new Date(deadline);
  const lastDate = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/55 p-3 backdrop-blur-sm sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="2026 batch admissions closing soon"
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-[#7f1813]/25 bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#3b0b08] shadow ring-1 ring-black/5 transition-colors hover:bg-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative bg-gradient-to-br from-[#fdf3f3] via-white to-[#fbeaea] px-5 pb-4 pt-5 sm:px-7 sm:pt-6">
          {/* Girl artwork — decorative, sits at the right on all sizes */}
          <img
            src="/banner-girl.png"
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1024}
            height={1536}
            className="pointer-events-none absolute bottom-8 right-0 h-[86%] w-auto select-none object-contain object-top sm:bottom-12 sm:h-[96%]"
          />

          <div className="relative z-10 max-w-[64%] sm:max-w-[58%]">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#7f1813]/10 px-3 py-1.5 text-[0.68rem] font-bold text-[#7f1813] sm:text-[0.75rem]">
              <CalendarDays className="h-3.5 w-3.5" /> Last Date: {lastDate}
            </span>

            <h2 className="mt-3 font-display text-[1.35rem] font-extrabold leading-[1.15] text-[#111] sm:text-3xl">
              <span className="block text-[#7f1813]">Don&apos;t Miss!</span>
              2026 Batch Admissions Closing Soon.
            </h2>

            <div className="mt-4 rounded-2xl bg-white/85 p-3 ring-1 ring-[#7f1813]/12 sm:p-4">
              <p className="text-[0.72rem] font-bold text-[#333] sm:text-[0.85rem]">
                Offer ends today at <span className="text-[#7f1813]">12:00 AM</span>
              </p>
              <div className="mt-2 flex items-center gap-1.5 sm:gap-2">
                {[
                  { v: pad(hrs), l: "HRS" },
                  { v: pad(mins), l: "MINS" },
                  { v: pad(secs), l: "SECS" },
                ].map((u, i) => (
                  <div key={u.l} className="flex items-center gap-1.5 sm:gap-2">
                    {i > 0 && <span className="text-lg font-extrabold text-[#7f1813]">:</span>}
                    <div className="min-w-[3rem] rounded-xl bg-[#7f1813] px-2 py-1.5 text-center text-white sm:min-w-[3.6rem] sm:py-2">
                      <span className="block font-display text-lg font-extrabold leading-none tabular-nums sm:text-2xl">
                        {u.v}
                      </span>
                      <span className="mt-1 block text-[0.55rem] font-bold tracking-wider sm:text-[0.62rem]">
                        {u.l}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 flex items-center gap-1.5 border-t border-[#7f1813]/10 pt-2.5 text-[0.7rem] font-semibold text-[#555] sm:text-[0.78rem]">
                <Clock className="h-3.5 w-3.5 text-[#7f1813]" /> Hurry! Seats are filling fast.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              openCounselling();
            }}
            className="relative z-10 mt-4 flex h-12 w-full max-w-[22rem] items-center justify-center gap-2 rounded-xl bg-[#7f1813] text-[0.95rem] font-bold text-white shadow-lg transition-opacity hover:opacity-90 sm:mt-5"
          >
            Secure Your Seat Now <span aria-hidden="true">›</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-3 border-t border-[#7f1813]/10 bg-[#fdf3f3] px-4 py-3 text-center">
          <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-bold text-[#7f1813] sm:text-[0.8rem]">
            <ShieldCheck className="h-4 w-4" /> Verified information
          </span>
          <span className="h-4 w-px bg-[#7f1813]/20" />
          <span className="text-[0.72rem] font-semibold text-[#555] sm:text-[0.8rem]">
            Trusted by thousands of learners
          </span>
        </div>
      </div>
    </div>
  );
}
