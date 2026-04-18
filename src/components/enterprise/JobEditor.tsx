"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface JobEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const JobEditor = ({ content, onChange, placeholder }: JobEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-indigo-600 underline',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || 'Start typing your job description...',
            }),
        ],
        immediatelyRender: false,
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose-custom focus:outline-none min-h-[400px] p-10 selection:bg-indigo-100',
            },
        },
    });

    // Support for external content updates (like AI generation)
    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            // If it's markdown-like, Tiptap won't handle it perfectly without the extension,
            // but for new AI drafts we can ensure they are HTML-ish or just set it.
            editor.commands.setContent(content);
        }
    }, [content, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="flex flex-col w-full h-full bg-white">
            {/* Toolbar - Integrated top bar */}
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 z-10">
                <div className="flex items-center gap-1 mr-2">
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
                        title="Undo"
                    >
                        <span className="material-symbols-rounded text-xl">undo</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white hover:text-indigo-600 transition-all shadow-sm"
                        title="Redo"
                    >
                        <span className="material-symbols-rounded text-xl">redo</span>
                    </button>
                </div>


                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('bold') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                    >
                        <span className="material-symbols-rounded text-xl">format_bold</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                    >
                        <span className="material-symbols-rounded text-xl">format_italic</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('underline') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                    >
                        <span className="material-symbols-rounded text-xl">format_underlined</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('bulletList') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                    >
                        <span className="material-symbols-rounded text-xl">format_list_bulleted</span>
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('orderedList') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                    >
                        <span className="material-symbols-rounded text-xl">format_list_numbered</span>
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-200 mx-2"></div>

                <button
                    onClick={() => {
                        const url = window.prompt('Enter URL');
                        if (url) {
                            editor.chain().focus().setLink({ href: url }).run();
                        } else if (url === '') {
                            editor.chain().focus().unsetLink().run();
                        }
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('link') ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 hover:text-indigo-600'}`}
                >
                    <span className="material-symbols-rounded text-xl">link</span>
                </button>
            </div>

            {/* Editor Canvas - Single Layer Style */}
            <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                <style jsx global>{`
                    .prose-custom ul, .ProseMirror ul {
                        list-style-type: disc !important;
                        padding-left: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }
                    .prose-custom ol, .ProseMirror ol {
                        list-style-type: decimal !important;
                        padding-left: 1.5rem !important;
                        margin-bottom: 1rem !important;
                    }
                    .prose-custom li, .ProseMirror li {
                        margin-bottom: 0.25rem !important;
                        display: list-item !important;
                    }
                    .prose-custom p, .ProseMirror p {
                        margin-bottom: 0.75rem !important;
                    }
                `}</style>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default JobEditor;
