import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Bold,
    Code,
    Heading1,
    Heading2,
    Italic,
    Link as LinkIcon,
    List,
    ListOrdered,
    Quote,
    Redo,
    RotateCcw,
    Sparkles,
    Strikethrough,
    Undo,
    X,
} from 'lucide-react';
import { marked } from 'marked';
import { useCallback, useEffect, useState } from 'react';

import ContentEnhanceController from '@/actions/App/Http/Controllers/Api/ContentEnhanceController';

// Configure marked for safe HTML output
marked.setOptions({
    breaks: true,
    gfm: true,
});

type MarkdownEditorProps = {
    id?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    minCharsToEnhance?: number;
    title?: string;
    error?: string;
    className?: string;
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
            className={`rounded p-1.5 transition-colors ${
                isActive ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            } disabled:cursor-not-allowed disabled:opacity-50`}
        >
            {children}
        </button>
    );
}

function ToolbarDivider() {
    return <div className="mx-1 h-6 w-px bg-gray-200" />;
}

export default function MarkdownEditor({
    id,
    value,
    onChange,
    placeholder = 'Write something...',
    minCharsToEnhance = 20,
    title,
    error,
    className = '',
}: MarkdownEditorProps) {
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [originalContent, setOriginalContent] = useState<string | null>(null);
    const [enhanceError, setEnhanceError] = useState<string | null>(null);
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
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    // Sync external value changes
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    const textLength = editor?.getText().length || 0;
    const canEnhance = textLength >= minCharsToEnhance;
    const hasEnhanced = originalContent !== null;

    const handleEnhance = useCallback(async () => {
        if (!canEnhance || isEnhancing || !editor) return;

        setIsEnhancing(true);
        setEnhanceError(null);
        setOriginalContent(editor.getHTML());

        try {
            const response = await fetch(ContentEnhanceController.url(), {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '',
                },
                body: JSON.stringify({
                    content: editor.getText(),
                    title: title || null,
                    type: 'estate_board',
                }),
            });

            const data = await response.json();

            if (data.success && data.enhanced) {
                // Parse markdown to HTML
                const enhanced = marked.parse(data.enhanced) as string;
                editor.commands.setContent(enhanced);
                onChange(enhanced);
            } else {
                setEnhanceError(data.message || 'Enhancement failed');
                setOriginalContent(null);
            }
        } catch (err) {
            setEnhanceError('Failed to connect. Please try again.');
            setOriginalContent(null);
        } finally {
            setIsEnhancing(false);
        }
    }, [canEnhance, isEnhancing, editor, title, onChange]);

    const handleRevert = useCallback(() => {
        if (originalContent !== null && editor) {
            editor.commands.setContent(originalContent);
            onChange(originalContent);
            setOriginalContent(null);
        }
    }, [originalContent, editor, onChange]);

    const dismissError = useCallback(() => {
        setEnhanceError(null);
    }, []);

    const setLink = useCallback(() => {
        if (!editor) return;

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
            {/* Toolbar */}
            <div
                className={`flex flex-wrap items-center gap-0.5 rounded-t-lg border border-b-0 border-gray-300 bg-gray-50 px-2 py-1.5 ${
                    hasEnhanced ? 'border-violet-300 bg-violet-50/50' : ''
                } ${error ? 'border-red-300' : ''}`}
            >
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <Bold className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <Italic className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    isActive={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <Strikethrough className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    isActive={editor.isActive('code')}
                    title="Inline Code"
                >
                    <Code className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    isActive={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    <Heading1 className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    isActive={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    <Heading2 className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    isActive={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    <List className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    isActive={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    isActive={editor.isActive('blockquote')}
                    title="Quote"
                >
                    <Quote className="h-4 w-4" />
                </ToolbarButton>

                <ToolbarDivider />

                <div className="relative">
                    <ToolbarButton
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        isActive={editor.isActive('link')}
                        title="Add Link"
                    >
                        <LinkIcon className="h-4 w-4" />
                    </ToolbarButton>
                    {showLinkInput && (
                        <div className="absolute top-full left-0 z-10 mt-1 flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="w-48 rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:outline-none"
                                onKeyDown={(e) => e.key === 'Enter' && setLink()}
                            />
                            <button
                                type="button"
                                onClick={setLink}
                                className="rounded bg-primary-600 px-2 py-1 text-xs text-white hover:bg-primary-700"
                            >
                                Set
                            </button>
                        </div>
                    )}
                </div>

                <ToolbarDivider />

                <ToolbarButton
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="h-4 w-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="h-4 w-4" />
                </ToolbarButton>

                {/* AI Enhancement Section */}
                <div className="ml-auto flex items-center gap-2">
                    <AnimatePresence>
                        {hasEnhanced && (
                            <motion.div
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-1.5 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700"
                            >
                                <Sparkles className="h-3 w-3" />
                                AI Enhanced
                                <button
                                    type="button"
                                    onClick={handleRevert}
                                    className="ml-1 rounded-full p-0.5 transition-colors hover:bg-violet-200"
                                    title="Revert to original"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {canEnhance && !isEnhancing && !hasEnhanced && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                type="button"
                                onClick={handleEnhance}
                                className="flex items-center gap-1.5 rounded-lg bg-linear-to-r from-violet-600 to-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Enhance with AI
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isEnhancing && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-2 rounded-lg bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700"
                            >
                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300 border-t-violet-600" />
                                Enhancing...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Editor Content */}
            <div
                className={`rounded-b-lg border border-gray-300 bg-white ${
                    hasEnhanced ? 'border-violet-300 bg-violet-50/30' : ''
                } ${error ? 'border-red-300' : ''}`}
            >
                <EditorContent editor={editor} />
            </div>

            {/* Error Toast */}
            <AnimatePresence>
                {enhanceError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 -bottom-12 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 shadow-lg ring-1 ring-red-100"
                    >
                        <span>{enhanceError}</span>
                        <button type="button" onClick={dismissError} className="rounded p-0.5 hover:bg-red-100">
                            <X className="h-3 w-3" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
    );
}
