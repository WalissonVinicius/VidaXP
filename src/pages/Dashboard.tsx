import PointsOverview from '@/components/dashboard/PointsOverview';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Task, Goal, Category } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TaskCard from '@/components/tasks/TaskCard';
import GoalCard from '@/components/goals/GoalCard';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentTasks, setRecentTasks] = useState<Task[]>([]);
  const [recentGoals, setRecentGoals] = useState<Goal[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [totalPoints, setTotalPoints] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

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

      // Fetch recent tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (tasksError) throw tasksError;

      setRecentTasks(tasksData);

      // Primeiro, obter todos os objetivos concluídos para calcular pontos reservados
      const { data: completedGoals, error: completedGoalsError } = await supabase
        .from('goals')
        .select('points_required')
        .eq('user_id', user.id)
        .eq('achieved', true);

      if (completedGoalsError) throw completedGoalsError;

      // Calcular pontos já reservados para objetivos concluídos
      const reservedPoints = completedGoals.reduce((sum, goal) => sum + goal.points_required, 0);

      // Fetch all tasks for points calculation
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('points, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      if (allTasksError) throw allTasksError;

      // Calcular o total de pontos de todas as tarefas concluídas
      const totalTaskPoints = allTasks.reduce((sum, task) => sum + task.points, 0);

      // Os pontos disponíveis são os pontos totais menos os que já foram alocados a objetivos concluídos
      const availablePoints = Math.max(0, totalTaskPoints - reservedPoints);

      setTotalPoints(availablePoints);

      // Fetch recent goals
      const { data: goalsData, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(3);

      if (goalsError) throw goalsError;

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

      setRecentGoals(processedGoals);
    } catch (error) {
      console.error('Erro ao buscar dados do painel:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] px-4 text-center">
        <h1 className="text-3xl font-bold mb-6">Bem-vindo ao VidaXP</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg">
          Transforme sua vida em uma jornada com tarefas, pontos e objetivos.
          Faça login para iniciar sua aventura!
        </p>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/login')}>Entrar</Button>
          <Button variant="outline" onClick={() => navigate('/cadastro')}>
            Criar Conta
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div>
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-4" />
                <div className="h-2 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Painel</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Acompanhe seu progresso e conquistas
        </p>
      </div>

      <PointsOverview />

      <div className="grid gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-x-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Tarefas Recentes</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Suas últimas tarefas adicionadas</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/tarefas')} className="whitespace-nowrap text-xs sm:text-sm">
              Ver Todas
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    category={categories[task.category_id]}
                    onUpdate={fetchData}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 sm:py-8 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Nenhuma tarefa ainda</p>
                  <Button onClick={() => navigate('/tarefas')} size="sm" className="text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Adicionar Primeira Tarefa
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-x-2">
            <div>
              <CardTitle className="text-base sm:text-lg">Seus Objetivos</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Acompanhe seu progresso</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={() => navigate('/objetivos')} className="whitespace-nowrap text-xs sm:text-sm">
              Ver Todos
              <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentGoals.length > 0 ? (
                recentGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    totalPoints={totalPoints}
                    onUpdate={fetchData}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-6 sm:py-8 text-center"
                >
                  <p className="text-sm text-muted-foreground mb-3 sm:mb-4">Nenhum objetivo ainda</p>
                  <Button onClick={() => navigate('/objetivos')} size="sm" className="text-xs sm:text-sm">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Criar Seu Primeiro Objetivo
                  </Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}