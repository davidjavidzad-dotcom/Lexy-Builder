import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
}

export function ProgressBar({ value, max = 100, className, ...props }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  return (
    <div className={cn("w-full bg-secondary h-2 rounded-full overflow-hidden", className)} {...props}>
      <div 
        className="bg-primary h-full transition-all duration-500 ease-in-out" 
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}
