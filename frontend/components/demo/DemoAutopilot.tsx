"use client";

/**
 * DemoAutopilot — a self-running, presenter-free walkthrough of Ceyfi.
 *
 * WHY this lives in a layout-level provider (not the /demo page):
 * Next's App Router unmounts a page component the moment you navigate away.
 * An autopilot that hops across modules must therefore live ABOVE the router
 * outlet so its loop, cursor, and captions survive every route change.
 * Mounted once in app/layout.tsx, it persists for the session.
 *
 * The runner drives real navigation, real (mock) backend side-effects, and —
 * where useful — real DOM clicks, so it is a genuine end-to-end product tour,
 * not a video. The animated cursor + caption bar are theatrical chrome.
 *
 * SAFETY: it never triggers a real payment/transfer. Money-moving steps call
 * mock demo endpoints only (spend / tax-jar / decision execute / reset).
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
import { useAuth } from "@/contexts/AuthContext";
import {
  executeDecision,
  postDemoReset,
  postTaxJarTrigger,
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
  /** CSS selector the fake cursor animates to (and optionally clicks). */
  target?: string;
  /** When true, programmatically click the matched target after the cursor arrives. */
  click?: boolean;
  /** Runs before navigation — use for persona switches so the next page loads as the right user. */
  prepare?: () => Promise<unknown>;
  /** Real (mock) side-effect fired mid-step (after cursor / click). */
  action?: () => Promise<unknown>;
  /** Extra settle time after navigation before seeking the target. */
  settleMs?: number;
  /** How long to linger on this step so the audience can read it. */
  dwellMs: number;
  /** Toast only for real demo side-effects (default: toast when action is present). */
  toastOnAction?: boolean;
};

const PERSONA = {
  nimal: "SEY-USR-001",
  sunil: "SEY-USR-003",
  suresh: "SEY-BIZ-001",
} as const;

