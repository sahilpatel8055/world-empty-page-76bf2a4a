import { useEffect, useState } from "react";
import { CheckCircle2, TimerReset } from "lucide-react";

/** Milliseconds left until the next local midnight (today 12:00 AM). */
function msToMidnight(now = Date.now()) {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime() - now;
}

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Compact quick-enquiry strip: countdown to midnight + name and mobile only.
 * Used high on course, university-course and specialisation pages so the form
 * is half-visible on landing.
 */
export function QuickEnquiry({
  heading = "Take a step towards your",
  highlight = "Online degree career",
  offer = "Get up to ₹15,000 off",
  className = "",
}: {
  heading?: string;
  highlight?: string;
  offer?: string;
  className?: string;
}) {
  const [left, setLeft] = useState(() => msToMidnight());
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setLeft(msToMidnight()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const total = Math.max(0, Math.floor(left / 1000));
  const units = [
    { v: pad(Math.floor(total / 3600)), l: "HRS" },
    { v: pad(Math.floor((total % 3600) / 60)), l: "MIN" },
    { v: pad(total % 60), l: "SEC" },
  ];

  return (
    <div
      className={`rounded-2xl border border-[#7f1813]/25 bg-card p-4 shadow-[0_18px_40px_-30px_oklch(0_0_0/0.5)] sm:p-5 ${className}`}
    >
      <p className="flex items-center gap-2 font-display text-[0.98rem] font-extrabold text-foreground sm:text-lg">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
        <span>
          {heading} <span className="text-[#7f1813]">{highlight}</span>
        </span>
      </p>


      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#7f1813]/45 bg-[#7f1813]/[0.06] px-3 py-2.5">
        <p className="flex w-full items-start gap-2 text-[0.8rem] leading-tight sm:w-auto">
          <TimerReset className="mt-0.5 h-5 w-5 shrink-0 text-[#7f1813]" aria-hidden="true" />
          <span>
            <span className="block text-[0.68rem] font-extrabold uppercase tracking-wider text-[#7f1813]">
              Limited time offer
            </span>
            <span className="block font-bold text-foreground">
              <span className="text-shine font-display text-[1.06rem] font-extrabold">{offer}</span>
            </span>
          </span>
        </p>
        <div className="flex w-full items-center justify-between gap-1.5 sm:w-auto sm:justify-end">
          {units.map((u, i) => (
            <div key={u.l} className="flex flex-1 items-center gap-1.5 sm:flex-none">
              {i > 0 && <span className="font-extrabold text-[#7f1813]">:</span>}
              <div className="flex-1 text-center sm:flex-none">
                <span className="block w-full min-w-[2.4rem] rounded-lg bg-[#7f1813] px-1.5 py-1.5 font-display text-[1rem] font-extrabold tabular-nums text-white">
                  {u.v}
                </span>
                <span className="mt-0.5 block text-[0.55rem] font-bold tracking-wider text-muted-foreground">
                  {u.l}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {sent ? (
        <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-3 text-[0.85rem] font-semibold text-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          Thanks! A counsellor will call you shortly.
        </p>
      ) : (
        <form
          className="mt-3 grid gap-2 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <input
            required
            name="name"
            autoComplete="name"
            placeholder="Enter your full name"
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-[0.9rem] outline-none focus-visible:border-[#7f1813] focus-visible:ring-2 focus-visible:ring-[#7f1813]/25 sm:col-span-2"
          />
          <input
            required
            name="phone"
            type="tel"
            inputMode="numeric"
            pattern="[0-9+ ]{10,15}"
            autoComplete="tel"
            placeholder="Enter phone No."
            className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-[0.9rem] outline-none focus-visible:border-[#7f1813] focus-visible:ring-2 focus-visible:ring-[#7f1813]/25 sm:col-span-2"
          />
          <button
            type="submit"
            className="h-12 rounded-full bg-[#7f1813] text-[0.95rem] font-extrabold text-white transition-opacity hover:opacity-90 sm:col-span-2"
          >
            Enroll Now ↗
          </button>
        </form>
      )}
    </div>
  );
}
