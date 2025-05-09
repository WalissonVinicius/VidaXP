import { Link } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { Trophy } from 'lucide-react';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Criar uma conta</h1>
          <p className="mt-2 text-muted-foreground">
            Comece sua jornada com VidaXP hoje
          </p>
        </div>
        
        <div className="mt-10 bg-card p-6 shadow-sm border rounded-lg">
          <RegisterForm />
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary hover:text-primary/90"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}