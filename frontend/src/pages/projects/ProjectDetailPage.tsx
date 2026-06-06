import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectApi, updateProjectApi, deleteProjectApi } from '@/api/projects';
import { getTasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/authStore';
import { Project, Task, TaskFiltersParams } from '@/types';
import MembersList from '@/components/projects/MembersList';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFilters from '@/components/tasks/TaskFilters';
import TaskForm from '@/components/tasks/TaskForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { useState } from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, CheckSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useForm } from 'react-hook-form';

interface EditFormData {
  name: string;
  description: string;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [showEdit, setShowEdit] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskFilters, setTaskFilters] = useState<TaskFiltersParams>({});

  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: () => getProjectApi(id!),
    enabled: !!id,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks', { project: id, ...taskFilters }],
    queryFn: () => getTasksApi({ project: id, ...taskFilters }),
    enabled: !!id,
  });

  const tasks: Task[] = tasksData?.results || [];

  const { register, handleSubmit, formState: { errors } } = useForm<EditFormData>({
    values: { name: project?.name || '', description: project?.description || '' },
  });

  const updateMutation = useMutation({
    mutationFn: (data: EditFormData) => updateProjectApi(id!, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project', id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProjectApi(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  const isOwner = project?.created_by.id === user?.id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!project) {
    return <p className="text-text-muted text-sm">Project not found.</p>;
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <button
            onClick={() => navigate('/projects')}
            className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-cyan transition-colors mb-3"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </button>
          <h2 className="text-xl font-bold text-text-primary">{project.name}</h2>
          {project.description && (
            <p className="text-sm text-text-secondary mt-1 max-w-xl">{project.description}</p>
          )}
          <p className="text-xs text-text-muted mt-2">
            Created by {project.created_by.full_name} · {format(parseISO(project.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit2 size={13} />}
              onClick={() => setShowEdit(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={13} />}
              loading={deleteMutation.isPending}
              onClick={() => {
                if (confirm('Delete this project? This cannot be undone.')) {
                  deleteMutation.mutate();
                }
              }}
            >
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-bg-secondary border border-bg-border rounded-xl p-5 mb-6">
        <MembersList
          projectId={id!}
          members={project.members}
          isOwner={isOwner}
        />
      </div>

      {/* Tasks */}
      <div className="bg-bg-secondary border border-bg-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Tasks ({tasks.length})</h3>
          <Button
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={() => setShowNewTask(true)}
          >
            New Task
          </Button>
        </div>

        <div className="mb-4">
          <TaskFilters onChange={setTaskFilters} />
        </div>

        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare size={24} />}
            title="No tasks"
            description="Add the first task to this project."
            action={{ label: 'New Task', onClick: () => setShowNewTask(true) }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
            ))}
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Project">
        <form onSubmit={handleSubmit((data) => updateMutation.mutate(data))} className="space-y-4">
          <Input
            label="Project Name *"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
          <Textarea label="Description" rows={3} {...register('description')} />
          {updateMutation.isError && (
            <p className="text-xs text-accent-red">Failed to update.</p>
          )}
          <Button type="submit" loading={updateMutation.isPending} className="w-full">
            Save Changes
          </Button>
        </form>
      </Modal>

      {/* New Task Modal */}
      <Modal isOpen={showNewTask} onClose={() => setShowNewTask(false)} title="New Task" size="lg">
        <TaskForm
          defaultProjectId={id}
          onSuccess={() => {
            setShowNewTask(false);
            qc.invalidateQueries({ queryKey: ['tasks', { project: id }] });
          }}
        />
      </Modal>

      {/* Edit Task Modal */}
      <Modal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} title="Edit Task" size="lg">
        {selectedTask && (
          <TaskForm
            task={selectedTask}
            onSuccess={() => setSelectedTask(null)}
          />
        )}
      </Modal>
    </>
  );
}
