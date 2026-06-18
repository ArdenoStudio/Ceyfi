export interface EnrichedTransaction {
  id: string;
  date: string;
  description: string;
  amount_lkr: number;
  type: "credit" | "debit";
  category: string;
  merchant: string;
  hour: number;
  weekday: number;
}

const CATEGORIES = [
  "Food & Dining",
  "Bills & Utilities",
  "Transport",
  "Healthcare",
  "Shopping",
  "Income",
  "Loan",
] as const;

function tx(
  id: string,
  date: string,
  description: string,
  amount: number,
  type: "credit" | "debit",
  category: string,
  merchant: string,
  hour = 12
): EnrichedTransaction {
  const d = new Date(date);
  return {
    id,
    date,
    description,
    amount_lkr: type === "debit" ? -Math.abs(amount) : Math.abs(amount),
    type,
    category,
    merchant,
    hour,
    weekday: d.getDay(),
  };
}

export const FALLBACK_TRANSACTIONS: EnrichedTransaction[] = [
  tx("t01", "2026-06-17", "Keells Supermarket · Nugegoda", 4800, "debit", "Food & Dining", "Keells", 18),
  tx("t02", "2026-06-16", "PickMe · Ride to office", 720, "debit", "Transport", "PickMe", 8),
  tx("t03", "2026-06-15", "Lanka Hospitals · Consultation", 3500, "debit", "Healthcare", "Lanka Hospitals", 10),
  tx("t04", "2026-06-14", "Keells Supermarket · Weekly", 4200, "debit", "Food & Dining", "Keells", 17),
  tx("t05", "2026-06-13", "Uber · Airport drop", 1850, "debit", "Transport", "Uber", 6),
  tx("t06", "2026-06-12", "Dialog Axiata · Mobile", 2800, "debit", "Bills & Utilities", "Dialog", 9),
  tx("t07", "2026-06-11", "Keells delivery", 3500, "debit", "Food & Dining", "Keells", 19),
  tx("t08", "2026-06-10", "CEB Electricity", 4200, "debit", "Bills & Utilities", "CEB", 11),
  tx("t09", "2026-06-09", "Odel · Clothing", 8900, "debit", "Shopping", "Odel", 15),
  tx("t10", "2026-06-08", "PickMe Food", 1650, "debit", "Food & Dining", "PickMe", 20),
  tx("t11", "2026-06-07", "Keells Supermarket", 5100, "debit", "Food & Dining", "Keells", 18),
  tx("t12", "2026-06-06", "Salary Credit · Hayleys Group", 185000, "credit", "Income", "Hayleys", 9),
  tx("t13", "2026-06-05", "School Fees · St. Peter's", 15000, "debit", "Bills & Utilities", "School", 10),
  tx("t14", "2026-06-04", "Dialog Bill", 2800, "debit", "Bills & Utilities", "Dialog", 8),
  tx("t15", "2026-06-03", "Keells Supermarket", 3900, "debit", "Food & Dining", "Keells", 17),
  tx("t16", "2026-06-02", "Uber · Ride", 980, "debit", "Transport", "Uber", 7),
  tx("t17", "2026-06-01", "Netflix Subscription", 1750, "debit", "Shopping", "Netflix", 0),
  tx("t18", "2026-05-31", "Keells · Large grocery", 18000, "debit", "Food & Dining", "Keells", 16),
  tx("t19", "2026-05-30", "Personal Loan EMI", 22000, "debit", "Loan", "Seylan Bank", 10),
  tx("t20", "2026-05-29", "PickMe · Ride", 640, "debit", "Transport", "PickMe", 8),
  tx("t21", "2026-05-28", "Keells Supermarket", 4500, "debit", "Food & Dining", "Keells", 18),
  tx("t22", "2026-05-27", "Lanka Hospitals · Lab", 2800, "debit", "Healthcare", "Lanka Hospitals", 11),
  tx("t23", "2026-05-26", "CEB Electricity", 3800, "debit", "Bills & Utilities", "CEB", 10),
  tx("t24", "2026-05-25", "Personal Loan EMI", 22000, "debit", "Loan", "Seylan Bank", 9),
  tx("t25", "2026-05-24", "Keells delivery", 3600, "debit", "Food & Dining", "Keells", 19),
  tx("t26", "2026-05-23", "Uber · Ride", 1100, "debit", "Transport", "Uber", 7),
  tx("t27", "2026-05-22", "Dialog Bill", 2800, "debit", "Bills & Utilities", "Dialog", 8),
  tx("t28", "2026-05-21", "Keells Supermarket", 4300, "debit", "Food & Dining", "Keells", 17),
  tx("t29", "2026-05-20", "Odel · Accessories", 6200, "debit", "Shopping", "Odel", 14),
  tx("t30", "2026-05-19", "PickMe Food", 1420, "debit", "Food & Dining", "PickMe", 20),
  tx("t31", "2026-05-18", "Keells Supermarket", 4100, "debit", "Food & Dining", "Keells", 18),
  tx("t32", "2026-05-17", "Lanka Hospitals", 2200, "debit", "Healthcare", "Lanka Hospitals", 10),
  tx("t33", "2026-05-16", "Uber · Ride", 890, "debit", "Transport", "Uber", 8),
  tx("t34", "2026-05-15", "Dialog Bill", 2800, "debit", "Bills & Utilities", "Dialog", 9),
  tx("t35", "2026-05-14", "Keells delivery", 3400, "debit", "Food & Dining", "Keells", 19),
  tx("t36", "2026-05-13", "CEB Electricity", 4100, "debit", "Bills & Utilities", "CEB", 11),
  tx("t37", "2026-05-12", "PickMe · Ride", 580, "debit", "Transport", "PickMe", 7),
  tx("t38", "2026-05-11", "Keells Supermarket", 4700, "debit", "Food & Dining", "Keells", 17),
  tx("t39", "2026-05-10", "Netflix", 1750, "debit", "Shopping", "Netflix", 0),
  tx("t40", "2026-05-09", "Uber · Ride", 1050, "debit", "Transport", "Uber", 8),
  tx("t41", "2026-05-08", "Keells Supermarket", 4400, "debit", "Food & Dining", "Keells", 18),
  tx("t42", "2026-05-07", "School Fees", 15000, "debit", "Bills & Utilities", "School", 10),
  tx("t43", "2026-05-06", "Salary Credit · Hayleys Group", 185000, "credit", "Income", "Hayleys", 9),
  tx("t44", "2026-05-05", "Dialog Bill", 2800, "debit", "Bills & Utilities", "Dialog", 8),
  tx("t45", "2026-05-04", "Keells Supermarket", 4000, "debit", "Food & Dining", "Keells", 17),
  tx("t46", "2026-05-03", "Lanka Hospitals", 3100, "debit", "Healthcare", "Lanka Hospitals", 11),
  tx("t47", "2026-05-02", "PickMe · Ride", 690, "debit", "Transport", "PickMe", 8),
];

export const CATEGORY_COLORS: Record<string, string> = {
  "Food & Dining": "#059669",
  "Bills & Utilities": "#2563EB",
  Transport: "#D97706",
  Healthcare: "#E11D48",
  Shopping: "#7C3AED",
  Income: "#34D399",
  Loan: "#64748B",
};

export { CATEGORIES };
