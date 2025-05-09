import { useState } from 'react';
import { Task, Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Sparkles, Loader2, CheckSquare } from 'lucide-react';
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
import TaskForm from './TaskForm';

interface TaskCardProps {
  task: Task;
  category?: Category;
  onUpdate: () => void;
}

export default function TaskCard({ task, category, onUpdate }: TaskCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showPoints, setShowPoints] = useState(false);

  const handleCompleteTask = async () => {
    if (!user) return;

    try {
      setIsUpdatingStatus(true);

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: task.completed ? 'Tarefa desmarcada' : 'Tarefa concluída!',
        description: task.completed
          ? 'Pontos foram deduzidos do seu total.'
          : `Você ganhou ${task.points} pontos!`,
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar status da tarefa',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Tarefa excluída',
        description: 'A tarefa foi excluída com sucesso.',
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir tarefa',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    onUpdate();
  };

  // Get category color with fallback
  const categoryColor = category?.color || '#3b82f6';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative border rounded-lg p-4 bg-card shadow-sm transition-all",
        task.completed ? "bg-muted/40" : ""
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: categoryColor
      }}
      onMouseEnter={() => setShowPoints(true)}
      onMouseLeave={() => setShowPoints(false)}
    >
      {/* Points badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: showPoints || task.completed ? 1 : 0,
          scale: showPoints || task.completed ? 1 : 0.8
        }}
        transition={{ duration: 0.2 }}
        className="absolute -top-2 -right-2 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 border border-amber-300 dark:border-amber-700 rounded-full px-2 py-1 text-xs font-semibold flex items-center shadow-md hover:scale-110 transition-transform"
      >
        <Sparkles
          className="h-3.5 w-3.5 mr-1 text-amber-500 dark:text-yellow-300"
          style={{ filter: 'drop-shadow(0px 0px 1px rgba(0,0,0,0.3))' }}
        />
        {task.points} XP
      </motion.div>

      <div className="flex items-start gap-3">
        <div className="relative">
          {/* Checkbox simples com X e botão visível */}
          <button
            onClick={!isUpdatingStatus ? handleCompleteTask : undefined}
            disabled={isUpdatingStatus}
            className={cn(
              "h-7 w-7 rounded-full shadow-sm border-2 transition-all flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary",
              task.completed
                ? "bg-green-500 border-green-500"
                : "bg-primary/5 border-primary/40 hover:border-primary hover:bg-primary/10"
            )}
          >
            {task.completed && (
              <span className="text-white text-lg font-bold select-none" style={{ marginTop: '-2px' }}>✓</span>
            )}
          </button>

          {/* Indicador de loading */}
          {isUpdatingStatus && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-full">
              <Loader2 className="h-4 w-4 text-primary animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "font-medium text-lg transition-all truncate",
            task.completed && "line-through text-muted-foreground"
          )}>
            {task.name}
          </h3>

          {category && (
            <div className="text-xs text-muted-foreground mt-1">
              {category.name}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 shrink-0">
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
                <AlertDialogTitle>Excluir Tarefa</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteTask}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-5 w-5" />
                      Excluir
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Completed animation */}
      {task.completed && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0.5 }}
            className="absolute -right-2 -bottom-2 bg-green-500 text-white rounded-full h-8 w-8 flex items-center justify-center shadow-lg"
          >
            <CheckSquare className="h-5 w-5 text-white" />
          </motion.div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
          </DialogHeader>
          <TaskForm
            onSuccess={handleEditSuccess}
            defaultValues={task}
            taskId={task.id}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}