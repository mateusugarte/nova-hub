import React, { useRef } from "react";
import { cn } from "@/lib/utils";
import { 
  motion, 
  useMotionValue, 
  useMotionTemplate, 
  useAnimationFrame 
} from "framer-motion";

interface InfiniteGridProps {
  children?: React.ReactNode;
  className?: string;
}

export const InfiniteGrid = ({ children, className }: InfiniteGridProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top } = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - left);
    mouseY.set(e.clientY - top);
  };

  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const speedX = 0.3; 
  const speedY = 0.3;

  useAnimationFrame(() => {
    const currentX = gridOffsetX.get();
    const currentY = gridOffsetY.get();
    gridOffsetX.set((currentX + speedX) % 40);
    gridOffsetY.set((currentY + speedY) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative w-full min-h-screen overflow-hidden bg-background",
        className
      )}
    >
      {/* Static grid layer */}
      <div className="absolute inset-0 z-0 opacity-[0.03]">
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </div>
      
      {/* Mouse-following grid layer */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-20"
        style={{ maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} />
      </motion.div>

      {/* Gradient blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute right-[-15%] top-[-15%] w-[35%] h-[35%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute left-[-10%] bottom-[-15%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

const GridPattern = ({ offsetX, offsetY }: { offsetX: any, offsetY: any }) => {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id="grid-pattern-main"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-muted-foreground" 
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-pattern-main)" />
    </svg>
  );
};

export default InfiniteGrid;
