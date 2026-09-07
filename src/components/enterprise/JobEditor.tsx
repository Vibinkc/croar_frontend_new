"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { useEffect } from 'react';
import { useI18n } from "@/context/I18nContext";

interface JobEditorProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
}

const JobEditor = ({ content, onChange, placeholder }: JobEditorProps) => {
    const { t } = useI18n();
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-[#1976D2] underline',
                },
            }),
            Placeholder.configure({
                placeholder: placeholder || t("jobForm.editorStartTyping"),
            }),
            // Renders <mark> so AI-added JD text can be shown highlighted (green = newly added).
            Highlight.configure({
                HTMLAttributes: {
                    class: 'bg-[#D8F5E3] text-[#0B6B56] rounded-[3px] px-0.5 box-decoration-clone',
                },
            }),
        ],
        immediatelyRender: false,
        content: content,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose-custom focus:outline-none min-h-[400px] p-10 selection:bg-[#E3F2FD]',
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
            <div className="px-6 py-3 border-b border-[#E0E0E0] bg-[#FAFAFA] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 z-10">
                <div className="flex items-center gap-1 mr-2">
                    <button
                        onClick={() => editor.chain().focus().undo().run()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9E9E] hover:bg-white hover:text-[#1976D2] transition-all shadow-sm"
                        title={t("common.undo")}
                    >
                        <i className="mdi mdi-undo text-xl" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().redo().run()}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9E9E9E] hover:bg-white hover:text-[#1976D2] transition-all shadow-sm"
                        title={t("common.redo")}
                    >
                        <i className="mdi mdi-redo text-xl" />
                    </button>
                </div>


                <div className="w-px h-6 bg-[#E0E0E0] mx-2"></div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('bold') ? 'bg-[#1976D2] text-white' : 'bg-white text-[#424242] hover:text-[#1976D2]'}`}
                    >
                        <i className="mdi mdi-format-bold text-xl" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('') ? 'bg-[#1976D2] text-white' : 'bg-white text-[#424242] hover:text-[#1976D2]'}`}
                    >
                        <i className="mdi mdi-format-italic text-xl" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('underline') ? 'bg-[#1976D2] text-white' : 'bg-white text-[#424242] hover:text-[#1976D2]'}`}
                    >
                        <i className="mdi mdi-format-underline text-xl" />
                    </button>
                </div>

                <div className="w-px h-6 bg-[#E0E0E0] mx-2"></div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('bulletList') ? 'bg-[#1976D2] text-white' : 'bg-white text-[#424242] hover:text-[#1976D2]'}`}
                    >
                        <i className="mdi mdi-format-list-bulleted text-xl" />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shadow-sm ${editor.isActive('orderedList') ? 'bg-[#1976D2] text-white' : 'bg-white text-[#424242] hover:text-[#1976D2]'}`}
                    >
                        <i className="mdi mdi-format-list-numbered text-xl" />
                    </button>
                </div>

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
