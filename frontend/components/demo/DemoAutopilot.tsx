"use client";

/**
 * DemoAutopilot — a self-running, presenter-free walkthrough of Ceyfi.
 *
 * WHY this lives in a layout-level provider (not the /demo page):
 * Next's App Router unmounts a page component the moment you navigate away.
 * An autopilot that hops /  ->  /wallet  ->  /scenarios must therefore live
 * ABOVE the router outlet so its loop, cursor, and captions survive every
 * route change. Mounted once in app/layout.tsx, it persists for the session.
 *
 * The runner drives real navigation and fires the real (mock) backend
 * side-effects the manual demo uses — so it is a genuine end-to-end run, not a
 * video. The animated cursor + caption bar are theatrical chrome that make it
 * read as "the app is clicking itself" to an audience.
 *
 * SAFETY: it never triggers a real payment/transfer. Money-moving steps are
 * intentionally omitted; only mock demo endpoints (spend/tax/reset) are called.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  postDemoReset,
  postTriggerSpend,
  prewarmDemoData,
} from "@/lib/api";

type DemoStep = {
  /** Route to navigate to at the start of the step (optional for pure actions). */
  route?: string;
  /** Big line shown in the caption bar. */
  caption: string;
  /** Presenter subtitle ("say this"). */
  say?: string;
  /** CSS selector the fake cursor animates to and "clicks". */
  target?: string;
  /** Real (mock) side-effect fired mid-step. */
  action?: () => Promise<unknown>;
  /** How long to linger on this step so the audience can read it. */
  dwellMs: number;
};

// ── The script. Data-driven: add/reorder steps freely. ────────────────────────
// Mirrors DEMO_SCRIPT.md's proven Nimal narrative, minus manual clicking.
const STEPS: DemoStep[] = [
  {
    route: "/",
    caption: "Ceyfi shows your financial future",
    say: "One calm view of money, loans, remittances and business cash flow.",
    dwellMs: 6000,
  },
  {
    route: "/wallet",
    caption: "Nimal sends money home — watch Household drop LKR 12,400",
    say: "Diaspora remittance lands, family spends, buckets update live.",
    target: '[data-demo-target="wallet-spend"]',
    action: () =>
      postTriggerSpend({
        account_id: "SEY-ACC-002",
        amount_lkr: 12400,
        merchant: "Softlogic Glomark",
        bucket_id: "household",
      }),
    dwellMs: 7500,
  },
  {
    route: "/scenarios",
    caption: "Stress-test salary delays and FX before you commit",
    say: "What-if scenarios pressure the plan while it is still safe to.",
    dwellMs: 6000,
  },
  {
    route:
      "/assistant?lang=si&prompt=" +
      encodeURIComponent("මගේ ණය ගෙවීම කවදාද?"),
    caption: "Ask in Sinhala or English — with live balances and loan context",
    say: "The assistant answers grounded in your real fixture data.",
    dwellMs: 7000,
  },
  {
    route: "/decisions?plan=d1",
    caption: "One ranked recommendation, with evidence — execute in one tap",
    say: "Ceyfi turns the whole picture into a single next best action.",
    dwellMs: 6500,
  },
  {
    caption: "Clean slate for the next judge",
    say: "Demo state resets so every run starts identical.",
    action: () => postDemoReset(),
    dwellMs: 3500,
  },
];

// ── Context ───────────────────────────────────────────────────────────────────
type Ctx = {
  isRunning: boolean;
  stepIndex: number;
  totalSteps: number;
  start: () => void;
  stop: () => void;
};

const DemoAutopilotContext = createContext<Ctx | null>(null);

