import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Moon, Sun, UserIcon, Menu, X } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export default function Header() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md w-full">
      <div className="w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center space-x-2 font-bold text-xl"
          >
            <Trophy className="h-6 w-6 text-primary" />
            <span>VidaXP</span>
          </Link>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Alternar menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2 font-bold">
                      <Trophy className="h-5 w-5 text-primary" />
                      <span>VidaXP</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <X className="h-5 w-5" />
                      <span className="sr-only">Fechar menu</span>
                    </Button>
                  </div>

                  <div className="space-y-2 flex-1">
                    {user ? (
                      <>
                        <div className="flex items-center py-2 px-3 space-x-3 rounded-md bg-muted">
                          <UserIcon className="h-5 w-5 text-primary" />
                          <span className="text-sm truncate">{user.email}</span>
                        </div>
                        <Button
                          variant="ghost"
                          className="w-full justify-start hover:bg-primary/10 transition-colors"
                          onClick={toggleTheme}
                        >
                          {theme === 'dark' ? (
                            <Sun className="mr-2 h-5 w-5 text-yellow-500 animate-pulse" />
                          ) : (
                            <Moon className="mr-2 h-5 w-5 text-indigo-500 animate-pulse" />
                          )}
                          {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-full justify-start"
                          onClick={handleSignOut}
                        >
                          Sair
                        </Button>
                      </>
                    ) : (
                      <>
                        <Link to="/login">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Entrar
                          </Button>
                        </Link>
                        <Link to="/cadastro">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Cadastrar
                          </Button>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full h-10 w-10 flex items-center justify-center bg-primary/10 hover:bg-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-500 hover:rotate-12 transition-transform duration-200" />
              ) : (
                <Moon className="h-5 w-5 text-indigo-500 hover:-rotate-12 transition-transform duration-200" />
              )}
              <span className="sr-only">Alternar tema</span>
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors shadow-sm hover:shadow"
                  >
                    <UserIcon className="h-4 w-4 text-primary" />
                    <span className="max-w-[150px] truncate">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem disabled className="opacity-70">
                    <UserIcon className="mr-2 h-4 w-4 text-primary" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/cadastro">
                  <Button>Cadastrar</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}