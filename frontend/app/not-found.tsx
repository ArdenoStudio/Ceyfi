import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-ceyfi-green/10 mb-4">
          <span className="text-2xl font-bold text-ceyfi-green">404</span>
        </div>
        <h1 className="text-xl font-bold text-ceyfi-ink mb-2">
          Page not found
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          This page doesn&apos;t exist in CEYFI.
        </p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
