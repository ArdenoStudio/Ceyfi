"use client";

import { CHART_COLORS } from "@/lib/chartUtils";
import { formatters } from "@/lib/utils";

interface Flow {
  from: string;
  to: string;
  amount: number;
  color: string;
}

const FLOWS: Flow[] = [
  { from: "Salary", to: "Current Account", amount: 185000, color: CHART_COLORS.green },
  { from: "Freelance", to: "Current Account", amount: 22000, color: CHART_COLORS.blue },
  { from: "Remittance", to: "Savings Account", amount: 45000, color: CHART_COLORS.violet },
  { from: "Current Account", to: "School Fees", amount: 15000, color: CHART_COLORS.amber },
  { from: "Current Account", to: "Household", amount: 42000, color: CHART_COLORS.green },
  { from: "Current Account", to: "Loan EMI", amount: 22000, color: CHART_COLORS.rose },
  { from: "Current Account", to: "Bills", amount: 9800, color: CHART_COLORS.slate },
  { from: "Savings Account", to: "Savings bucket", amount: 28000, color: CHART_COLORS.mint },
];

const SOURCES = ["Salary", "Freelance", "Remittance"];
const ACCOUNTS = ["Current Account", "Savings Account"];
const DESTINATIONS = ["School Fees", "Household", "Savings bucket", "Loan EMI", "Bills"];

function curvePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

export function MoneyFlowDiagram() {
  const colX = [60, 200, 340];
  const sourceY = [40, 100, 160];
  const accountY = [70, 130];
  const destY = [30, 75, 120, 165, 210];

  const pos = (name: string): [number, number] => {
    const si = SOURCES.indexOf(name);
    if (si >= 0) return [colX[0], sourceY[si]];
    const ai = ACCOUNTS.indexOf(name);
    if (ai >= 0) return [colX[1], accountY[ai]];
    const di = DESTINATIONS.indexOf(name);
    return [colX[2], destY[di] ?? 100];
  };

  const maxAmount = Math.max(...FLOWS.map((f) => f.amount));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 420 250" className="mx-auto h-auto w-full max-w-lg">
        {[colX[0], colX[1], colX[2]].map((x, i) => (
          <text
            key={i}
            x={x}
            y={12}
            textAnchor="middle"
            className="fill-ceyfi-muted text-[9px] font-semibold"
          >
            {i === 0 ? "Sources" : i === 1 ? "Accounts" : "Destinations"}
          </text>
        ))}
        {FLOWS.map((flow, i) => {
          const [x1, y1] = pos(flow.from);
          const [x2, y2] = pos(flow.to);
          const width = Math.max(2, (flow.amount / maxAmount) * 14);
          return (
            <path
              key={i}
              d={curvePath(x1 + 40, y1, x2 - 40, y2)}
              fill="none"
              stroke={flow.color}
              strokeWidth={width}
              strokeOpacity={0.55}
            />
          );
        })}
        {SOURCES.map((name, i) => (
          <g key={name}>
            <rect x={colX[0] - 50} y={sourceY[i] - 14} width={100} height={28} rx={8} fill="#E8F7EE" />
            <text x={colX[0]} y={sourceY[i] + 4} textAnchor="middle" className="fill-ceyfi-ink text-[9px] font-medium">
              {name}
            </text>
          </g>
        ))}
        {ACCOUNTS.map((name, i) => (
          <g key={name}>
            <rect x={colX[1] - 55} y={accountY[i] - 14} width={110} height={28} rx={8} fill="#F0FDF4" stroke="#D8E8DC" />
            <text x={colX[1]} y={accountY[i] + 4} textAnchor="middle" className="fill-ceyfi-ink text-[9px] font-medium">
              {name}
            </text>
          </g>
        ))}
        {DESTINATIONS.map((name, i) => (
          <g key={name}>
            <rect x={colX[2] - 50} y={destY[i] - 12} width={100} height={24} rx={6} fill="#FBFDF9" stroke="#D8E8DC" />
            <text x={colX[2]} y={destY[i] + 4} textAnchor="middle" className="fill-ceyfi-ink text-[8px] font-medium">
              {name}
            </text>
          </g>
        ))}
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {FLOWS.slice(0, 3).map((f) => (
          <span key={f.from} className="text-[10px] text-ceyfi-muted">
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: f.color }} />
            {f.from}: {formatters.currency({ number: f.amount, maxFractionDigits: 0 })}
          </span>
        ))}
      </div>
    </div>
  );
}
