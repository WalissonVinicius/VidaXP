import { useState } from 'react';
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const goalSchema = z.object({
  name: z.string().min(2, {
    message: 'O nome do objetivo deve ter pelo menos 2 caracteres',
  }),
  points_required: z.coerce.number().int().positive().min(1, {
    message: 'Os pontos necessários devem ser pelo menos 1',
  }).max(10000, {
    message: 'Os pontos necessários não podem exceder 10000',
  }),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<GoalFormValues>;
  goalId?: string;
}

export default function GoalForm({ 
  onSuccess, 
  defaultValues,
  goalId 
}: GoalFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!goalId;
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      points_required: defaultValues?.points_required || 100,
    },
  });

  const onSubmit = async (data: GoalFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      if (isEditing) {
        const { error } = await supabase
          .from('goals')
          .update({
            name: data.name,
            points_required: data.points_required,
          })
          .eq('id', goalId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        toast({
          title: 'Objetivo atualizado',
          description: 'Seu objetivo foi atualizado com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            name: data.name,
            points_required: data.points_required,
            user_id: user.id,
          });
          
        if (error) throw error;
        
        toast({
          title: 'Objetivo criado',
          description: 'Seu novo objetivo foi criado com sucesso.',
        });
      }
      
      form.reset({
        name: '',
        points_required: 100,
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar objetivo:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar objetivo',
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
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Objetivo</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o nome do objetivo"
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
          name="points_required"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Pontos Necessários</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={10000}
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              isEditing ? 'Atualizar Objetivo' : 'Criar Objetivo'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}