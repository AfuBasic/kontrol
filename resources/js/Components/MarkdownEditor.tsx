import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Code, Heading1, Heading2, Italic, Link as LinkIcon, List, ListOrdered, Quote, Redo, Strikethrough, Undo } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type MarkdownEditorProps = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    error?: string;
    className?: string;
    minHeight?: string;
    compact?: boolean;
};

type ToolbarButtonProps = {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
};

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`rounded-lg p-1.5 transition-colors ${
                isActive
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                    : 'text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
            } disabled:cursor-not-allowed disabled:opacity-40`}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800" />;
}

export default function MarkdownEditor({
    id,
    value,
    onChange,
    placeholder = 'Write something...',
    error,
    className = '',
    minHeight = 'min-h-[150px]',
    compact = false,
}: MarkdownEditorProps) {
    const [linkUrl, setLinkUrl] = useState('');
    const [showLinkInput, setShowLinkInput] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2],
                },
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary-600 underline hover:text-primary-700',
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
            Typography,
        ],
        content: value,
        editorProps: {
            attributes: {
                id: id || '',
                class: `prose prose-sm max-w-none focus:outline-none ${minHeight} px-3.5 py-2.5 dark:prose-invert`,
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const textLength = editor?.getText().length || 0;

    const setLink = useCallback(() => {
        if (!editor) {
            return;
        }

        if (linkUrl === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
        } else {
            editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
        }
        setShowLinkInput(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    if (!editor) {
        return null;
    }

    return (
        <div className={`relative ${className}`}>
            <div
                className={`flex flex-wrap items-center gap-0.5 rounded-t-xl border border-b-0 border-slate-200 bg-slate-50/90 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900/90 ${
                    error ? 'border-rose-300 dark:border-rose-800' : ''
                }`}
            >
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
                    <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                    <Strikethrough className="h-3.5 w-3.5" />
                </ToolbarButton>
                {!compact && (
                    <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline Code">
                        <Code className="h-3.5 w-3.5" />
                    </ToolbarButton>
                )}

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-3.5 w-3.5" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="h-3.5 w-3.5" />
                </ToolbarButton>
                {!compact && (
                    <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Quote">
                        <Quote className="h-3.5 w-3.5" />
                    </ToolbarButton>
                )}

                <ToolbarDivider />

                <div className="relative">
                    <ToolbarButton onClick={() => setShowLinkInput(!showLinkInput)} isActive={editor.isActive('link')} title="Add Link">
                        <LinkIcon className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    {showLinkInput && (
                        <div className="absolute top-full left-0 z-20 mt-1 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-48 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-900 focus:border-primary-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                            />
                            <button
                                type="button"
                                onClick={setLink}
                                className="rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-primary-700 active:scale-95"
                            >
                                Set
                            </button>
                        </div>
                    )}
                </div>

                <div className="ml-auto flex items-center gap-0.5">
                    <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
                        <Undo className="h-3.5 w-3.5" />
                    </ToolbarButton>
                    <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
                        <Redo className="h-3.5 w-3.5" />
                    </ToolbarButton>
                </div>
            </div>

            <div className={`rounded-b-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${error ? 'border-rose-300 dark:border-rose-800' : ''}`}>
                <EditorContent editor={editor} />
            </div>

            <div className="mt-1 flex justify-end text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <span>{textLength.toLocaleString()} characters</span>
            </div>

            {error && <p className="mt-1 text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
    );
}
