"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

interface VerificationCardProps {
  backgroundImage?: string;
  idNumber?: string;
  name?: string;
  validThru?: string;
  label?: string;
  className?: string;
}

export function VerificationCard({
  backgroundImage = "https://images.unsplash.com/photo-1588392382834-a891154bca4d?w=640&q=80",
  idNumber = "ID **** 4590",
  name = "JANE DOE",
  validThru = "11/29",
  label = "IDENTITY CARD",
  className,
}: VerificationCardProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative h-52 w-full rounded-2xl p-6 shadow-2xl text-white flex flex-col justify-between bg-cover bg-center",
        className
      )}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 rounded-2xl bg-black/55" />

      {/* Card Content */}
      <div className="relative z-10 flex items-start justify-between text-xs tracking-wide opacity-70">
        <span className="font-semibold uppercase tracking-widest">{label}</span>
        <span className="font-mono">VALID</span>
      </div>

      <div className="relative z-10">
        <p className="font-mono text-lg tracking-widest font-semibold">{idNumber}</p>
        <div className="mt-2 flex items-end justify-between text-sm">
          <span className="font-semibold uppercase tracking-wider">{name}</span>
          <span className="font-mono text-xs opacity-70">{validThru}</span>
        </div>
      </div>
    </motion.div>
  );
}
