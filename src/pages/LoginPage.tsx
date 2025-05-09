import { Link } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { Trophy } from 'lucide-react';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-6">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo de volta</h1>
          <p className="mt-2 text-muted-foreground">
            Entre na sua conta para continuar sua jornada
          </p>
        </div>

        <div className="mt-10 bg-card p-6 shadow-sm border rounded-lg">
          <LoginForm />

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="font-medium text-primary hover:text-primary/90"
              >
                Crie uma
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}