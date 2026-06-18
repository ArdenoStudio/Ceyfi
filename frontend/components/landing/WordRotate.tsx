"use client"

import React from "react"
import { AnimatePresence, HTMLMotionProps, motion } from "motion/react"

import { cn } from "@/lib/utils"

export interface WordRotateProps {
  words: string[]
  duration?: number
}

export function WordRotate({
  words,
  className,
  duration = 3000,
}: HTMLMotionProps<"div"> & WordRotateProps) {
  const [index, setIndex] = React.useState(0)

  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1))
    }, duration)
    return () => clearTimeout(timeoutId)
  }, [index, words, duration])

  return (
    <span className="inline-block overflow-hidden align-bottom pb-1 -mb-1">
      <AnimatePresence mode="wait">
        <motion.span
          key={words[index]}
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -12, filter: "blur(6px)" }}
          transition={{
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
          className={cn("inline-block", className)}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}
