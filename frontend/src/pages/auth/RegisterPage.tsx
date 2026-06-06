import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { registerApi } from '@/api/auth';
import { Input } from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Zap, CheckCircle, Info } from 'lucide-react';

interface RegisterFormData {
  full_name: string;
  email: string;
  password: string;
  role: string;
}

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    defaultValues: { role: 'MEMBER' },
  });

  const mutation = useMutation({ mutationFn: registerApi });

  const onSubmit = (data: RegisterFormData) => mutation.mutate(data);

  if (mutation.isSuccess) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-accent-green/10 border border-accent-green/20 mb-5">
            <CheckCircle size={28} className="text-accent-green" />
          </div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Account Created!</h2>
          <p className="text-sm text-text-secondary mb-6">
            Your account has been created successfully. A Superadmin needs to verify your account before you can log in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-accent-cyan text-bg-primary text-sm font-semibold hover:bg-accent-cyan/90 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20 mb-4">
            <Zap size={22} className="text-accent-cyan" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-accent-cyan tracking-widest">TASKY</h1>
          <p className="text-sm text-text-secondary mt-1.5">Create your account</p>
        </div>

        <div className="bg-bg-secondary border border-bg-border rounded-xl p-6">
          <div className="flex items-start gap-2 bg-accent-cyan/5 border border-accent-cyan/15 rounded-lg p-3 mb-4">
            <Info size={14} className="text-accent-cyan mt-0.5 flex-shrink-0" />
            <p className="text-xs text-text-secondary">
              Your account will require Superadmin verification before you can login.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              error={errors.full_name?.message}
              {...register('full_name', { required: 'Full name is required' })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', { required: 'Email is required' })}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Minimum 8 characters' },
              })}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-secondary">Role</label>
              <select
                {...register('role')}
                className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan"
              >
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {mutation.isError && (
              <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
                <p className="text-xs text-accent-red">Registration failed. Email may already be in use.</p>
              </div>
            )}

            <Button type="submit" loading={mutation.isPending} className="w-full mt-2">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-cyan hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