export function useDemoAutopilot(): Ctx {
  const ctx = useContext(DemoAutopilotContext);
  if (!ctx) {
    throw new Error("useDemoAutopilot must be used within DemoAutopilotProvider");
  }
  return ctx;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function DemoAutopilotProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [caption, setCaption] = useState<{ caption: string; say?: string } | null>(
    null,
  );
  const [cursor, setCursor] = useState({ x: 0, y: 0, visible: false });
  const [clicking, setClicking] = useState(false);

  // Ref-based abort so the async loop can bail between awaits without stale state.
  const abortRef = useRef(false);
  const runningRef = useRef(false);

  const centerCursor = useCallback(() => {
    if (typeof window === "undefined") return;
    setCursor({
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.62,
      visible: true,
    });
  }, []);

  // Poll for a target element (it may not be mounted the instant we navigate),
  // then move the cursor to its centre. Falls back to screen centre.
  const moveCursorTo = useCallback(
    async (selector?: string) => {
      if (!selector) {
        centerCursor();
        return;
      }
      let el: Element | null = null;
      for (let i = 0; i < 12 && !abortRef.current; i++) {
        el = document.querySelector(selector);
        if (el) break;
        await sleep(150);
      }
      if (!el) {
        centerCursor();
        return;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(450);
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, visible: true });
    },
    [centerCursor],
  );

  const pulseClick = useCallback(async () => {
    setClicking(true);
    await sleep(420);
    setClicking(false);
  }, []);

  const stop = useCallback(() => {
    abortRef.current = true;
    runningRef.current = false;
    setIsRunning(false);
    setCaption(null);
    setCursor((c) => ({ ...c, visible: false }));
    setClicking(false);
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    abortRef.current = false;
    setIsRunning(true);
    setStepIndex(0);

    // Warm the demo data paths so nothing stalls mid-run.
    try {
      await prewarmDemoData();
    } catch {
      /* non-fatal — prewarm is best-effort */
    }

    for (let i = 0; i < STEPS.length; i++) {
      if (abortRef.current) break;
      const step = STEPS[i];
      setStepIndex(i);
      setCaption({ caption: step.caption, say: step.say });

      if (step.route) {
        router.push(step.route);
        await sleep(900); // let the new page mount
      }
      if (abortRef.current) break;

      await moveCursorTo(step.target);
      await sleep(700); // let the cursor glide (CSS transition)
      if (abortRef.current) break;

      if (step.action) {
        await pulseClick();
        try {
          await step.action();
          toast.success(step.caption);
        } catch {
          toast.error("Demo action skipped");
        }
      }
      if (abortRef.current) break;

      await sleep(step.dwellMs);
    }

    if (!abortRef.current) {
      toast.success("Autopilot demo complete ✨");
    }
    stop();
  }, [moveCursorTo, pulseClick, router, stop]);

  // Esc aborts at any time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && runningRef.current) {
        e.preventDefault();
        stop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stop]);

  const value = useMemo<Ctx>(
    () => ({ isRunning, stepIndex, totalSteps: STEPS.length, start, stop }),
    [isRunning, stepIndex, start, stop],
  );

  return (
    <DemoAutopilotContext.Provider value={value}>
      {children}
      <DemoLauncher />
      <DemoOverlay
        active={isRunning}
        stepIndex={stepIndex}
        total={STEPS.length}
        caption={caption}
        cursor={cursor}
        clicking={clicking}
        onStop={stop}
      />
    </DemoAutopilotContext.Provider>
  );
}

// ── Floating launcher (hidden while running) ──────────────────────────────────
function DemoLauncher() {
  const { isRunning, start } = useDemoAutopilot();
  if (isRunning) return null;
  return (
    <button
      type="button"
      onClick={start}
      aria-label="Start Ceyfi autopilot demo"
      className="fixed bottom-5 right-5 z-[9998] inline-flex items-center gap-2 rounded-full bg-ceyfi-green px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-ceyfi-green/30 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white/70" />
        <span className="relative inline-flex size-2.5 rounded-full bg-white" />
      </span>
      Play auto demo
    </button>
  );
}

// ── Overlay: cursor + caption + progress + exit hint ─────────────────────────
function DemoOverlay({
  active,
  stepIndex,
  total,
  caption,
  cursor,
  clicking,
  onStop,
}: {
  active: boolean;
  stepIndex: number;
  total: number;
  caption: { caption: string; say?: string } | null;
  cursor: { x: number; y: number; visible: boolean };
  clicking: boolean;
  onStop: () => void;
}) {
  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999]">
      {/* Transparent click-shield so stray clicks don't derail the run. */}
      <div className="pointer-events-auto absolute inset-0" />

      {/* Subtle vignette to focus the eye, without hiding the app. */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.28)]" />

      {/* Top bar: AUTO DEMO badge + progress dots + exit */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-ceyfi-green px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow">
          <span className="size-2 animate-pulse rounded-full bg-white" />
          Auto Demo
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === stepIndex
                  ? "w-7 bg-ceyfi-green"
                  : i < stepIndex
                    ? "w-4 bg-ceyfi-green/50"
                    : "w-4 bg-white/40")
              }
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onStop}
          className="pointer-events-auto rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/80"
        >
          Esc · Stop
        </button>
      </div>

      {/* Fake cursor */}
      {cursor.visible ? (
        <div
          className="absolute left-0 top-0 transition-transform duration-700 ease-out"
          style={{ transform: `translate(${cursor.x}px, ${cursor.y}px)` }}
        >
          {clicking ? (
            <span className="absolute -left-4 -top-4 size-8 animate-ping rounded-full border-2 border-ceyfi-green" />
          ) : null}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          >
            <path
              d="M5 3l14 7-6 2-2 6-6-15z"
              fill="white"
              stroke="#0f172a"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : null}

      {/* Caption bar */}
      {caption ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center px-4 pb-8">
          <div className="max-w-2xl rounded-2xl bg-black/80 px-6 py-4 text-center text-white shadow-2xl backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ceyfi-green">
              Step {stepIndex + 1} of {total}
            </p>
            <p className="mt-1 font-heading text-lg font-semibold leading-snug">
              {caption.caption}
            </p>
            {caption.say ? (
              <p className="mt-1 text-sm text-white/70">{caption.say}</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
