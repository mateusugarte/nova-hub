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
        <main className="p-6 lg:p-8">
          {children}
        </main>
      </div>
      <DockMorph items={dockItems} position="bottom" />
    </InfiniteGrid>
  );
}
