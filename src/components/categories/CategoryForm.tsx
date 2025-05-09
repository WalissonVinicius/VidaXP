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

const COLORS = [
  '#3b82f6', // azul
  '#10b981', // verde
  '#f59e0b', // âmbar
  '#ef4444', // vermelho
  '#8b5cf6', // violeta
  '#ec4899', // rosa
  '#14b8a6', // turquesa
  '#f97316', // laranja
  '#6366f1', // índigo
];

const categorySchema = z.object({
  name: z.string().min(2, {
    message: 'O nome da categoria deve ter pelo menos 2 caracteres',
  }),
  color: z.string().regex(/^#([0-9A-F]{6})$/i, {
    message: 'Selecione uma cor válida',
  }),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryFormProps {
  onSuccess?: () => void;
  defaultValues?: Partial<CategoryFormValues>;
  categoryId?: string;
}

export default function CategoryForm({ 
  onSuccess, 
  defaultValues, 
  categoryId 
}: CategoryFormProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!categoryId;
  
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || '',
      color: defaultValues?.color || COLORS[0],
    },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);

      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            color: data.color,
          })
          .eq('id', categoryId)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        toast({
          title: 'Categoria atualizada',
          description: 'Sua categoria foi atualizada com sucesso.',
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            name: data.name,
            color: data.color,
            user_id: user.id,
          });
          
        if (error) throw error;
        
        toast({
          title: 'Categoria criada',
          description: 'Sua nova categoria foi criada com sucesso.',
        });
      }
      
      form.reset({
        name: '',
        color: COLORS[0],
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar categoria',
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
              <FormLabel>Nome da Categoria</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o nome da categoria"
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
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cor</FormLabel>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map((color) => (
                  <div
                    key={color}
                    className={`h-8 rounded-md cursor-pointer border-2 transition-all ${
                      field.value === color
                        ? 'border-ring scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => form.setValue('color', color)}
                  />
                ))}
              </div>
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
              isEditing ? 'Atualizar Categoria' : 'Criar Categoria'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}