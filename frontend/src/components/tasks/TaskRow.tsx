import { Calendar, User, Paperclip } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { Task } from '@/types';
import Badge from '@/components/ui/Badge';

interface TaskRowProps {
  task: Task;
  onClick?: () => void;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TaskRow({ task, onClick }: TaskRowProps) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE';
  const initials = task.assigned_to ? getInitials(task.assigned_to.full_name) : '';

  return (
    <div
      onClick={onClick}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-bg-secondary border border-bg-border rounded-lg p-3 hover:border-accent-cyan/40 transition-all cursor-pointer group"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-text-primary group-hover:text-accent-cyan transition-colors truncate">
              {task.title}
            </h3>
            {task.project_name && (
              <span className="text-xs font-semibold text-accent-cyan bg-accent-cyan/10 border border-accent-cyan/20 px-2 py-0.5 rounded">
                {task.project_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
        <Badge variant={task.priority} />
        <Badge variant={task.status} />

        <div className="flex items-center gap-3 text-xs text-text-muted">
          {task.assigned_to ? (
            <div className="flex items-center gap-1.5" title={`Assigned to ${task.assigned_to.full_name}`}>
              <div className="w-5 h-5 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
                <span className="text-[9px] font-bold text-accent-purple">{initials}</span>
              </div>
              <span className="text-text-secondary truncate max-w-[80px] hidden md:inline">
                {task.assigned_to.full_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-text-muted">Unassigned</span>
          )}

          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1" title={`${task.attachments.length} attachments`}>
              <Paperclip size={11} />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {task.due_date && (
            <span className={`flex items-center gap-1 shrink-0 ${isOverdue ? 'text-accent-red font-semibold' : 'text-text-muted'}`}>
              <Calendar size={11} />
              {format(parseISO(task.due_date), 'MMM d')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
