import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addMemberApi, removeMemberApi } from '@/api/projects';
import { ProjectMember } from '@/types';
import { format, parseISO } from 'date-fns';
import { Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import Button from '@/components/ui/Button';

interface MembersListProps {
  projectId: string;
  members: ProjectMember[];
  isOwner: boolean;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const roleColors: Record<string, string> = {
  SUPERADMIN: 'text-accent-red bg-accent-red/10 border-accent-red/20',
  ADMIN: 'text-accent-yellow bg-accent-yellow/10 border-accent-yellow/20',
  MEMBER: 'text-text-secondary bg-bg-tertiary border-bg-border',
};

export default function MembersList({ projectId, members, isOwner }: MembersListProps) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const addMutation = useMutation({
    mutationFn: () => addMemberApi(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      setUserId('');
      setShowAdd(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (uid: string) => removeMemberApi(projectId, uid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Members <span className="text-text-muted font-normal">({members.length})</span>
        </h3>
        {isOwner && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus size={13} />}
            onClick={() => setShowAdd((v) => !v)}
          >
            Add Member
          </Button>
        )}
      </div>

      {showAdd && isOwner && (
        <div className="mb-4 p-3 bg-bg-tertiary border border-bg-border rounded-lg">
          <p className="text-xs text-text-muted mb-2">Enter the user's UUID to add them:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User UUID..."
              className="flex-1 bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
            <Button
              size="sm"
              loading={addMutation.isPending}
              onClick={() => addMutation.mutate()}
              disabled={!userId.trim()}
            >
              Add
            </Button>
          </div>
          {addMutation.isError && (
            <p className="text-xs text-accent-red mt-1">Failed to add member.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg border border-bg-border/50"
          >
            <div className="w-8 h-8 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-accent-cyan">
                {getInitials(member.user.full_name)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{member.user.full_name}</p>
              <p className="text-xs text-text-muted truncate">{member.user.email}</p>
            </div>
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full border font-semibold ${roleColors[member.user.role] || roleColors.MEMBER}`}>
              {member.user.role}
            </span>
            <span className="text-xs text-text-muted whitespace-nowrap hidden sm:block">
              {format(parseISO(member.date_added), 'MMM d, yyyy')}
            </span>
            {isOwner && (
              <button
                onClick={() => removeMutation.mutate(member.user.id)}
                className="p-1.5 text-text-muted hover:text-accent-red transition-colors"
                title="Remove member"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
