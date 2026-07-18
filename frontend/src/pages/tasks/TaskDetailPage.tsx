import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTaskApi, deleteTaskApi } from '@/api/tasks';
import { Task } from '@/types';
import { useAuthStore } from '@/store/authStore';
import TaskForm from '@/components/tasks/TaskForm';
import CommentSection from '@/components/tasks/CommentSection';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Modal from '@/components/ui/Modal';
import ImageViewer from '@/components/ui/ImageViewer';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Badge from '@/components/ui/Badge';
import { ArrowLeft, Edit2, Trash2, Calendar, User, Paperclip, ExternalLink } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { useState } from 'react';

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  
  const [showEdit, setShowEdit] = useState(false);
  const [activeImage, setActiveImage] = useState<{ src: string; name: string } | null>(null);

  const { data: task, isLoading } = useQuery<Task>({
    queryKey: ['task', id],
    queryFn: () => getTaskApi(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTaskApi(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      navigate(-1);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-cyan transition-colors"
        >
          <ArrowLeft size={14} />
          Go Back
        </button>
        <p className="text-text-muted text-sm">Task not found.</p>
      </div>
    );
  }

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && task.status !== 'DONE';

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent-cyan transition-colors mb-3"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <h2 className="text-xl font-bold text-text-primary">{task.title}</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={task.status} />
              <Badge variant={task.priority} />
              {task.project_name && (
                <span className="text-xs text-text-muted bg-bg-secondary px-2 py-0.5 rounded border border-bg-border">
                  Project: {task.project_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Edit2 size={12} />}
              onClick={() => setShowEdit(true)}
            >
              {user?.role === 'MEMBER' ? 'Change Status' : 'Edit'}
            </Button>
            {(user?.role === 'SUPERADMIN' || user?.role === 'ADMIN') && (
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={12} />}
                loading={deleteMutation.isPending}
                onClick={() => {
                  if (confirm('Delete this task?')) deleteMutation.mutate();
                }}
              >
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Content body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Details & Description */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-bg-secondary border border-bg-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Description</h3>
              {task.description && Object.keys(task.description).length > 0 ? (
                <div className="bg-bg-tertiary rounded-lg px-3 py-2 border border-bg-border/50 prose-editor-read-only">
                  <RichTextEditor value={task.description} readOnly />
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">No description provided for this task.</p>
              )}
            </div>

            {/* Attachments */}
            <div className="bg-bg-secondary border border-bg-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2 flex items-center gap-1.5">
                <Paperclip size={14} /> Attachments ({task.attachments.length})
              </h3>
              {task.attachments.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((att) => (
                    <div key={att.id} className="flex items-center gap-3 p-2.5 bg-bg-tertiary rounded-lg border border-bg-border/50">
                      {att.media_type === 'IMAGE' && att.file_url ? (
                        <button
                          type="button"
                          onClick={() => setActiveImage({ src: att.file_url!, name: att.file_name })}
                          className="flex items-center gap-2 flex-1 hover:text-accent-cyan transition-colors text-left w-full"
                        >
                          <img src={att.file_url || undefined} alt={att.file_name} className="w-10 h-10 object-cover rounded border border-bg-border" />
                          <span className="text-xs text-text-secondary truncate">{att.file_name}</span>
                          <ExternalLink size={11} className="text-text-muted ml-auto" />
                        </button>
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
              ) : (
                <p className="text-xs text-text-muted italic">No files attached to this task.</p>
              )}
            </div>

            {/* Comments */}
            <div className="bg-bg-secondary border border-bg-border rounded-xl p-5">
              <CommentSection taskId={task.id} />
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-bg-secondary border border-bg-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-text-primary border-b border-bg-border pb-2">Information</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-text-muted mb-1">Assigned To</p>
                  {task.assigned_to ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-7 h-7 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-accent-purple">
                          {task.assigned_to.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-text-primary">{task.assigned_to.full_name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-text-muted flex items-center gap-1.5"><User size={13} /> Unassigned</span>
                  )}
                </div>

                <div className="border-t border-bg-border/30 pt-3">
                  <p className="text-xs text-text-muted mb-1">Due Date</p>
                  {task.due_date ? (
                    <p className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? 'text-accent-red' : 'text-text-primary'}`}>
                      <Calendar size={14} />
                      {format(parseISO(task.due_date), 'MMM d, yyyy HH:mm')}
                    </p>
                  ) : (
                    <span className="text-sm text-text-muted">No due date</span>
                  )}
                </div>

                <div className="border-t border-bg-border/30 pt-3">
                  <p className="text-xs text-text-muted mb-1">Created By</p>
                  <p className="text-sm font-medium text-text-primary">{task.created_by.full_name}</p>
                </div>

                <div className="border-t border-bg-border/30 pt-3">
                  <p className="text-xs text-text-muted mb-1">Created At</p>
                  <p className="text-sm font-medium text-text-primary">{format(parseISO(task.created_at), 'MMM d, yyyy')}</p>
                </div>

                <div className="border-t border-bg-border/30 pt-3">
                  <p className="text-xs text-text-muted mb-1">Updated At</p>
                  <p className="text-sm font-medium text-text-primary">{format(parseISO(task.updated_at), 'MMM d, yyyy')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Edit Task" size="lg">
        <TaskForm
          task={task}
          onSuccess={() => {
            setShowEdit(false);
            qc.invalidateQueries({ queryKey: ['task', id] });
          }}
        />
      </Modal>

      {activeImage && (
        <ImageViewer
          isOpen={true}
          onClose={() => setActiveImage(null)}
          src={activeImage.src}
          alt={activeImage.name}
        />
      )}
    </>
  );
}
