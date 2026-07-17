import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Users, Calendar, User } from 'lucide-react';
import { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

const memberColors = [
  'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30',
  'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
  'bg-accent-green/20 text-accent-green border-accent-green/30',
];

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();
  const visibleMembers = project.members.slice(0, 3);
  const extraCount = project.members.length - 3;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-bg-secondary border border-bg-border rounded-xl p-5 hover:border-accent-cyan/40 transition-all cursor-pointer group"
    >
      <div className="mb-3">
        <h3 className="text-lg font-bold text-accent-cyan group-hover:text-white transition-colors mb-1 truncate">
          {project.name}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-2 min-h-[32px]">
          {project.description || 'No description provided.'}
        </p>
      </div>

      {/* Members avatars */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-1.5">
          {visibleMembers.map((m, i) => (
            <div
              key={m.id}
              className={`w-6 h-6 rounded-full border flex items-center justify-center text-[9px] font-bold ${memberColors[i % memberColors.length]}`}
              title={m.user.full_name}
            >
              {getInitials(m.user.full_name)}
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-bg-tertiary border border-bg-border flex items-center justify-center text-[9px] font-bold text-text-muted">
              +{extraCount}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Users size={11} />
          <span>{project.members.length} {project.members.length === 1 ? 'member' : 'members'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted pt-3 border-t border-bg-border/50">
        <div className="flex items-center gap-1.5">
          <User size={11} />
          <span className="truncate max-w-[120px]">{project.created_by.full_name}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={11} />
          <span>{format(parseISO(project.created_at), 'MMM d, yyyy')}</span>
        </div>
      </div>
    </div>
  );
}
