import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProjectsApi, createProjectApi } from '@/api/projects';
import { Project } from '@/types';
import ProjectCard from '@/components/projects/ProjectCard';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import { useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';

interface ProjectFormData {
  name: string;
  description: string;
}

export default function ProjectsPage() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>();

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjectsApi,
  });

  const mutation = useMutation({
    mutationFn: createProjectApi,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      setIsOpen(false);
      reset();
    },
  });

  const projects: Project[] = data?.results || [];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Projects</h2>
          <p className="text-sm text-text-secondary mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role !== 'MEMBER' && (
          <Button leftIcon={<Plus size={14} />} onClick={() => setIsOpen(true)} className="w-full sm:w-auto justify-center">
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban size={28} />}
          title="No projects yet"
          description="Create your first project to start organizing tasks."
          action={{ label: 'New Project', onClick: () => setIsOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={() => { setIsOpen(false); reset(); }} title="New Project">
        <form
          onSubmit={handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <Input
            label="Project Name *"
            placeholder="My Awesome Project"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Textarea
            label="Description"
            placeholder="What is this project about?"
            rows={3}
            {...register('description')}
          />
          {mutation.isError && (
            <p className="text-xs text-accent-red">Failed to create project.</p>
          )}
          <Button type="submit" loading={mutation.isPending} className="w-full">
            Create Project
          </Button>
        </form>
      </Modal>
    </>
  );
}
