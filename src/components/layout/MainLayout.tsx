import { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from './Header';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate, useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
}

const tabs = [
  { id: 'dashboard', label: 'Painel', path: '/' },
  { id: 'tasks', label: 'Tarefas', path: '/tarefas' },
  { id: 'goals', label: 'Objetivos', path: '/objetivos' },
  { id: 'categories', label: 'Categorias', path: '/categorias' },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Determina a aba ativa com base no caminho atual
  const activeTab = tabs.find(tab =>
    currentPath === tab.path ||
    (tab.path !== '/' && currentPath.startsWith(tab.path))
  )?.id || 'dashboard';

  const handleTabChange = (value: string) => {
    const tab = tabs.find(t => t.id === value);
    if (tab) {
      navigate(tab.path);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full">
        <div className="w-full px-2 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6 lg:px-8 xl:px-12">
          <Tabs
            defaultValue={activeTab}
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            {/* Versão mobile: tabs centralizadas */}
            <div className="lg:hidden flex justify-center">
              <TabsList className="grid w-full max-w-screen-md grid-cols-4 mb-4 sm:mb-8">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-xs sm:text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Versão desktop: tabs ocupam toda a largura */}
            <div className="hidden lg:block">
              <TabsList className="grid w-full grid-cols-4 mb-4 sm:mb-8">
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id} className="text-sm">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <div className="pb-16 w-full">
              <div className="w-full flex justify-center lg:justify-start">
                <div className="w-full max-w-screen-md lg:max-w-full">
                  {children}
                </div>
              </div>
            </div>
          </Tabs>
        </div>
      </main>

      <Toaster />
    </div>
  );
}