import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsersApi, verifyUserApi, createUserApi, CreateUserPayload } from '@/api/users';
import { User, PaginatedResponse } from '@/types';
import Spinner from '@/components/ui/Spinner';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { CheckCircle, XCircle, Shield, UserPlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

const roleColors: Record<string, string> = {
  SUPERADMIN: 'text-accent-red bg-accent-red/10 border-accent-red/20',
  ADMIN: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  MEMBER: 'text-text-secondary bg-bg-tertiary border-bg-border',
};

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface CreateUserForm {
  email: string;
  full_name: string;
  password: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MEMBER';
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [onlyUnverified, setOnlyUnverified] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const isSuperAdmin = currentUser?.role === 'SUPERADMIN';

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>({
    defaultValues: { role: 'MEMBER' },
  });

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users'],
    queryFn: () => getUsersApi(),
  });

  const verifyMutation = useMutation({
    mutationFn: verifyUserApi,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) => createUserApi(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      reset();
    },
  });

  const createError = (() => {
    if (!createMutation.isError) return null;
    const err = createMutation.error as { response?: { data?: Record<string, string[]> } };
    const data = err?.response?.data;
    if (!data) return 'Failed to create user.';
    const msgs = Object.values(data).flat();
    return msgs[0] || 'Failed to create user.';
  })();

  const users = data?.results || [];
  const filtered = onlyUnverified ? users.filter((u) => !u.is_verified) : users;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Shield size={18} className="text-accent-cyan" />
            User Management
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">{data?.count ?? 0} registered users</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setOnlyUnverified((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${onlyUnverified ? 'bg-accent-cyan' : 'bg-bg-border'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${onlyUnverified ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-text-secondary">Unverified only</span>
          </label>
          <Button leftIcon={<UserPlus size={14} />} size="sm" onClick={() => setShowCreateModal(true)}>
            Create User
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="bg-bg-secondary border border-bg-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Verified</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider hidden lg:table-cell">Joined</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bg-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-bg-tertiary/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-accent-cyan">{getInitials(user.full_name)}</span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{user.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className="text-sm text-text-secondary font-mono">{user.email}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${roleColors[user.role] || roleColors.MEMBER}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs text-accent-green">
                        <CheckCircle size={13} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
                        <XCircle size={13} />
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-text-muted">
                      {format(parseISO(user.date_joined), 'MMM d, yyyy')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {user.role === 'SUPERADMIN' ? (
                      <span className="text-xs text-text-muted italic">Protected</span>
                    ) : (
                      isSuperAdmin && (
                        <Button
                          variant={user.is_verified ? 'danger' : 'secondary'}
                          size="sm"
                          loading={verifyMutation.isPending && verifyMutation.variables === user.id}
                          onClick={() => verifyMutation.mutate(user.id)}
                          disabled={currentUser?.id === user.id}
                        >
                          {user.is_verified ? 'Unverify' : 'Verify'}
                        </Button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-text-muted">No users found.</div>
          )}
        </div>
      )}

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); reset(); createMutation.reset(); }}
        title="Create New User"
        size="sm"
      >
        <form onSubmit={handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Alice Smith"
            error={errors.full_name?.message}
            {...register('full_name', { required: 'Full name is required' })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="alice@example.com"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            error={errors.password?.message}
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Min. 8 characters' } })}
          />
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-text-secondary">Role</label>
            <select
              className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-colors"
              {...register('role')}
            >
              <option value="MEMBER">Member (Participant)</option>
              <option value="ADMIN">Admin</option>
              {isSuperAdmin && <option value="SUPERADMIN">Superadmin</option>}
            </select>
            <p className="text-xs text-text-muted">
              {isSuperAdmin
                ? 'As Superadmin you can assign any role.'
                : 'As Admin you can only create Members.'}
            </p>
          </div>

          {createError && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-3 py-2">
              <p className="text-xs text-accent-red">{createError}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => { setShowCreateModal(false); reset(); }}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={createMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
