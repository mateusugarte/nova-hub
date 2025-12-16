import { motion } from 'framer-motion';

interface LoadingScreenProps {
  fullScreen?: boolean;
}

export default function LoadingScreen({ fullScreen = true }: LoadingScreenProps) {
  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-md"
    : "absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-lg";
    
  return (
    <div className={containerClass}>
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Outer ring */}
        <motion.div
          className="h-12 w-12 rounded-full border-4 border-primary/20"
          style={{ borderTopColor: 'hsl(var(--primary))' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner ring */}
        <motion.div
          className="absolute inset-2 rounded-full border-4 border-primary/10"
          style={{ borderBottomColor: 'hsl(var(--primary) / 0.6)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Center dot */}
        <motion.div
          className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-primary"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
    </div>
  );
}
