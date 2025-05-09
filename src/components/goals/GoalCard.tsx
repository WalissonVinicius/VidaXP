import { useState } from 'react';
import { Goal } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Trophy, Loader2, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import GoalForm from './GoalForm';

interface GoalCardProps {
  goal: Goal;
  totalPoints: number;
  onUpdate: () => void;
}

// Status do objetivo
export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export default function GoalCard({
  goal,
  totalPoints,
  onUpdate
}: GoalCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Calculate progress percentage
  const progressPercentage = goal.achieved
    ? 100
    : Math.min(
      Math.round((totalPoints / goal.points_required) * 100),
      100
    );

  const isAchieved = totalPoints >= goal.points_required;

  // Determinar o status atual do objetivo
  const getGoalStatus = () => {
    if (goal.achieved) return GoalStatus.COMPLETED;
    if (progressPercentage > 0) return GoalStatus.IN_PROGRESS;
    return GoalStatus.NOT_STARTED;
  };

  const currentStatus = getGoalStatus();

  const handleDeleteGoal = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Objetivo excluído',
        description: 'O objetivo foi excluído com sucesso.',
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir objetivo',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsAchieved = async () => {
    if (!user) return;

    try {
      // Atualizar o status de conclusão do objetivo
      const newAchievedStatus = !goal.achieved;

      const { error } = await supabase
        .from('goals')
        .update({ achieved: newAchievedStatus })
        .eq('id', goal.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Mensagem de feedback para o usuário
      toast({
        title: goal.achieved ? 'Objetivo desmarcado' : 'Objetivo alcançado!',
        description: goal.achieved
          ? 'Você pode continuar trabalhando neste objetivo novamente.'
          : 'Parabéns por atingir seu objetivo!',
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status do objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status do objetivo',
        variant: 'destructive',
      });
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  // Calcular pontos específicos para este objetivo
  // Se estiver concluído, usa os pontos do próprio objetivo (fixado quando foi concluído)
  // Se não, usa o progresso atual em relação ao objetivo total
  const displayPoints = goal.achieved
    ? goal.points_required
    : Math.min(totalPoints, goal.points_required);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "border rounded-lg p-4 bg-card shadow-sm transition-all",
        goal.achieved && "bg-primary/10 border-primary shadow-md"
      )}
    >
      <div className="flex items-start mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            {goal.achieved && (
              <Trophy className="h-5 w-5 text-primary mr-2 animate-pulse" />
            )}
            <h3 className={cn(
              "font-medium text-lg truncate",
              goal.achieved && "text-primary"
            )}>
              {goal.name}
            </h3>
          </div>
          {goal.achieved && (
            <p className="text-sm text-primary/80 mt-1 flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              Objetivo conquistado!
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Botão de Editar */}
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            size="sm"
            variant="outline"
            className="w-9 h-9 p-0 rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 hover:scale-105 transition-all shadow-sm hover:shadow"
          >
            <Edit className="h-[18px] w-[18px] text-primary" strokeWidth={2.5} />
            <span className="sr-only">Editar</span>
          </Button>

          {/* Botão de Excluir */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="w-9 h-9 p-0 rounded-full bg-red-50 hover:bg-red-100 border-red-200 hover:scale-105 transition-all shadow-sm hover:shadow"
              >
                <Trash2 className="h-[18px] w-[18px] text-red-500" strokeWidth={2.5} />
                <span className="sr-only">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Objetivo</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteGoal}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={goal.achieved ? "text-primary font-medium" : ""}>
            {goal.achieved ? goal.points_required : displayPoints} / {goal.points_required} pontos
          </span>
          <span className={cn(
            goal.achieved ? "text-green-500 font-medium" : "",
            !goal.achieved && progressPercentage > 0 ? "text-amber-600 font-medium" : ""
          )}>
            {progressPercentage}%
          </span>
        </div>
        <div className="relative w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className={cn(
              "absolute left-0 top-0 h-full transition-all duration-500 rounded-full",
              goal.achieved ? "bg-green-500" :
                currentStatus === GoalStatus.IN_PROGRESS ? "bg-gradient-to-r from-amber-400 to-amber-500" :
                  "bg-muted"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {!goal.achieved && currentStatus === GoalStatus.IN_PROGRESS && (
          <div className="w-full bg-amber-50 rounded px-2 py-1 text-xs text-amber-700 mt-1 flex items-center justify-center">
            <div className="bg-amber-500 rounded-full h-1.5 w-1.5 mr-1.5"></div>
            Faltam {goal.points_required - displayPoints} pontos para concluir
          </div>
        )}
      </div>

      <div className="mt-4">
        {goal.achieved ? (
          // Botão para objetivo concluído
          <Button
            size="sm"
            className="w-full"
            variant="outline"
            onClick={handleMarkAsAchieved}
          >
            <X className="mr-2 h-4 w-4 text-red-500" />
            Desmarcar objetivo concluído
          </Button>
        ) : isAchieved ? (
          // Botão para quando tem pontos suficientes
          <Button
            size="sm"
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            onClick={handleMarkAsAchieved}
          >
            <CheckCircle className="mr-2 h-4 w-4 text-white" />
            Finalizar e conquistar objetivo
          </Button>
        ) : (
          // Botão quando não tem pontos suficientes (desabilitado)
          <Button
            size="sm"
            className="w-full"
            variant={currentStatus === GoalStatus.IN_PROGRESS ? "secondary" : "default"}
            disabled={true}
          >
            {currentStatus === GoalStatus.NOT_STARTED ?
              "Objetivo não iniciado" :
              <div className="flex items-center">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
                Em progresso: {progressPercentage}%
              </div>
            }
          </Button>
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Objetivo</DialogTitle>
          </DialogHeader>
          <GoalForm
            onSuccess={handleEditSuccess}
            defaultValues={goal}
            goalId={goal.id}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}