import { useQuery } from '@tanstack/react-query';
import { getProjectsApi } from '@/api/projects';
import { getTasksApi } from '@/api/tasks';
import { useAuthStore } from '@/store/authStore';
import { Project, Task } from '@/types';
import { format, parseISO } from 'date-fns';
import { FolderKanban, CheckSquare, Clock, CheckCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import React from 'react';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-bg-secondary border border-bg-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold font-mono text-text-primary">{value}</p>
      <p className="text-xs text-text-secondary mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: projectsData, isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjectsApi,
  });

  const { data: tasksData, isLoading: loadingTasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => getTasksApi(),
  });

  const projects: Project[] = projectsData?.results || [];
  const tasks: Task[] = tasksData?.results || [];

  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const doneCount = tasks.filter((t) => t.status === 'DONE').length;

  const recentTasks = [...tasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  if (loadingProjects || loadingTasks) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary">
          Good day, <span className="text-accent-cyan">{user?.full_name.split(' ')[0]}</span> 👋
        </h2>
        <p className="text-sm text-text-secondary mt-0.5">Here's what's happening with your projects.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban size={16} className="text-accent-cyan" />}
          label="Total Projects"
          value={projects.length}
          color="bg-accent-cyan/10"
        />
        <StatCard
          icon={<CheckSquare size={16} className="text-accent-purple" />}
          label="Total Tasks"
          value={tasks.length}
          color="bg-accent-purple/10"
        />
        <StatCard
          icon={<Clock size={16} className="text-accent-yellow" />}
          label="In Progress"
          value={inProgressCount}
          color="bg-accent-yellow/10"
        />
        <StatCard
          icon={<CheckCircle size={16} className="text-accent-green" />}
          label="Completed"
          value={doneCount}
          color="bg-accent-green/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tasks */}
        <div className="lg:col-span-2 bg-bg-secondary border border-bg-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Recent Tasks</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs text-accent-cyan hover:underline"
            >
              View all
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{task.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {format(parseISO(task.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={task.priority} />
                    <Badge variant={task.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div className="bg-bg-secondary border border-bg-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">Projects</h3>
            <button
              onClick={() => navigate('/projects')}
              className="text-xs text-accent-cyan hover:underline"
            >
              View all
            </button>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8">No projects yet.</p>
          ) : (
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => (
                <div
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-tertiary transition-colors cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center flex-shrink-0">
                    <FolderKanban size={14} className="text-accent-cyan" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate group-hover:text-accent-cyan transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-text-muted">{project.members.length} members</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
