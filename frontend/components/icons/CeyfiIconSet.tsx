import type { ReactNode, SVGProps } from "react";

/** CEYFI brand green — icons inherit via `currentColor` by default. */
export const CEYFI_ICON_GREEN = "#059669";

type CeyfiIconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function CeyfiIconBase({
  children,
  title,
  ...props
}: CeyfiIconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Wallet with internal bucket partitions — savings allocation. */
export function WalletBucketIcon({ title, ...props }: CeyfiIconProps) {
  return (
    <CeyfiIconBase title={title} {...props}>
      <path d="M4 8.5V18a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.5" />
      <path d="M4 8.5h16" />
      <path d="M7 6.5V8.5" />
      <path d="M17 6.5V8.5" />
      <path d="M8 12v5" />
      <path d="M12 12v5" />
      <path d="M16 12v5" />
      <rect x="3" y="6.5" width="18" height="2.5" rx="1" />
      <circle cx="17.5" cy="14" r="1" fill="currentColor" stroke="none" />
    </CeyfiIconBase>
  );
}

/** Outgoing transfer with globe arc — remittances and send-money flows. */
export function RemittanceIcon({ title, ...props }: CeyfiIconProps) {
  return (
    <CeyfiIconBase title={title} {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15.3 15.3 0 0 1 4 9 15.3 15.3 0 0 1-4 9 15.3 15.3 0 0 1-4-9 15.3 15.3 0 0 1 4-9z" />
      <path d="M14.5 9.5 18 12l-3.5 2.5" />
      <path d="M18 12h-5" />
    </CeyfiIconBase>
  );
}

/** Mason jar with lid — tax reserve and compliance savings. */
export function TaxJarIcon({ title, ...props }: CeyfiIconProps) {
  return (
    <CeyfiIconBase title={title} {...props}>
      <path d="M8.5 5h7" />
      <path d="M9 5V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
      <path d="M7 8h10l-.5 12a1.5 1.5 0 0 1-1.5 1.5H9a1.5 1.5 0 0 1-1.5-1.5L7 8z" />
      <path d="M10 12h4" />
      <path d="M11.5 15h1" />
      <circle cx="12" cy="12" r="0.75" fill="currentColor" stroke="none" />
    </CeyfiIconBase>
  );
}

/** Document with repayment schedule — loans and credit facilities. */
export function LoanIcon({ title, ...props }: CeyfiIconProps) {
  return (
    <CeyfiIconBase title={title} {...props}>
      <path d="M8 4h8l2 2v14a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
      <path d="M16 4v2h2" />
      <path d="M9 11h6" />
      <path d="M9 14h4" />
      <path d="M9 17h5" />
      <path d="M15.5 14.5 18 17l-2.5 2.5" />
    </CeyfiIconBase>
  );
}

/** AI sparkle — intelligence and assistant features. */
export function AiSparkleIcon({ title, ...props }: CeyfiIconProps) {
  return (
    <CeyfiIconBase title={title} {...props}>
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.6 5.6 7.7 7.7" />
      <path d="M16.3 16.3 18.4 18.4" />
      <path d="M18.4 5.6 16.3 7.7" />
      <path d="M7.7 16.3 5.6 18.4" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    </CeyfiIconBase>
  );
}

export type CeyfiIconName =
  | "wallet-bucket"
  | "remittance"
  | "tax-jar"
  | "loan"
  | "ai-sparkle";

const ICON_MAP = {
  "wallet-bucket": WalletBucketIcon,
  remittance: RemittanceIcon,
  "tax-jar": TaxJarIcon,
  loan: LoanIcon,
  "ai-sparkle": AiSparkleIcon,
} as const;

export function CeyfiIcon({
  name,
  ...props
}: CeyfiIconProps & { name: CeyfiIconName }) {
  const Icon = ICON_MAP[name];
  return <Icon {...props} />;
}
