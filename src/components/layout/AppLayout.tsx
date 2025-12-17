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
import InfiniteGrid from '@/components/ui/infinite-grid';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import logo from '@/assets/logo.png';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Agenda', href: '/agenda', icon: Calendar },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Postagens', href: '/postagens', icon: FileText },
  { name: 'Prospecção', href: '/prospeccao', icon: Users },
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
    <InfiniteGrid>
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm">
                <img src={logo} alt="GetMore Logo" className="h-full w-full object-cover" />
              </div>
              <h1 className="text-lg font-display text-primary">GetMore</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
      <DockMorph items={dockItems} position="bottom" />
    </InfiniteGrid>
  );
}
