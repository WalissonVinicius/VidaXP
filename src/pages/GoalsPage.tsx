import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Goal } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, X, Loader2, SlidersHorizontal, CheckCircle, Circle } from 'lucide-react';
import GoalCard from '@/components/goals/GoalCard';
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
import GoalForm from '@/components/goals/GoalForm';
import { motion, AnimatePresence } from 'framer-motion';

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'achieved' | 'in-progress'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Construct query for goals
      let query = supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id);

      // Apply filters
      if (filterStatus === 'achieved') {
        query = query.eq('achieved', true);
      } else if (filterStatus === 'in-progress') {
        query = query.eq('achieved', false);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      // Execute query
      const { data: goalsData, error: goalsError } = await query.order('created_at', { ascending: false });

      if (goalsError) throw goalsError;

      // Primeiro, obter todos os objetivos concluídos para calcular pontos reservados
      const { data: completedGoals, error: completedGoalsError } = await supabase
        .from('goals')
        .select('points_required')
        .eq('user_id', user.id)
        .eq('achieved', true);

      if (completedGoalsError) throw completedGoalsError;

      // Calcular pontos já reservados para objetivos concluídos
      const reservedPoints = completedGoals.reduce((sum, goal) => sum + goal.points_required, 0);

      // Fetch all completed tasks for points calculation
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('points')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (tasksError) throw tasksError;

      // Calcular pontos totais de todas as tarefas concluídas
      const totalTaskPoints = tasksData.reduce((sum, task) => sum + task.points, 0);

      // Os pontos disponíveis são os pontos totais menos os que já foram alocados a objetivos concluídos
      const availablePoints = Math.max(0, totalTaskPoints - reservedPoints);

      // Marcar pontos fixos para os objetivos concluídos
      const processedGoals = goalsData.map(goal => {
        // Se o objetivo está concluído, garantir que ele sempre mostre o valor exato com que foi concluído
        if (goal.achieved) {
          return {
            ...goal,
            // Quando concluído, o objetivo sempre mostra seu valor exato
            displayPoints: goal.points_required
          };
        }
        return goal;
      });

      setGoals(processedGoals);
      setTotalPoints(availablePoints);
    } catch (error) {
      console.error('Erro ao buscar dados dos objetivos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, filterStatus, searchQuery]);

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
    setSearchQuery('');
  };

  const hasActiveFilters = filterStatus !== 'all' || searchQuery !== '';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Objetivos</h2>
          <p className="text-muted-foreground">
            Defina e acompanhe seus objetivos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all font-medium">
              <Plus className="mr-2 h-5 w-5 animate-pulse" />
              Adicionar Objetivo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar um novo objetivo</DialogTitle>
            </DialogHeader>
            <GoalForm onSuccess={handleCreateSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar objetivos..."
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="shadow-sm hover:shadow-md bg-gradient-to-br from-primary/20 to-primary/10 transition-all duration-200 flex items-center"
            >
              <SlidersHorizontal className="mr-2 h-5 w-5 text-primary animate-pulse" />
              {filterStatus === 'all' ? 'Todos os Objetivos' :
                filterStatus === 'achieved' ? (
                  <span className="flex items-center">
                    <CheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                    Conquistados
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Circle className="mr-1.5 h-4 w-4 text-amber-500" />
                    Em Progresso
                  </span>
                )
              }
              {filterStatus !== 'all' && (
                <span className="ml-1.5 inline-flex h-2 w-2 rounded-full bg-primary"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center">
              <SlidersHorizontal className="h-4 w-4 text-primary mr-2" />
              Filtrar Status
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setFilterStatus('all')}
              className={filterStatus === 'all' ? "bg-accent text-accent-foreground" : ""}
            >
              Todos os Objetivos
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus('in-progress')}
              className={filterStatus === 'in-progress' ? "bg-accent text-accent-foreground" : ""}
            >
              <Circle className="mr-2 h-4 w-4 text-amber-500" />
              Em Progresso
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setFilterStatus('achieved')}
              className={filterStatus === 'achieved' ? "bg-accent text-accent-foreground" : ""}
            >
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Conquistados
            </DropdownMenuItem>
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

      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Carregando objetivos...</p>
        </div>
      ) : goals.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {goals.map((goal) => (
              <motion.div
                key={goal.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <GoalCard
                  goal={goal}
                  totalPoints={totalPoints}
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
          className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-lg border border-dashed border-muted shadow-sm"
        >
          {hasActiveFilters ? (
            <>
              <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xl font-medium mb-2">Nenhum objetivo encontrado</p>
              <p className="text-muted-foreground mb-6">
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
              <p className="text-xl font-medium mb-2">Comece a definir seus objetivos</p>
              <p className="text-muted-foreground mb-6">
                Crie seu primeiro objetivo para começar a acompanhar seu progresso
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-primary to-primary/80 shadow-md hover:shadow-lg transition-all font-medium">
                    <Plus className="mr-2 h-5 w-5 animate-pulse" />
                    Criar Seu Primeiro Objetivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar um novo objetivo</DialogTitle>
                  </DialogHeader>
                  <GoalForm onSuccess={fetchData} />
                </DialogContent>
              </Dialog>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}