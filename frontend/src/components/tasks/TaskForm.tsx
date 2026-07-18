import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectsApi } from '@/api/projects';
import { createTaskApi, updateTaskApi } from '@/api/tasks';
import { Project, Task } from '@/types';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import RichTextEditor from '@/components/ui/RichTextEditor';
import { useState, useRef } from 'react';
import { Plus, X, Upload, ImageIcon } from 'lucide-react';
import { compressImages } from '@/lib/compressImage';
import { useAuthStore } from '@/store/authStore';

interface TaskFormData {
  project: string;
  title: string;
  status: string;
  priority: string;
  assigned_to_id: string;
  due_date: string;
}

interface TaskFormProps {
  task?: Task;
  defaultProjectId?: string;
  onSuccess: () => void;
}

export default function TaskForm({ task, defaultProjectId, onSuccess }: TaskFormProps) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);
  const [videoUrls, setVideoUrls] = useState<string[]>(
    task?.attachments.filter((a) => a.media_type === 'VIDEO_URL').map((a) => a.video_url || '') || [''],
  );
  const [description, setDescription] = useState<Record<string, unknown>>(
    task?.description && Object.keys(task.description).length ? task.description : {},
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isMember = user?.role === 'MEMBER';

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjectsApi,
  });

  const projects: Project[] = projectsData?.results || [];

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: {
      project: task?.project || defaultProjectId || '',
      title: task?.title || '',
      status: task?.status || 'TODO',
      priority: task?.priority || 'MEDIUM',
      assigned_to_id: task?.assigned_to?.id || '',
      due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
    },
  });

  const selectedProjectId = watch('project');
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const mutation = useMutation({
    mutationFn: (fd: FormData) => (task ? updateTaskApi(task.id, fd) : createTaskApi(fd)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess();
    },
  });

  const onSubmit = (data: TaskFormData) => {
    // Members may only update the status field — send a minimal payload to avoid 403
    if (isMember && task) {
      const fd = new FormData();
      fd.append('status', data.status);
      mutation.mutate(fd);
      return;
    }

    const fd = new FormData();
    fd.append('project', data.project);
    fd.append('title', data.title);
    fd.append('description', JSON.stringify(description));
    fd.append('status', data.status);
    fd.append('priority', data.priority);
    if (data.assigned_to_id) fd.append('assigned_to_id', data.assigned_to_id);
    if (data.due_date) fd.append('due_date', data.due_date);
    files.forEach((f) => fd.append('files', f));
    videoUrls.filter(Boolean).forEach((url) => fd.append('video_urls', url));
    mutation.mutate(fd);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    setCompressing(true);
    try {
      const compressed = await compressImages(picked);
      setFiles((prev) => [...prev, ...compressed]);
    } finally {
      setCompressing(false);
      // reset input so the same file can be re-picked
      e.target.value = '';
    }
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const selectClass =
    'w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan transition-colors';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Project */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-secondary">Project *</label>
        <select {...register('project', { required: 'Project is required' })} className={selectClass} disabled={isMember}>
          <option value="">Select project...</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.project && <p className="text-xs text-accent-red">{errors.project.message}</p>}
      </div>

      {/* Title */}
      <Input
        label="Title *"
        placeholder="Task title..."
        error={errors.title?.message}
        {...register('title', { required: 'Title is required' })}
        disabled={isMember}
      />

      {/* Description — TipTap rich text */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-text-secondary">Description</label>
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Describe the task... Use @email to mention someone."
          readOnly={isMember}
          onPasteFiles={async (pastedFiles) => {
            if (isMember) return;
            setCompressing(true);
            try {
              const compressed = await compressImages(pastedFiles);
              setFiles((prev) => [...prev, ...compressed]);
            } finally {
              setCompressing(false);
            }
          }}
        />
      </div>

      {/* Status + Priority */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-secondary">Status</label>
          <select {...register('status')} className={selectClass}>
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-secondary">Priority</label>
          <select {...register('priority')} className={selectClass} disabled={isMember}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Assigned To */}
      {selectedProject && selectedProject.members.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-text-secondary">Assigned To</label>
          <select {...register('assigned_to_id')} className={selectClass} disabled={isMember}>
            <option value="">Unassigned</option>
            {selectedProject.members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.full_name} ({m.user.email})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Due Date */}
      <Input label="Due Date" type="datetime-local" {...register('due_date')} disabled={isMember} />

      {/* File Upload */}
      {!isMember && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Attachments</label>
          {/* Upload drop zone */}
          <div
            onClick={() => !compressing && fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-4 text-center transition-all ${
              compressing
                ? 'border-accent-cyan/30 cursor-not-allowed opacity-60'
                : 'border-bg-border cursor-pointer hover:border-accent-cyan/50 hover:bg-bg-tertiary/50'
            }`}
          >
            {compressing ? (
              <>
                <div className="w-5 h-5 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-accent-cyan">Compressing images…</p>
              </>
            ) : (
              <>
                <Upload size={18} className="mx-auto mb-2 text-text-muted" />
                <p className="text-xs text-text-muted">Click to upload files</p>
              </>
            )}
            <input ref={fileInputRef} type="file" title="Upload files" multiple onChange={handleFileChange} className="hidden" />
          </div>

          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => {
                const isImage = f.type.startsWith('image/');
                const sizeKB = (f.size / 1024).toFixed(0);
                return (
                  <div key={i} className="flex items-center justify-between bg-bg-tertiary rounded-lg px-3 py-2 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {isImage && <ImageIcon size={12} className="text-accent-cyan shrink-0" />}
                      <span className="text-xs text-text-secondary truncate">{f.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-text-muted">{sizeKB} KB</span>
                      <button type="button" title="Remove file" onClick={() => removeFile(i)} className="text-text-muted hover:text-accent-red">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Video URLs */}
      {!isMember && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Video URLs</label>
          {videoUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const updated = [...videoUrls];
                  updated[i] = e.target.value;
                  setVideoUrls(updated);
                }}
                placeholder="https://..."
                className="flex-1 bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 focus:border-accent-cyan"
              />
              <button
                type="button"
                title="Remove URL"
                onClick={() => setVideoUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="p-2 text-text-muted hover:text-accent-red"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setVideoUrls((prev) => [...prev, ''])}
            className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors"
          >
            <Plus size={13} />
            Add video URL
          </button>
        </div>
      )}

      {mutation.isError && <p className="text-xs text-accent-red">Failed to save task. Please try again.</p>}

      <Button type="submit" loading={mutation.isPending} className="w-full">
        {task ? 'Update Task' : 'Create Task'}
      </Button>
    </form>
  );
}
