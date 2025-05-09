import { useState } from 'react';
import { Category } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Edit, Trash2, Loader2, Tag } from 'lucide-react';
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
import CategoryForm from './CategoryForm';

interface CategoryCardProps {
  category: Category;
  onUpdate: () => void;
  taskCount: number;
}

export default function CategoryCard({
  category,
  onUpdate,
  taskCount
}: CategoryCardProps) {
  const { user } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleDeleteCategory = async () => {
    if (!user) return;

    try {
      setIsDeleting(true);

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', category.id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });

      onUpdate();
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir categoria',
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "border rounded-lg p-4 bg-card shadow-sm transition-all"
      )}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: category.color
      }}
    >
      <div className="flex items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center">
            <Tag
              className="h-5 w-5 mr-2 stroke-2"
              style={{ color: category.color }}
            />
            <h3 className="font-medium text-lg truncate">
              {category.name}
            </h3>
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setIsEditDialogOpen(true)}
            size="sm"
            variant="outline"
            className="w-9 h-9 p-0 rounded-full bg-primary/5 hover:bg-primary/10 border-primary/20 hover:scale-105 transition-all shadow-sm hover:shadow"
          >
            <Edit className="h-[18px] w-[18px] text-primary" strokeWidth={2.5} />
            <span className="sr-only">Editar</span>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={cn(
                  "w-9 h-9 p-0 rounded-full transition-all shadow-sm",
                  taskCount > 0
                    ? "bg-gray-100 border-gray-200 cursor-not-allowed"
                    : "bg-red-50 hover:bg-red-100 border-red-200 hover:scale-105 hover:shadow"
                )}
                disabled={taskCount > 0}
              >
                <Trash2 className={cn(
                  "h-[18px] w-[18px]",
                  taskCount > 0 ? "text-gray-400" : "text-red-500"
                )}
                  strokeWidth={2.5} />
                <span className="sr-only">Excluir</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
                  {taskCount > 0 && (
                    <div className="mt-2 font-medium text-destructive">
                      Esta categoria tem {taskCount} {taskCount === 1 ? 'tarefa' : 'tarefas'}. Remova as tarefas primeiro antes de excluir.
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={handleDeleteCategory}
                  disabled={isDeleting || taskCount > 0}
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSuccess={handleEditSuccess}
            defaultValues={{
              name: category.name,
              color: category.color,
            }}
            categoryId={category.id}
          />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}