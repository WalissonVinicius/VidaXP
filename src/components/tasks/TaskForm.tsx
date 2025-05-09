import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Category } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

const taskSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da tarefa deve ter pelo menos 2 caracteres',
  }),
  points: z.coerce.number().int().positive().min(1, {
    message: 'Os pontos devem ser pelo menos 1',
  }).max(1000, {
    message: 'Os pontos não podem exceder 1000',
  }),
  category_id: z.string().uuid({
    message: 'Selecione uma categoria',
  }),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<TaskFormValues>;
  taskId?: string;
}

export default function TaskForm({ onSuccess, defaultValues, taskId }: TaskFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const isEditing = !!taskId;

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      points: defaultValues?.points || 1,
      category_id: defaultValues?.category_id || '',
    },
  });

  // Buscar categorias
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Erro ao buscar categorias:', error);
        toast({
          title: 'Erro',
          description: 'Falha ao carregar categorias',
          variant: 'destructive',
        });
      }
    };

    fetchCategories();
  }, [user]);

  const onSubmit = async (data: TaskFormValues) => {
    if (!user) return;

    try {
      setIsLoading(true);

      if (isEditing) {
        const { error } = await supabase
          .from('tasks')
          .update({
            name: data.name,
            points: data.points,
            category_id: data.category_id,
          })
          .eq('id', taskId)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Tarefa atualizada',
          description: 'Sua tarefa foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('tasks')
          .insert({
            name: data.name,
            points: data.points,
            category_id: data.category_id,
            user_id: user.id,
          });

        if (error) throw error;

        toast({
          title: 'Tarefa criada',
          description: 'Sua nova tarefa foi criada com sucesso.',
        });
      }

      form.reset({
        name: '',
        points: 1,
        category_id: data.category_id, // Mantém a mesma categoria selecionada por conveniência
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar tarefa',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Tarefa</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o nome da tarefa"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="points"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontos</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isLoading || categories.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Nenhuma categoria disponível
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              isEditing ? 'Atualizar Tarefa' : 'Criar Tarefa'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}