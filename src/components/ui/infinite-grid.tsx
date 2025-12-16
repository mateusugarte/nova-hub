import React from "react";
import { cn } from "@/lib/utils";

interface InfiniteGridProps {
  children?: React.ReactNode;
  className?: string;
}

export const InfiniteGrid = ({ children, className }: InfiniteGridProps) => {
  return (
    <div
      className={cn(
        "relative w-full min-h-screen overflow-hidden bg-background",
        className
      )}
    >
      {/* Static grid pattern - much lighter */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.015] dark:opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--muted-foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--muted-foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Subtle gradient accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-0 top-0 w-1/3 h-1/3 rounded-full bg-primary/3 dark:bg-primary/5 blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default InfiniteGrid;