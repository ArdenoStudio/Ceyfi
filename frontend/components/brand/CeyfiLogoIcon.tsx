import Image from "next/image";
import { cn } from "@/lib/utils";

interface CeyfiLogoIconProps {
  size?: number;
  className?: string;
  priority?: boolean;
}

/** CEYFI app icon — green tile with white leaf mark. */
export function CeyfiLogoIcon({
  size = 40,
  className,
  priority = false,
}: CeyfiLogoIconProps) {
  return (
    <Image
      src="/ceyfi-icon.svg"
      alt="CEYFI"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );
}
