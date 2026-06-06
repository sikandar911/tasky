import { Search, X } from 'lucide-react';
import { TaskFiltersParams } from '@/types';
import { useState, useEffect } from 'react';

interface TaskFiltersProps {
  projects?: { id: string; name: string }[];
  onChange: (filters: TaskFiltersParams) => void;
  initialValues?: TaskFiltersParams;
}

export default function TaskFilters({ projects = [], onChange, initialValues = {} }: TaskFiltersProps) {
  const [filters, setFilters] = useState<TaskFiltersParams>(initialValues);

  useEffect(() => {
    onChange(filters);
  }, [filters]);

  const update = (key: keyof TaskFiltersParams, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const clear = () => setFilters({});

  const hasFilters = Object.values(filters).some(Boolean);

  const selectClass =
    'bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-colors';

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filters.search || ''}
          onChange={(e) => update('search', e.target.value)}
          className="w-full bg-bg-tertiary border border-bg-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-colors"
        />
      </div>

      {/* Status */}
      <select value={filters.status || ''} onChange={(e) => update('status', e.target.value)} className={selectClass}>
        <option value="">All Status</option>
        <option value="TODO">TODO</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="REVIEW">Review</option>
        <option value="DONE">Done</option>
      </select>

      {/* Priority */}
      <select value={filters.priority || ''} onChange={(e) => update('priority', e.target.value)} className={selectClass}>
        <option value="">All Priority</option>
        <option value="LOW">Low</option>
        <option value="MEDIUM">Medium</option>
        <option value="HIGH">High</option>
        <option value="URGENT">Urgent</option>
      </select>

      {/* Project */}
      {projects.length > 0 && (
        <select value={filters.project || ''} onChange={(e) => update('project', e.target.value)} className={selectClass}>
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      )}

      {/* Clear */}
      {hasFilters && (
        <button
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 text-xs text-text-muted hover:text-accent-red transition-colors"
        >
          <X size={13} />
          Clear
        </button>
      )}
    </div>
  );
}
