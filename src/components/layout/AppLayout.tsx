import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Package,
  LogOut,
} from 'lucide-react';
import DockMorph from '@/components/ui/dock-morph';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Postagens', href: '/postagens', icon: FileText },
  { name: 'Prospecção', href: '/prospeccao', icon: Users },
  { name: 'Leads Inbound', href: '/leads-inbound', icon: Users },
  { name: 'Implementações', href: '/implementacoes', icon: Package },
];

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const dockItems = [
    ...navigation.map((item) => ({
      icon: item.icon,
      label: item.name,
      onClick: () => navigate(item.href),
      isActive: location.pathname === item.href,
    })),
    {
      icon: LogOut,
      label: 'Sair',
      onClick: handleSignOut,
      isActive: false,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 cyber-grid opacity-20" />
        <motion.div 
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 90, 0],
          }}
          transition={{ 
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        <motion.div 
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] rounded-full bg-primary/3 blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            rotate: [0, -90, 0],
          }}
          transition={{ 
            duration: 25,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <div className="relative z-10 pb-24">
        {/* Header */}
        <motion.header 
          className="sticky top-0 z-40 w-full border-b border-border/30 glass"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex h-16 items-center justify-between px-6">
            <motion.div 
              className="flex items-center gap-4"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="relative">
                <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/30 shadow-glow-sm">
                  <img src={logo} alt="GetMore Logo" className="h-full w-full object-cover" />
                </div>
                <motion.div 
                  className="absolute -inset-1 rounded-xl border border-primary/20"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0, 0.5]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
              <div>
                <h1 className="text-xl font-display text-foreground tracking-wider">GETMORE</h1>
                <p className="text-xs text-muted-foreground -mt-0.5">Sistema de Gestão</p>
              </div>
            </motion.div>
            <ThemeToggle />
          </div>
        </motion.header>

        {/* Main content */}
        <motion.main 
          className="p-6 lg:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>

      {/* Dock navigation */}
      <DockMorph items={dockItems} position="bottom" />
    </div>
  );
}