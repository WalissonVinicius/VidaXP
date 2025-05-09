import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Trophy, CheckCircle, ListTodo } from 'lucide-react';

export default function PointsOverview() {
  const { user } = useAuth();
  const [achievedPoints, setAchievedPoints] = useState(0);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [achievedGoals, setAchievedGoals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Fetch tasks
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select('points, completed')
          .eq('user_id', user.id);

        if (tasksError) throw tasksError;

        // Calculate points and task counts
        const taskPoints = tasks
          .filter(task => task.completed)
          .reduce((sum, task) => sum + task.points, 0);

        const completed = tasks.filter(task => task.completed).length;

        // Fetch achieved goals
        const { data: goals, error: goalsError } = await supabase
          .from('goals')
          .select('points_required, achieved')
          .eq('user_id', user.id);

        if (goalsError) throw goalsError;

        // Calcular pontos já alocados em objetivos concluídos
        const completedGoals = goals.filter(goal => goal.achieved);
        const goalPoints = completedGoals.reduce((sum, goal) => sum + goal.points_required, 0);

        // Pontos disponíveis
        setAvailablePoints(Math.max(0, taskPoints - goalPoints));

        // Pontos concluídos (alocados para objetivos)
        setAchievedPoints(goalPoints);

        setCompletedTasks(completed);
        setTotalTasks(tasks.length);
        setAchievedGoals(completedGoals.length);
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  // Calculate completion percentage
  const completionPercentage = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="XP Disponível"
        value={availablePoints}
        icon={<Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
        description={`${achievedPoints} XP alocados a objetivos`}
        isLoading={isLoading}
        valuePrefix=""
        valueSuffix=" XP"
        color="from-yellow-500 to-orange-500"
      />

      <StatsCard
        title="Tarefas Concluídas"
        value={completedTasks}
        icon={<CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />}
        description={`${completionPercentage}% de conclusão`}
        isLoading={isLoading}
        valuePrefix=""
        valueSuffix={` / ${totalTasks}`}
        color="from-green-500 to-emerald-600"
      />

      <StatsCard
        title="Tarefas Ativas"
        value={totalTasks - completedTasks}
        icon={<ListTodo className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />}
        description="Tarefas a completar"
        isLoading={isLoading}
        valuePrefix=""
        valueSuffix=""
        color="from-blue-500 to-indigo-600"
      />

      <StatsCard
        title="Objetivos Alcançados"
        value={achievedGoals}
        icon={<Trophy className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500" />}
        description="Metas concluídas"
        isLoading={isLoading}
        valuePrefix=""
        valueSuffix=""
        color="from-purple-500 to-pink-600"
      />
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  isLoading: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  color: string;
}

function StatsCard({
  title,
  value,
  description,
  icon,
  isLoading,
  valuePrefix = "",
  valueSuffix = "",
  color
}: StatsCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 px-3 sm:px-4 py-2 sm:py-3">
        <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
          {title}
        </CardTitle>
        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-muted/50 flex items-center justify-center shadow-sm">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-4 py-2 sm:py-3">
        <div className="text-lg sm:text-2xl font-bold">
          {isLoading ? (
            <div className="h-6 sm:h-8 w-16 sm:w-24 bg-muted animate-pulse rounded" />
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {valuePrefix}
              </motion.span>
              <CountUp value={value} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                {valueSuffix}
              </motion.span>
            </motion.div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 sm:mt-2 truncate">
          {description}
        </p>
        <div className="mt-2 sm:mt-4 h-1 w-full rounded-full bg-muted overflow-hidden">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${color}`}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function CountUp({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startValue = 0;
    const duration = 1500;
    const increment = value / (duration / 16);

    const updateValue = () => {
      startValue += increment;
      if (startValue >= value) {
        startValue = value;
        clearInterval(timer);
      }
      setDisplayValue(Math.floor(startValue));
    };

    const timer = window.setInterval(updateValue, 16);

    return () => {
      clearInterval(timer);
    };
  }, [value]);

  return <span>{displayValue}</span>;
}