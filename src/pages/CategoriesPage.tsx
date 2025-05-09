import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, Loader2 } from 'lucide-react';
import CategoryCard from '@/components/categories/CategoryCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CategoryForm from '@/components/categories/CategoryForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Construct query for categories
      let query = supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Execute query
      const { data: categoriesData, error: categoriesError } = await query.order('name');

      if (categoriesError) throw categoriesError;

      setCategories(categoriesData);

      // Fetch task counts for each category
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('category_id')
        .eq('user_id', user.id);

      if (tasksError) throw tasksError;

      const counts: Record<string, number> = {};

      tasksData.forEach((task) => {
        if (task.category_id) {
          counts[task.category_id] = (counts[task.category_id] || 0) + 1;
        }
      });

      setTaskCounts(counts);
    } catch (error) {
      console.error('Erro ao buscar dados de categorias:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, searchQuery]);

  const handleCreateSuccess = () => {
    setIsDialogOpen(false);
    fetchData();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categorias</h2>
          <p className="text-muted-foreground">
            Organize suas tarefas em categorias
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all font-medium">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar uma nova categoria</DialogTitle>
            </DialogHeader>
            <CategoryForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar categorias..."
          className="pl-9 pr-10 focus-within:ring-2 ring-primary/20 shadow-sm hover:shadow transition-all duration-200"
          value={searchQuery}
          onChange={handleSearch}
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
            onClick={handleClearSearch}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Limpar busca</span>
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando categorias...</p>
        </div>
      ) : categories.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {categories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <CategoryCard
                  category={category}
                  taskCount={taskCounts[category.id] || 0}
                  onUpdate={fetchData}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-xl font-medium mb-2">Nenhuma categoria encontrada</p>
          <p className="text-muted-foreground mb-6">
            {searchQuery
              ? "Tente ajustar seu termo de busca"
              : "Crie sua primeira categoria para organizar suas tarefas"}
          </p>
          {searchQuery ? (
            <Button variant="outline" onClick={handleClearSearch}>
              <X className="mr-2 h-4 w-4" />
              Limpar Busca
            </Button>
          ) : (
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Sua Primeira Categoria
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar uma nova categoria</DialogTitle>
                </DialogHeader>
                <CategoryForm onSuccess={fetchData} />
              </DialogContent>
            </Dialog>
          )}
        </motion.div>
      )}
    </div>
  );
}