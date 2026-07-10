/** Must match backend /api/fx GBP→LKR demo rate and wallet transfer logic. */
export const GBP_LKR_RATE = 408.3;

/** Integer LKR credited (bank-style rounding from GBP). */
export function gbpToLkr(amountGbp: number): number {
  return Math.round(amountGbp * GBP_LKR_RATE);
}

export interface RemittanceCurrency {
  code: string;
  name: string;
  flag: string;
  lkrRate: number;
  symbol: string;
}

/** Demo FX rates to LKR. Update alongside backend /api/fx when rates change. */
/** Rates aligned with backend GET /api/fx (demo_fixture). */
export const REMITTANCE_CURRENCIES: RemittanceCurrency[] = [
  { code: "GBP", name: "British Pound",    flag: "https://flagcdn.com/gb.svg", lkrRate: 408.3,  symbol: "£"   },
  { code: "USD", name: "US Dollar",        flag: "https://flagcdn.com/us.svg", lkrRate: 323.5,  symbol: "$"   },
  { code: "EUR", name: "Euro",             flag: "https://flagcdn.com/eu.svg", lkrRate: 351.2,  symbol: "€"   },
  { code: "AUD", name: "Australian Dollar",flag: "https://flagcdn.com/au.svg", lkrRate: 211.4,  symbol: "A$"  },
  { code: "CAD", name: "Canadian Dollar",  flag: "https://flagcdn.com/ca.svg", lkrRate: 234.7,  symbol: "C$"  },
  { code: "AED", name: "UAE Dirham",       flag: "https://flagcdn.com/ae.svg", lkrRate:  87.3,  symbol: "د.إ" },
  { code: "SGD", name: "Singapore Dollar", flag: "https://flagcdn.com/sg.svg", lkrRate: 238.1,  symbol: "S$"  },
  { code: "JPY", name: "Japanese Yen",     flag: "https://flagcdn.com/jp.svg", lkrRate:   2.14, symbol: "¥"   },
];

export const LKR_CURRENCY: RemittanceCurrency = {
  code: "LKR", name: "Sri Lankan Rupee", flag: "https://flagcdn.com/lk.svg", lkrRate: 1, symbol: "LKR",
};

export function toLkr(amount: number, currency: RemittanceCurrency): number {
  return Math.round(amount * currency.lkrRate);
}
