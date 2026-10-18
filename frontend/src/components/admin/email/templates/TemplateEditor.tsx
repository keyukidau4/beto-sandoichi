import React, { useCallback, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import PlaceholderExtension from "./extensions/PlaceholderExtension";
import PlaceholderDropdown from "./components/PlaceholderDropdown";

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  value,
  onChange,
  // placeholder = "メールの内容を入力してください...",
  className = "",
  error,
}) => {
  const [isPreview, setIsPreview] = useState(false);

  const placeholders = [
    { key: '{{name}}', label: 'Name', description: 'Buyer name' },
    { key: '{{email}}', label: 'Email', description: 'Buyer email address' },
    { key: '{{point}}', label: 'Points', description: 'Current point balance' },
    { key: '{{currentDate}}', label: 'Current Date', description: 'Today\'s date' },
    { key: '{{systemName}}', label: 'System Name', description: 'BanhMi App' },
    { key: '{{orderNumber}}', label: 'Order Number', description: 'Order number (for order emails)' },
    { key: '{{totalAmount}}', label: 'Total Amount', description: 'Order total amount (for order emails)' },
    { key: '{{orderStatus}}', label: 'Order Status', description: 'Order status (for order emails)' },
  ];

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
      PlaceholderExtension.configure({
        placeholders,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
      },
    },
  });

  const ToolbarButton: React.FC<{
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, isActive = false, disabled = false, title, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
        isActive ? 'bg-blue-100 border-blue-400' : ''
      }`}
    >
      {children}
    </button>
  );

  const ColorPicker: React.FC<{
    type: 'text' | 'highlight';
    currentColor?: string;
  }> = ({ type, currentColor }) => {
    const colors = [
      '#000000', '#374151', '#6B7280', '#EF4444', '#F59E0B', 
      '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#FFFFFF'
    ];

    return (
      <div className="relative group">
        <button
          type="button"
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          title={type === 'text' ? 'Text Color' : 'Highlight Color'}
        >
          <div className="flex items-center gap-1">
            <span>{type === 'text' ? 'A' : 'H'}</span>
            <div 
              className="w-3 h-3 border border-gray-300 rounded"
              style={{ backgroundColor: currentColor || (type === 'text' ? '#000000' : '#FFFF00') }}
            />
          </div>
        </button>
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded shadow-lg hidden group-hover:block z-10">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((color) => (
              <button
                key={color}
                type="button"
                className="w-6 h-6 border border-gray-300 rounded hover:scale-110 transition-transform"
                style={{ backgroundColor: color }}
                onClick={() => {
                  if (type === 'text') {
                    editor?.chain().focus().setColor(color).run();
                  } else {
                    editor?.chain().focus().setHighlight({ color }).run();
                  }
                }}
              />
            ))}
          </div>
          {type === 'highlight' && (
            <button
              type="button"
              className="w-full mt-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              onClick={() => editor?.chain().focus().unsetHighlight().run()}
            >
              Remove Highlight
            </button>
          )}
        </div>
      </div>
    );
  };

  const addLink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor?.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={className}>
      <style>{`
        .placeholder-token {
          background-color: #dbeafe;
          color: #1e40af;
          padding: 2px 4px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.875em;
          font-weight: 500;
          border: 1px solid #93c5fd;
          cursor: help;
        }
        .placeholder-token:hover {
          background-color: #bfdbfe;
          border-color: #60a5fa;
        }
      `}</style>
      <div
        className={`border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        {/* Toolbar */}
        <div className="border-b border-gray-200 p-2 bg-gray-50 rounded-t-md">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Text Formatting */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                isActive={editor.isActive('bold')}
                title="Bold"
              >
                <strong>B</strong>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                isActive={editor.isActive('italic')}
                title="Italic"
              >
                <em>I</em>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                isActive={editor.isActive('underline')}
                title="Underline"
              >
                <u>U</u>
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleStrike().run()}
                isActive={editor.isActive('strike')}
                title="Strikethrough"
              >
                <s>S</s>
              </ToolbarButton>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                isActive={editor.isActive('heading', { level: 1 })}
                title="Heading 1"
              >
                H1
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                isActive={editor.isActive('heading', { level: 2 })}
                title="Heading 2"
              >
                H2
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                isActive={editor.isActive('heading', { level: 3 })}
                title="Heading 3"
              >
                H3
              </ToolbarButton>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                isActive={editor.isActive('bulletList')}
                title="Bullet List"
              >
                •
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                isActive={editor.isActive('orderedList')}
                title="Ordered List"
              >
                1.
              </ToolbarButton>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                isActive={editor.isActive({ textAlign: 'left' })}
                title="Align Left"
              >
                ⬅
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                isActive={editor.isActive({ textAlign: 'center' })}
                title="Align Center"
              >
                ↔
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                isActive={editor.isActive({ textAlign: 'right' })}
                title="Align Right"
              >
                ➡
              </ToolbarButton>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ColorPicker type="text" currentColor={editor.getAttributes('textStyle').color} />
              <ColorPicker type="highlight" />
            </div>

            {/* Link */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={addLink}
                isActive={editor.isActive('link')}
                title="Add Link"
              >
                🔗
              </ToolbarButton>
              {editor.isActive('link') && (
                <ToolbarButton
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  title="Remove Link"
                >
                  🔗❌
                </ToolbarButton>
              )}
            </div>

            {/* Placeholder Dropdown */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <PlaceholderDropdown editor={editor} placeholders={placeholders} />
            </div>

            {/* Undo/Redo */}
            <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
              <ToolbarButton
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo"
              >
                ↶
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo"
              >
                ↷
              </ToolbarButton>
            </div>

            {/* Preview Toggle */}
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => setIsPreview(!isPreview)}
                className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isPreview
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {isPreview ? "Edit" : "Preview"}
              </button>
            </div>
          </div>
        </div>

        {/* Editor/Preview Area */}
        {isPreview ? (
          <div
            className="p-4 min-h-[200px] prose max-w-none"
            dangerouslySetInnerHTML={{ __html: value }}
          />
        ) : (
          <EditorContent 
            editor={editor} 
            className="min-h-[200px]"
          />
        )}
      </div>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <div className="text-xs text-gray-500 mt-2">
        <p>💡 プレースホルダーを使用して動的なコンテンツを挿入できます</p>
        <p>例: {`{{name}}、{{email}}、{{point}}`} など</p>
        <p>
          📝 リッチテキストエディターで様々な書式設定が可能です
        </p>
      </div>
    </div>
  );
};

export default TemplateEditor;
