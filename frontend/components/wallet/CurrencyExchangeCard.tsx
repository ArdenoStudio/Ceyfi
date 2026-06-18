"use client";

import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { RefreshCw, ArrowRightLeft } from "lucide-react";
import {
  REMITTANCE_CURRENCIES,
  LKR_CURRENCY,
  type RemittanceCurrency,
} from "@/lib/remittance-fx";

// --- Currency Selector ---
const CurrencySelector = ({
  selected,
  onChange,
  options,
  disabled,
}: {
  selected: RemittanceCurrency;
  onChange?: (code: string) => void;
  options: RemittanceCurrency[];
  disabled?: boolean;
}) => {
  if (disabled) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-lg font-medium">
        <img src={selected.flag} alt={selected.name} className="h-6 w-6 rounded-full object-cover" />
        <span>{selected.code}</span>
      </div>
    );
  }

  return (
    <Select value={selected.code} onValueChange={onChange}>
      <SelectTrigger className="w-auto border-none bg-transparent shadow-none focus:ring-0 gap-1">
        <div className="flex items-center gap-2 text-lg font-medium">
          <img src={selected.flag} alt={selected.name} className="h-6 w-6 rounded-full object-cover" />
          <span>{selected.code}</span>
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <div className="flex items-center gap-3">
              <img src={c.flag} alt={c.name} className="h-5 w-5 rounded-full object-cover" />
              <span>{c.code} – {c.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// --- Props ---
interface CurrencyExchangeCardProps {
  initialFromCurrency: RemittanceCurrency;
  availableBalance?: number;
  taxRate?: number;
  feeRate?: number;
  onExchange: (data: {
    from: RemittanceCurrency;
    amount: number;
    amountLkr: number;
  }) => void;
  className?: string;
}

// --- Main Component ---
export function CurrencyExchangeCard({
  initialFromCurrency,
  availableBalance,
  taxRate = 0,
  feeRate = 0,
  onExchange,
  className,
}: CurrencyExchangeCardProps) {
  const [amount, setAmount] = useState("100.00");
  const [fromCurrency, setFromCurrency] = useState<RemittanceCurrency>(initialFromCurrency);
  const [animationKey, setAnimationKey] = useState(0);

  const numericAmount = parseFloat(amount) || 0;

  const { tax, fee, totalAmount } = useMemo(() => {
    const calculatedTax = numericAmount * taxRate;
    const calculatedFee = numericAmount * feeRate;
    const net = numericAmount - calculatedTax - calculatedFee;
    return {
      tax: calculatedTax,
      fee: calculatedFee,
      totalAmount: net > 0 ? Math.round(net * fromCurrency.lkrRate) : 0,
    };
  }, [numericAmount, taxRate, feeRate, fromCurrency]);

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
  }

  function handleFromCurrencyChange(code: string) {
    const c = REMITTANCE_CURRENCIES.find((x) => x.code === code);
    if (c) {
      setAnimationKey((k) => k + 1);
      setTimeout(() => setFromCurrency(c), 150);
    }
  }

  function handleSwap() {
    setAnimationKey((k) => k + 1);
  }

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Currency pair row */}
      <div className="relative flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <motion.div
          key={`${animationKey}-from`}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <CurrencySelector
            selected={fromCurrency}
            onChange={handleFromCurrencyChange}
            options={REMITTANCE_CURRENCIES}
          />
        </motion.div>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={handleSwap}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        </div>

        <motion.div
          key={`${animationKey}-to`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          <CurrencySelector selected={LKR_CURRENCY} options={[LKR_CURRENCY]} disabled />
        </motion.div>
      </div>

      {/* Big amount input */}
      <div className="relative py-4 text-center">
        <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-7xl font-bold text-gray-100 select-none">
          {fromCurrency.code}
        </span>
        <Input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          className="h-auto border-none bg-transparent p-0 text-center text-7xl font-bold tracking-tighter shadow-none focus-visible:ring-0 text-gray-900"
          placeholder="0.00"
        />
        {availableBalance !== undefined && (
          <p className="mt-1 text-sm text-gray-400">
            Available:{" "}
            <span className="font-semibold text-gray-600">
              {availableBalance.toLocaleString("en-US", {
                style: "currency",
                currency: fromCurrency.code,
              })}
            </span>
          </p>
        )}
      </div>

      {/* Rate pill */}
      <div className="rounded-xl bg-gray-50 px-4 py-3 text-center text-sm text-gray-500">
        1 {fromCurrency.code} ={" "}
        <span className="font-semibold text-gray-800">{fromCurrency.lkrRate}</span> LKR
      </div>

      {/* Fee breakdown */}
      <div className="space-y-2 text-sm">
        {taxRate > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Tax ({taxRate * 100}%)</span>
            <span>
              {tax.toLocaleString("en-US", { style: "currency", currency: fromCurrency.code })}
            </span>
          </div>
        )}
        {feeRate > 0 && (
          <div className="flex justify-between text-gray-500">
            <span>Exchange fee ({feeRate * 100}%)</span>
            <span>
              {fee.toLocaleString("en-US", { style: "currency", currency: fromCurrency.code })}
            </span>
          </div>
        )}
        <div className={cn("flex justify-between font-semibold text-gray-900", (taxRate > 0 || feeRate > 0) && "border-t border-gray-100 pt-2")}>
          <span>Total in LKR</span>
          <span>
            {totalAmount.toLocaleString("en-US", {
              style: "currency",
              currency: "LKR",
              minimumFractionDigits: 0,
            })}
          </span>
        </div>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="w-full bg-[#E31821] text-base font-bold text-white hover:bg-[#c41219]"
        onClick={() =>
          onExchange({ from: fromCurrency, amount: numericAmount, amountLkr: totalAmount })
        }
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Use this amount
      </Button>
    </div>
  );
}
