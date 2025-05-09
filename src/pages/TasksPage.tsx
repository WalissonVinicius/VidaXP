import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task, Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Plus, Search, FilterIcon, X, Loader2 } from 'lucide-react';
import TaskCard from '@/components/tasks/TaskCard';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import TaskForm from '@/components/tasks/TaskForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) throw categoriesError;

      const categoriesMap: Record<string, Category> = {};
      categoriesData.forEach((category) => {
        categoriesMap[category.id] = category;
      });

      setCategories(categoriesMap);

      // Construct query for tasks
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filterStatus === 'completed') {
        query = query.eq('completed', true);
      } else if (filterStatus === 'pending') {
        query = query.eq('completed', false);
      }

      if (categoryFilter) {
        query = query.eq('category_id', categoryFilter);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Execute query
      const { data: tasksData, error: tasksError } = await query.order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      setTasks(tasksData);
    } catch (error) {
      console.error('Erro ao buscar dados das tarefas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, filterStatus, categoryFilter, searchQuery]);

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

  const handleClearFilters = () => {
    setFilterStatus('all');
    setCategoryFilter(null);
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus !== 'all' || categoryFilter !== null || searchQuery !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Tarefas</h2>
          <p className="text-muted-foreground">
            Gerencie suas tarefas e acompanhe seu progresso
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all font-medium">
              <Plus className="mr-2 h-5 w-5 animate-pulse" />
              Adicionar Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar uma nova tarefa</DialogTitle>
            </DialogHeader>
            <TaskForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
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

        <div className="flex gap-2">
          <Tabs
            value={filterStatus}
            onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}
            className="w-full md:w-auto"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="completed">Concluídas</TabsTrigger>
            </TabsList>
          </Tabs>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 shadow hover:shadow-md transition-all duration-200 flex items-center justify-center"
              >
                <FilterIcon className="h-5 w-5 text-primary animate-pulse" />
                {categoryFilter !== null && (
                  <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary"></span>
                )}
                <span className="sr-only">Filtrar</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="flex items-center">
                <FilterIcon className="h-4 w-4 text-primary mr-2" />
                Filtrar por Categoria
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setCategoryFilter(null)}
                className={categoryFilter === null ? "bg-accent text-accent-foreground" : ""}
              >
                Todas as Categorias
              </DropdownMenuItem>
              {Object.values(categories).map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  className={categoryFilter === category.id ? "bg-accent text-accent-foreground" : ""}
                >
                  <div className="flex items-center">
                    <div
                      className="h-3 w-3 rounded-full mr-2"
                      style={{ backgroundColor: category.color }}
                    />
                    {category.name}
                  </div>
                </DropdownMenuItem>
              ))}
              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleClearFilters} className="text-red-500 font-medium hover:text-red-600 hover:bg-red-50">
                    <X className="mr-2 h-4 w-4" />
                    Limpar Todos os Filtros
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando tarefas...</p>
        </div>
      ) : tasks.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TaskCard
                  task={task}
                  category={categories[task.category_id]}
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
          className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border border-dashed border-muted shadow-sm"
        >
          {searchQuery || categoryFilter || filterStatus !== 'all' ? (
            <>
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium mb-2">Nenhuma tarefa encontrada</p>
              <p className="text-muted-foreground mb-4">
                Tente ajustar seus filtros ou termos de busca
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <p className="text-xl font-medium mb-2">Nenhuma tarefa ainda</p>
              <p className="text-muted-foreground mb-4">
                Você ainda não tem tarefas. Crie uma nova tarefa para começar!
              </p>
              <Button
                onClick={() => setIsDialogOpen(true)}
                className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all font-medium"
              >
                <Plus className="mr-2 h-5 w-5 animate-pulse" />
                Adicionar Tarefa
              </Button>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}