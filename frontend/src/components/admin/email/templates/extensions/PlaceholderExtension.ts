import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

export interface PlaceholderOptions {
  placeholders: Array<{
    key: string;
    label: string;
    description: string;
  }>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    placeholder: {
      insertPlaceholder: (placeholder: string) => ReturnType;
    };
  }
}

export const PlaceholderExtension = Extension.create<PlaceholderOptions>({
  name: 'placeholder',

  addOptions() {
    return {
      placeholders: [
        { key: '{{name}}', label: 'Name', description: 'Buyer name' },
        { key: '{{email}}', label: 'Email', description: 'Buyer email address' },
        { key: '{{point}}', label: 'Points', description: 'Current point balance' },
        { key: '{{currentDate}}', label: 'Current Date', description: 'Today\'s date' },
        { key: '{{systemName}}', label: 'System Name', description: 'BanhMi App' },
        { key: '{{orderNumber}}', label: 'Order Number', description: 'Order number (for order emails)' },
        { key: '{{totalAmount}}', label: 'Total Amount', description: 'Order total amount (for order emails)' },
        { key: '{{orderStatus}}', label: 'Order Status', description: 'Order status (for order emails)' },
      ],
    };
  },

  addCommands() {
    return {
      insertPlaceholder:
        (placeholder: string) =>
        ({ commands }) => {
          return commands.insertContent({
            type: 'text',
            text: placeholder,
          });
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('placeholder-decoration'),
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = [];
            const doc = state.doc;

            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const text = node.text;
                const placeholderRegex = /\{\{[^}]+\}\}/g;
                let match;

                while ((match = placeholderRegex.exec(text)) !== null) {
                  const start = pos + match.index;
                  const end = start + match[0].length;
                  
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'placeholder-token',
                      title: this.options.placeholders.find(p => p.key === match![0])?.description || 'Placeholder',
                    })
                  );
                }
              }
            });

            return DecorationSet.create(doc, decorations);
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          placeholder: {
            default: null,
            parseHTML: element => element.getAttribute('data-placeholder'),
            renderHTML: attributes => {
              if (!attributes.placeholder) {
                return {};
              }
              return {
                'data-placeholder': attributes.placeholder,
              };
            },
          },
        },
      },
    ];
  },
});

export default PlaceholderExtension;