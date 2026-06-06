import { useNavigate } from 'react-router-dom';
import { Calendar, User, Paperclip } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { Task } from '@/types';
import Badge from '@/components/ui/Badge';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
}

function extractText(node: unknown): string {
  if (!node) return '';
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (typeof node === 'object') {
    const content = (node as { content?: unknown }).content;
    return extractText(content);
  }
  return '';
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE';
  const descriptionPreview = extractText(task.description).trim();

  return (
    <div
      onClick={onClick}
      className="bg-bg-secondary border border-bg-border rounded-lg p-4 hover:border-accent-cyan/40 transition-all cursor-pointer group"
    >
      <div className="mb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-accent-cyan transition-colors">
            {task.title}
          </h3>
          <Badge variant={task.priority} />
        </div>
        {task.project_name && (
          <p className="text-xs text-text-muted mt-0.5 font-normal">
            Project: {task.project_name}
          </p>
        )}
      </div>

      {descriptionPreview && (
        <p className="text-xs text-text-secondary line-clamp-2 mb-3">{descriptionPreview}</p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Badge variant={task.status} />
      </div>

      <div className="flex items-center justify-between text-xs text-text-muted pt-2 border-t border-bg-border/50">
        <div className="flex items-center gap-3">
          {task.assigned_to ? (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
                <span className="text-[9px] font-bold text-accent-purple">
                  {getInitials(task.assigned_to.full_name)}
                </span>
              </div>
              <span className="text-text-secondary truncate max-w-[80px]">
                {task.assigned_to.full_name.split(' ')[0]}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-text-muted">
              <User size={12} />
              <span>Unassigned</span>
            </div>
          )}
          {task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <Paperclip size={11} />
              <span>{task.attachments.length}</span>
            </div>
          )}
        </div>
        {task.due_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-accent-red' : 'text-text-muted'}`}>
            <Calendar size={11} />
            <span>{format(parseISO(task.due_date), 'MMM d')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
