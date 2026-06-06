import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMemberApi, removeMemberApi } from '@/api/projects';
import { getUsersApi } from '@/api/users';
import { ProjectMember, User } from '@/types';
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
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users-search', search],
    queryFn: () => getUsersApi({ search }),
    enabled: showAdd && search.length >= 2,
  });

  const searchResults: User[] = usersData?.results || [];

  const addMutation = useMutation({
    mutationFn: () => addMemberApi(projectId, selectedUser?.id || ''),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', projectId] });
      setSearch('');
      setSelectedUser(null);
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
        <div className="mb-4 p-3 bg-bg-tertiary border border-bg-border rounded-lg relative">
          <p className="text-xs text-text-muted mb-2">Search user by email or name to add them:</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={selectedUser ? selectedUser.email : search}
                onChange={(e) => {
                  if (selectedUser) setSelectedUser(null);
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => setTimeout(() => setDropdownOpen(false), 200)}
                placeholder="Type user email..."
                className="w-full bg-bg-secondary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
              />
              
              {selectedUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setSearch('');
                  }}
                  className="absolute right-2 top-2.5 text-xs text-text-muted hover:text-accent-red"
                >
                  Clear
                </button>
              )}

              {dropdownOpen && search.length >= 2 && !selectedUser && (
                <div className="absolute z-10 w-full mt-1 bg-bg-secondary border border-bg-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {isLoadingUsers ? (
                    <p className="text-xs text-text-muted p-3">Searching...</p>
                  ) : searchResults.length === 0 ? (
                    <p className="text-xs text-text-muted p-3">No users found.</p>
                  ) : (
                    searchResults
                      .filter((u) => !members.some((m) => m.user.id === u.id))
                      .map((u) => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setSelectedUser(u);
                            setDropdownOpen(false);
                          }}
                          className="px-3 py-2 hover:bg-bg-tertiary cursor-pointer border-b border-bg-border/30 last:border-b-0 text-left"
                        >
                          <p className="text-xs font-semibold text-text-primary">{u.full_name}</p>
                          <p className="text-[10px] text-text-muted">{u.email}</p>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
            <Button
              size="sm"
              loading={addMutation.isPending}
              onClick={() => addMutation.mutate()}
              disabled={!selectedUser}
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
