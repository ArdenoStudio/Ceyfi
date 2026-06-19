"use client";

import { PieChart } from "lucide-react";
import { Bucket } from "@/types";
import { EmptyState } from "@/components/EmptyState";
import { BucketCard } from "./BucketCard";

interface BucketGridProps {
  buckets: Bucket[];
}

export function BucketGrid({ buckets }: BucketGridProps) {
  if (buckets.length === 0) {
    return (
      <EmptyState
        icon={PieChart}
        title="No buckets configured yet"
        description="Send your first remittance to create school, household, and savings buckets."
        className="rounded-[22px] border border-dashed border-ceyfi-line bg-ceyfi-canvas/50 dark:border-white/[0.08]"
      />
    );
  }

  return (
    <div className="stagger grid grid-cols-1 md:grid-cols-3 gap-4">
      {buckets.map((bucket) => (
        <BucketCard key={bucket.bucket_id} bucket={bucket} />
      ))}
    </div>
  );
}
