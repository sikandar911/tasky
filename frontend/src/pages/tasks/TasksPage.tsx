import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTasksApi, deleteTaskApi } from '@/api/tasks';
import { getProjectsApi } from '@/api/projects';
import { Task, Project, TaskFiltersParams } from '@/types';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import TaskFilters from '@/components/tasks/TaskFilters';
import CommentSection from '@/components/tasks/CommentSection';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';
import { Plus, CheckSquare, Trash2, Edit2, ExternalLink, Paperclip, Calendar, User } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { useAuthStore } from '@/store/authStore';

export default function TasksPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState<TaskFiltersParams>({});
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => getTasksApi(filters),
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjectsApi,
  });

  const tasks: Task[] = tasksData?.results || [];
  const projects: Project[] = projectsData?.results || [];

  const deleteMutation = useMutation({
    mutationFn: deleteTaskApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Tasks</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            {tasksData?.count ?? 0} task{(tasksData?.count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button leftIcon={<Plus size={14} />} onClick={() => setShowCreate(true)}>
          New Task
        </Button>
      </div>

      <div className="mb-5">
        <TaskFilters projects={projects} onChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare size={28} />}
          title="No tasks found"
          description="Create a new task or adjust your filters."
          action={{ label: 'New Task', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => navigate(`/tasks/${task.id}`)} />
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Task" size="lg">
        <TaskForm onSuccess={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!editTask} onClose={() => setEditTask(null)} title="Edit Task" size="lg">
        {editTask && <TaskForm task={editTask} onSuccess={() => setEditTask(null)} />}
      </Modal>
    </>
  );
}
