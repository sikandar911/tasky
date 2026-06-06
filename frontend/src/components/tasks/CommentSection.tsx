import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCommentsApi, createCommentApi, deleteCommentApi } from '@/api/tasks';
import { TaskComment } from '@/types';
import { useAuthStore } from '@/store/authStore';
import RichTextEditor from '@/components/ui/RichTextEditor';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { Trash2, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// ─── Read-only TipTap renderer ────────────────────────────────────────────────

function RichTextView({ content }: { content: Record<string, unknown> }) {
  if (!content || Object.keys(content).length === 0) return null;
  return (
    <RichTextEditor value={content} readOnly compact />
  );
}

// ─── Single comment ───────────────────────────────────────────────────────────

function CommentItem({
  comment,
  taskId,
  canDelete,
}: {
  comment: TaskComment;
  taskId: string;
  canDelete: boolean;
}) {
  const qc = useQueryClient();
  const deleteMut = useMutation({
    mutationFn: () => deleteCommentApi(taskId, comment.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comments', taskId] }),
  });

  const initials = comment.author.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-[9px] font-bold text-accent-cyan">{initials}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-primary">{comment.author.full_name}</span>
          <span className="text-[10px] text-text-muted">
            {format(parseISO(comment.created_at), 'MMM d, HH:mm')}
          </span>
          {canDelete && (
            <button
              type="button"
              title="Delete comment"
              onClick={() => {
                if (confirm('Delete comment?')) deleteMut.mutate();
              }}
              className="ml-auto text-text-muted hover:text-accent-red transition-colors"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
        <div className="bg-bg-tertiary rounded-lg px-3 py-2 border border-bg-border/50">
          <RichTextView content={comment.body} />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CommentSection({ taskId }: { taskId: string }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [body, setBody] = useState<Record<string, unknown>>({});

  const { data: comments = [], isLoading } = useQuery<TaskComment[]>({
    queryKey: ['comments', taskId],
    queryFn: () => getCommentsApi(taskId),
    enabled: !!taskId,
  });

  const createMut = useMutation({
    mutationFn: () => createCommentApi(taskId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', taskId] });
      setBody({});
    },
  });

  const hasContent = body && Object.keys(body).length > 0 &&
    // Check that tiptap doc has at least some text content
    JSON.stringify(body).length > 40;

  return (
    <div className="space-y-4">
      <p className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
        <MessageSquare size={12} />
        Comments ({comments.length})
      </p>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-text-muted text-center py-3">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              taskId={taskId}
              canDelete={
                c.author.id === user?.id ||
                user?.role === 'SUPERADMIN' ||
                user?.role === 'ADMIN'
              }
            />
          ))}
        </div>
      )}

      {/* New comment form */}
      <div className="space-y-2 pt-2 border-t border-bg-border">
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="Write a comment... (bold, lists supported)"
          compact
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => createMut.mutate()}
            loading={createMut.isPending}
            disabled={!hasContent}
          >
            Post Comment
          </Button>
        </div>
      </div>
    </div>
  );
}