// ── The script. Data-driven: add/reorder steps freely. ────────────────────────
// Full product tour across diaspora → borrower → SME → back to Nimal.
function buildSteps(switchPersona: (userId: string) => Promise<void>): DemoStep[] {
  return [
    {
      route: "/",
      caption: "Ceyfi shows your financial future",
      say: "Time River projects cash, loans and remittances — inspect the next risk.",
      target: '[data-demo-target="inspect-next-risk"]',
      click: true,
      settleMs: 1100,
      dwellMs: 4500,
    },
    {
      caption: "Pick a plan — the forecast updates live",
      say: "One tap selects a ranked action and links it into Decisions.",
      target: '[data-demo-target="select-plan"]',
      click: true,
      dwellMs: 4000,
    },
    {
      route: "/wallet",
      caption: "Nimal sends money home — Household drops LKR 12,400",
      say: "Diaspora remittance lands, family spends, buckets update live.",
      target: '[data-demo-target="wallet-spend"]',
      action: () =>
        postTriggerSpend({
          account_id: "SEY-ACC-002",
          amount_lkr: 12400,
          merchant: "Softlogic Glomark",
          bucket_id: "household",
        }),
      settleMs: 900,
      dwellMs: 6500,
    },
    {
      route: "/scenarios",
      caption: "Stress-test a salary delay before you commit",
      say: "What-if shocks pressure the 90-day fan while it is still safe to.",
      target: '[data-demo-target="shock-salary-delay"]',
      click: true,
      settleMs: 900,
      dwellMs: 5500,
    },
    {
      route: "/market",
      caption: "CSE watchlist next to your cash — powered by Chime",
      say: "Alerts and fires sit beside liquid balance. Ceyfi never scrapes cse.lk.",
      target: '[data-demo-target="market-fire"]',
      settleMs: 1100,
      dwellMs: 4500,
    },
    {
      route: "/market/alerts/f-1",
      caption: "Alert detail: cash context + disabled broker handoff",
      say: "NFA on every surface. Order entry stays with a licensed broker.",
      target: '[data-demo-target="broker-cta"]',
      settleMs: 1000,
      dwellMs: 5000,
    },
    {
      route: "/intelligence",
      caption: "Explainable financial health — score, anomalies, forecast",
      say: "One snapshot ranks what matters and why the score moved.",
      target: '[data-demo-target="health-score"]',
      settleMs: 1100,
      dwellMs: 5000,
    },
    {
      route: "/loans",
      caption: "Nimal's personal loan — next due and repayment progress",
      say: "Loan health, countdown and AI advisor share the same fixture truth.",
      target: '[data-demo-target="loan-summary"]',
      settleMs: 1000,
      dwellMs: 4500,
    },
    {
      // Query forces a remount when we were already on /loans as Nimal.
      route: "/loans?persona=sunil",
      caption: "Switch to Sunil — business loan AT RISK, overdue instalment",
      say: "Same product, borrower lens: urgency without leaving the Ceyfi shell.",
      target: '[data-demo-target="loan-summary"]',
      prepare: () => switchPersona(PERSONA.sunil),
      settleMs: 1600,
      dwellMs: 6000,
    },
    {
      route: "/business?persona=suresh",
      caption: "Suresh's tax jar — inbound sale auto-saves 10% (LKR 820)",
      say: "Every customer payment seeds VAT readiness without spreadsheet work.",
      target: '[data-demo-target="tax-jar-trigger"]',
      prepare: () => switchPersona(PERSONA.suresh),
      action: () =>
        postTaxJarTrigger({
          user_id: PERSONA.suresh,
          incoming_amount_lkr: 8200,
          description: "Cash Sale - Electrical Fittings",
        }),
      settleMs: 1600,
      dwellMs: 6500,
    },
    {
      route:
        "/assistant?lang=si&prompt=" +
        encodeURIComponent("මගේ ණය ගෙවීම කවදාද?"),
      caption: "Ask in Sinhala — live balances and loan context",
      say: "Back to Nimal. The assistant answers grounded in fixture data.",
      prepare: () => switchPersona(PERSONA.nimal),
      settleMs: 2000,
      dwellMs: 8000,
    },
    {
      route: "/decisions?plan=d1",
      caption: "One ranked recommendation — execute with evidence",
      say: "Ceyfi turns the whole picture into a single next best action.",
      target: '[data-demo-target="decision-execute"]',
      action: () => executeDecision(PERSONA.nimal, "d1"),
      settleMs: 1200,
      dwellMs: 6000,
    },
    {
      caption: "Clean slate for the next audience",
      say: "Demo state resets so every run starts identical.",
      action: async () => {
        await postDemoReset();
        await switchPersona(PERSONA.nimal);
      },
      dwellMs: 3500,
    },
  ];
}

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
  const { switchPersona } = useAuth();
  const steps = useMemo(() => buildSteps(switchPersona), [switchPersona]);

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
  const stepsRef = useRef(steps);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

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
        return null;
      }
      let el: Element | null = null;
      for (let i = 0; i < 16 && !abortRef.current; i++) {
        el = document.querySelector(selector);
        if (el) break;
        await sleep(175);
      }
      if (!el) {
        centerCursor();
        return null;
      }
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(450);
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + r.width / 2, y: r.top + r.height / 2, visible: true });
      return el;
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

    // Always begin as Nimal so the diaspora chapters match captions.
    try {
      await switchPersona(PERSONA.nimal);
    } catch {
      /* non-fatal if already Nimal / offline */
    }

    const script = stepsRef.current;
    for (let i = 0; i < script.length; i++) {
      if (abortRef.current) break;
      const step = script[i];
      setStepIndex(i);
      setCaption({ caption: step.caption, say: step.say });

      // Persona switches run immediately before navigation so we never dwell on
      // the wrong persona's empty-state page (e.g. Nimal on /business).
      if (step.prepare) {
        try {
          await step.prepare();
        } catch {
          toast.error("Demo action skipped");
        }
        if (abortRef.current) break;
      }

      if (step.route) {
        router.push(step.route);
        await sleep(step.settleMs ?? 900);
      } else if (step.settleMs) {
        await sleep(step.settleMs);
      }
      if (abortRef.current) break;

      const el = await moveCursorTo(step.target);
      await sleep(700); // let the cursor glide (CSS transition)
      if (abortRef.current) break;

      if (step.click || step.action) {
        await pulseClick();
      }

      if (step.click && el instanceof HTMLElement) {
        try {
          el.click();
        } catch {
          /* ignore — target may have unmounted */
        }
        await sleep(400);
      }

      if (step.action) {
        try {
          await step.action();
          if (step.toastOnAction !== false) {
            toast.success(step.caption);
          }
        } catch {
          toast.error("Demo action skipped");
        }
      }
      if (abortRef.current) break;

      await sleep(step.dwellMs);
    }

    if (!abortRef.current) {
      toast.success("Full product tour complete");
    }
    stop();
  }, [moveCursorTo, pulseClick, router, stop, switchPersona]);

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
    () => ({
      isRunning,
      stepIndex,
      totalSteps: steps.length,
      start,
      stop,
    }),
    [isRunning, stepIndex, steps.length, start, stop],
  );

  return (
    <DemoAutopilotContext.Provider value={value}>
      {children}
      <DemoLauncher />
      <DemoOverlay
        active={isRunning}
        stepIndex={stepIndex}
        total={steps.length}
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
      aria-label="Start Ceyfi full product auto demo"
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
    <>
      {/*
        Shield + vignette sit BELOW Radix sheets/dialogs (z-50) so Time River,
        Execute confirm, etc. remain visible during the tour. Cursor/caption stay
        above everything so the audience always sees the autopilot chrome.
      */}
      <div className="pointer-events-auto fixed inset-0 z-40" aria-hidden />
      <div
        className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_180px_60px_rgba(0,0,0,0.28)]"
        aria-hidden
      />

      <div className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex items-center justify-between px-5 py-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-ceyfi-green px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow">
          <span className="size-2 animate-pulse rounded-full bg-white" />
          Auto Demo
        </span>
        <div className="flex max-w-[45vw] flex-wrap items-center justify-center gap-1">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === stepIndex
                  ? "w-5 bg-ceyfi-green sm:w-6"
                  : i < stepIndex
                    ? "w-2.5 bg-ceyfi-green/50 sm:w-3"
                    : "w-2.5 bg-white/40 sm:w-3")
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

      {cursor.visible ? (
        <div
          className="pointer-events-none fixed left-0 top-0 z-[9999] transition-transform duration-700 ease-out"
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

      {caption ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[9999] flex justify-center px-4 pb-8">
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
    </>
  );
}
