"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border border-border/30 bg-card text-card-foreground",
      "shadow-[0_1px_2px_0_rgb(0_0_0_/_0.05),_0_1px_3px_1px_rgb(0_0_0_/_0.03)]",
      "hover:shadow-[0_4px_6px_-1px_rgb(0_0_0_/_0.08),_0_2px_4px_-2px_rgb(0_0_0_/_0.03)]",
      "transition-all duration-300 hover:-translate-y-0.5",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

export { Card, CardContent } 