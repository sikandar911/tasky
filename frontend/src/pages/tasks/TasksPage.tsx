import { useState } from 'react';
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
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [filters, setFilters] = useState<TaskFiltersParams>({});
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
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
      setSelectedTask(null);
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
            <TaskCard key={task.id} task={task} onClick={() => setSelectedTask(task)} />
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

      {/* Task Detail Modal */}
      <Modal
        isOpen={!!selectedTask && !editTask}
        onClose={() => setSelectedTask(null)}
        title="Task Detail"
        size="xl"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={selectedTask.status} />
                  <Badge variant={selectedTask.priority} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {user?.role !== 'MEMBER' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Edit2 size={12} />}
                    onClick={() => {
                      setEditTask(selectedTask);
                      setSelectedTask(null);
                    }}
                  >
                    Edit
                  </Button>
                )}
                {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<Trash2 size={12} />}
                    loading={deleteMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this task?')) deleteMutation.mutate(selectedTask.id);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            {selectedTask.description && Object.keys(selectedTask.description).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Description</p>
                <div className="bg-bg-tertiary rounded-lg px-3 py-2 border border-bg-border/50">
                  <RichTextEditor value={selectedTask.description} readOnly />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 py-3 border-y border-bg-border">
              <div>
                <p className="text-xs text-text-muted mb-1">Assigned To</p>
                {selectedTask.assigned_to ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-accent-purple">
                        {selectedTask.assigned_to.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-text-primary">{selectedTask.assigned_to.full_name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-text-muted flex items-center gap-1"><User size={12} /> Unassigned</span>
                )}
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Due Date</p>
                {selectedTask.due_date ? (
                  <p className={`text-sm flex items-center gap-1.5 ${isPast(parseISO(selectedTask.due_date)) && selectedTask.status !== 'DONE' ? 'text-accent-red' : 'text-text-primary'}`}>
                    <Calendar size={13} />
                    {format(parseISO(selectedTask.due_date), 'MMM d, yyyy HH:mm')}
                  </p>
                ) : (
                  <span className="text-sm text-text-muted">No due date</span>
                )}
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Created By</p>
                <p className="text-sm text-text-primary">{selectedTask.created_by.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1">Created</p>
                <p className="text-sm text-text-primary">{format(parseISO(selectedTask.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>

            {/* Attachments */}
            {selectedTask.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1.5"><Paperclip size={12} /> Attachments ({selectedTask.attachments.length})</span>
                </p>
                <div className="space-y-2">
                  {selectedTask.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-2.5 bg-bg-tertiary rounded-lg border border-bg-border/50">
                      {att.media_type === 'IMAGE' && att.file_url ? (
                        <a href={att.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 flex-1 hover:text-accent-cyan transition-colors">
                          <img src={att.file_url} alt={att.file_name} className="w-10 h-10 object-cover rounded border border-bg-border" />
                          <span className="text-xs text-text-secondary truncate">{att.file_name}</span>
                          <ExternalLink size={11} className="text-text-muted ml-auto" />
                        </a>
                      ) : att.media_type === 'VIDEO_URL' && att.video_url ? (
                        <a href={att.video_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 flex-1 hover:text-accent-cyan transition-colors">
                          <div className="w-10 h-10 rounded bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center text-accent-purple text-xs font-mono">
                            ▶
                          </div>
                          <span className="text-xs text-text-secondary truncate">{att.video_url}</span>
                          <ExternalLink size={11} className="text-text-muted ml-auto" />
                        </a>
                      ) : (
                        <span className="text-xs text-text-muted">{att.file_name}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="border-t border-bg-border pt-4">
              <CommentSection taskId={selectedTask.id} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
