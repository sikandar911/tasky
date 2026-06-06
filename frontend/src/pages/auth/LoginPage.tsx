import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { loginApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Zap } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      login(data);
      navigate('/dashboard');
    },
  });

  const onSubmit = (data: LoginFormData) => mutation.mutate(data);

  // Extract a human-friendly error message from the API response
  const apiError = (() => {
    if (!mutation.isError) return null;
    const err = mutation.error as { response?: { data?: { detail?: string } } };
    return err?.response?.data?.detail || 'Invalid credentials. Please try again.';
  })();

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 mb-4">
            <Zap size={22} className="text-accent-cyan" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-accent-cyan tracking-widest">TASKY</h1>
          <p className="text-sm text-text-secondary mt-1.5">Welcome back, developer.</p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-bg-border rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />

            {apiError && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                <p className="text-xs text-accent-red">{apiError}</p>
              </div>
            )}

            <Button type="submit" loading={mutation.isPending} className="w-full mt-2">
              Sign In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-accent-cyan hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

