import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Link from '@tiptap/extension-link';
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from '@tiptap/extension-table';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useCallback, useEffect } from 'react';
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon,
  Table as TableIcon,
  Unlink,
} from 'lucide-react';

// ─── Link modal ─────────────────────────────────────────────────────────────

function LinkModal({
  onConfirm,
  onClose,
  initial,
}: {
  onConfirm: (url: string) => void;
  onClose: () => void;
  initial?: string;
}) {
  const [url, setUrl] = useState(initial || 'https://');
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-bg-border rounded-xl p-5 w-80 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-text-primary mb-3">Insert Link</p>
        <input
          autoFocus
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm(url);
            if (e.key === 'Escape') onClose();
          }}
          className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-cyan/50 mb-3"
          placeholder="https://..."
        />
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-text-secondary bg-bg-tertiary hover:bg-bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(url)}
            className="px-3 py-1.5 rounded-lg text-xs text-white bg-accent-cyan hover:bg-accent-cyan/80 transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table modal ─────────────────────────────────────────────────────────────

function TableModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (rows: number, cols: number) => void;
  onClose: () => void;
}) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="bg-bg-secondary border border-bg-border rounded-xl p-5 w-72 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm font-semibold text-text-primary mb-3">Insert Table</p>
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs text-text-muted mb-1 block">Rows</label>
            <input
              type="number"
              title="Number of rows"
              min={1}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-text-muted mb-1 block">Columns</label>
            <input
              type="number"
              title="Number of columns"
              min={1}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-full bg-bg-tertiary border border-bg-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-cyan/50"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs text-text-secondary bg-bg-tertiary hover:bg-bg-border transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(rows, cols)}
            className="px-3 py-1.5 rounded-lg text-xs text-white bg-accent-cyan hover:bg-accent-cyan/80 transition-colors"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toolbar ─────────────────────────────────────────────────────────────────

function ToolbarButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active
          ? 'bg-accent-cyan/20 text-accent-cyan'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-border'
      }`}
    >
      {children}
    </button>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export interface RichTextEditorProps {
  value?: Record<string, unknown>;
  onChange?: (json: Record<string, unknown>) => void;
  placeholder?: string;
  /** If true, show only Bold + Lists (for comments). Default false = full toolbar */
  compact?: boolean;
  /** Read-only rendering */
  readOnly?: boolean;
}

const FULL_EXTENSIONS = [
  StarterKit.configure({ heading: false, bulletList: false, orderedList: false }),
  Heading.configure({ levels: [1, 2, 3] }),
  BulletList,
  OrderedList,
  Link.configure({ openOnClick: false }),
  Table.configure({ resizable: false }),
  TableRow,
  TableCell,
  TableHeader,
];

const COMPACT_EXTENSIONS = [
  StarterKit.configure({ heading: false }),
  BulletList,
  OrderedList,
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  compact = false,
  readOnly = false,
}: RichTextEditorProps) {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);

  const editor = useEditor({
    extensions: [
      ...(compact ? COMPACT_EXTENSIONS : FULL_EXTENSIONS),
      Placeholder.configure({ placeholder }),
    ],
    content: value && Object.keys(value).length ? value : undefined,
    editable: !readOnly,
    onUpdate({ editor }) {
      if (onChange) onChange(editor.getJSON() as Record<string, unknown>);
    },
  });

  // Sync external value changes (e.g. form reset)
  useEffect(() => {
    if (!editor) return;
    if (!value || Object.keys(value).length === 0) {
      editor.commands.clearContent();
      return;
    }
    const current = JSON.stringify(editor.getJSON());
    const incoming = JSON.stringify(value);
    if (current !== incoming) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const handleLinkConfirm = useCallback(
    (url: string) => {
      setShowLinkModal(false);
      if (!editor) return;
      if (url) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    },
    [editor],
  );

  const handleTableConfirm = useCallback(
    (rows: number, cols: number) => {
      setShowTableModal(false);
      if (!editor) return;
      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
    },
    [editor],
  );

  if (!editor) return null;

  return (
    <>
      <div className="border border-bg-border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-accent-cyan/50 focus-within:border-accent-cyan transition-colors">
        {!readOnly && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-bg-border bg-bg-tertiary flex-wrap">
            <ToolbarButton
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold size={14} />
            </ToolbarButton>

            {!compact && (
              <>
                <ToolbarButton
                  active={editor.isActive('heading', { level: 1 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                  title="Heading 1"
                >
                  <Heading1 size={14} />
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive('heading', { level: 2 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                  title="Heading 2"
                >
                  <Heading2 size={14} />
                </ToolbarButton>
                <ToolbarButton
                  active={editor.isActive('heading', { level: 3 })}
                  onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                  title="Heading 3"
                >
                  <Heading3 size={14} />
                </ToolbarButton>
              </>
            )}

            <div className="w-px h-4 bg-bg-border mx-1" />

            <ToolbarButton
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List size={14} />
            </ToolbarButton>
            <ToolbarButton
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered size={14} />
            </ToolbarButton>

            {!compact && (
              <>
                <div className="w-px h-4 bg-bg-border mx-1" />
                <ToolbarButton
                  active={editor.isActive('link')}
                  onClick={() => {
                    if (editor.isActive('link')) {
                      editor.chain().focus().unsetLink().run();
                    } else {
                      setShowLinkModal(true);
                    }
                  }}
                  title={editor.isActive('link') ? 'Remove link' : 'Insert link'}
                >
                  {editor.isActive('link') ? <Unlink size={14} /> : <LinkIcon size={14} />}
                </ToolbarButton>
                <ToolbarButton
                  active={false}
                  onClick={() => setShowTableModal(true)}
                  title="Insert table"
                >
                  <TableIcon size={14} />
                </ToolbarButton>
              </>
            )}
          </div>
        )}

        <EditorContent
          editor={editor}
          className="prose-editor min-h-[100px] px-3 py-2 text-sm text-text-primary focus:outline-none"
        />
      </div>

      {showLinkModal && (
        <LinkModal
          initial={editor.getAttributes('link').href}
          onConfirm={handleLinkConfirm}
          onClose={() => setShowLinkModal(false)}
        />
      )}
      {showTableModal && (
        <TableModal onConfirm={handleTableConfirm} onClose={() => setShowTableModal(false)} />
      )}
    </>
  );
}
