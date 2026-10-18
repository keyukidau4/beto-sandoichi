import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';

interface PlaceholderOption {
  key: string;
  label: string;
  description: string;
}

interface PlaceholderDropdownProps {
  editor: Editor;
  placeholders: PlaceholderOption[];
}

const PlaceholderDropdown: React.FC<PlaceholderDropdownProps> = ({
  editor,
  placeholders,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const insertPlaceholder = (placeholder: string) => {
    editor.chain().focus().insertContent(placeholder).run();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-1"
        title="Insert Placeholder"
      >
        <span>📝</span>
        <span>Placeholder</span>
        <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-300 rounded shadow-lg z-20 max-h-64 overflow-y-auto">
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 font-medium">Available Placeholders</p>
          </div>
          {placeholders.map((placeholder) => (
            <button
              key={placeholder.key}
              type="button"
              onClick={() => insertPlaceholder(placeholder.key)}
              className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              title={placeholder.description}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm text-blue-600 font-medium">
                    {placeholder.key}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {placeholder.description}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {placeholder.label}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlaceholderDropdown;