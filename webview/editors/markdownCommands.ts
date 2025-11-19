import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';

/**
 * Markdown formatting commands for keyboard shortcuts
 * Implements Obsidian-style keyboard shortcuts for formatting
 */

/**
 * Wrap selected text with markdown markers
 */
function wrapSelection(view: EditorView, before: string, after: string = before): boolean {
  const selection = view.state.selection.main;
  const selectedText = view.state.doc.sliceString(selection.from, selection.to);

  if (selection.empty) {
    // No selection - insert markers and place cursor between them
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: before + after },
      selection: EditorSelection.cursor(selection.from + before.length)
    });
  } else {
    // Has selection - wrap it
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: before + selectedText + after },
      selection: EditorSelection.range(
        selection.from,
        selection.to + before.length + after.length
      )
    });
  }

  return true;
}

/**
 * Toggle bold formatting (Cmd+B / Ctrl+B)
 */
export function toggleBold(view: EditorView): boolean {
  return wrapSelection(view, '**');
}

/**
 * Toggle italic formatting (Cmd+I / Ctrl+I)
 */
export function toggleItalic(view: EditorView): boolean {
  return wrapSelection(view, '*');
}

/**
 * Toggle inline code formatting (Cmd+E / Ctrl+E)
 */
export function toggleInlineCode(view: EditorView): boolean {
  return wrapSelection(view, '`');
}

/**
 * Toggle strikethrough formatting
 */
export function toggleStrikethrough(view: EditorView): boolean {
  return wrapSelection(view, '~~');
}

/**
 * Insert link (Cmd+K / Ctrl+K)
 */
export function insertLink(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const selectedText = view.state.doc.sliceString(selection.from, selection.to);

  if (selection.empty) {
    // No selection - insert link template and place cursor on text
    const linkText = '[link text](url)';
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: linkText },
      selection: EditorSelection.range(selection.from + 1, selection.from + 10) // Select "link text"
    });
  } else {
    // Has selection - wrap it as link and place cursor on URL
    const linkText = `[${selectedText}](url)`;
    view.dispatch({
      changes: { from: selection.from, to: selection.to, insert: linkText },
      selection: EditorSelection.range(
        selection.from + selectedText.length + 3,
        selection.from + selectedText.length + 6
      ) // Select "url"
    });
  }

  return true;
}

/**
 * Insert code block (Cmd+Shift+E / Ctrl+Shift+E)
 */
export function insertCodeBlock(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const selectedText = view.state.doc.sliceString(selection.from, selection.to);

  const codeBlock = selectedText
    ? `\`\`\`\n${selectedText}\n\`\`\``
    : `\`\`\`\n\n\`\`\``;

  const cursorPos = selectedText
    ? selection.from + selectedText.length + 4 // After code and newline
    : selection.from + 4; // Between the newlines

  view.dispatch({
    changes: { from: selection.from, to: selection.to, insert: codeBlock },
    selection: EditorSelection.cursor(cursorPos)
  });

  return true;
}

/**
 * Toggle heading level (cycle through # ## ### etc.)
 */
export function toggleHeading(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check current heading level
  const headingMatch = lineText.match(/^(#{1,6})\s/);

  if (headingMatch) {
    const currentLevel = headingMatch[1].length;
    if (currentLevel < 6) {
      // Increase heading level
      const newHeading = '#'.repeat(currentLevel + 1) + ' ';
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + headingMatch[0].length,
          insert: newHeading
        }
      });
    } else {
      // Remove heading (level 6 → no heading)
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + headingMatch[0].length,
          insert: ''
        }
      });
    }
  } else {
    // No heading - add level 1
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: '# '
      }
    });
  }

  return true;
}

/**
 * Toggle bullet list (Cmd+Shift+8 / Ctrl+Shift+8)
 */
export function toggleBulletList(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check if line starts with bullet
  const bulletMatch = lineText.match(/^(\s*)[-*+]\s/);

  if (bulletMatch) {
    // Remove bullet
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + bulletMatch[0].length,
        insert: bulletMatch[1] // Keep indentation
      }
    });
  } else {
    // Add bullet
    const indent = lineText.match(/^(\s*)/)?.[1] || '';
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + indent.length,
        insert: indent + '- '
      }
    });
  }

  return true;
}

/**
 * Toggle numbered list (Cmd+Shift+7 / Ctrl+Shift+7)
 */
export function toggleNumberedList(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check if line starts with number
  const numberMatch = lineText.match(/^(\s*)\d+\.\s/);

  if (numberMatch) {
    // Remove number
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + numberMatch[0].length,
        insert: numberMatch[1] // Keep indentation
      }
    });
  } else {
    // Add number
    const indent = lineText.match(/^(\s*)/)?.[1] || '';
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + indent.length,
        insert: indent + '1. '
      }
    });
  }

  return true;
}

/**
 * Toggle blockquote (Cmd+Shift+. / Ctrl+Shift+.)
 */
export function toggleBlockquote(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check if line starts with quote marker
  const quoteMatch = lineText.match(/^>\s/);

  if (quoteMatch) {
    // Remove quote marker
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + quoteMatch[0].length,
        insert: ''
      }
    });
  } else {
    // Add quote marker
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from,
        insert: '> '
      }
    });
  }

  return true;
}

/**
 * Toggle checkbox/task list (Cmd+Alt+T / Ctrl+Alt+T)
 * Supports GitHub-flavored markdown task list syntax: - [ ] or - [x]
 */
export function toggleCheckbox(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check if line has a checkbox (checked or unchecked)
  const uncheckedMatch = lineText.match(/^(\s*)[-*+]\s\[\s\]\s/);
  const checkedMatch = lineText.match(/^(\s*)[-*+]\s\[x\]\s/i);

  if (uncheckedMatch) {
    // Toggle unchecked to checked
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + uncheckedMatch[0].length,
        insert: uncheckedMatch[1] + '- [x] '
      }
    });
  } else if (checkedMatch) {
    // Remove checkbox (toggle checked to no checkbox)
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + checkedMatch[0].length,
        insert: checkedMatch[1] + '- '
      }
    });
  } else {
    // No checkbox - add unchecked checkbox
    const bulletMatch = lineText.match(/^(\s*)[-*+]\s/);
    if (bulletMatch) {
      // Already a bullet point - convert to unchecked checkbox
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + bulletMatch[0].length,
          insert: bulletMatch[1] + '- [ ] '
        }
      });
    } else {
      // Not a list item - add checkbox list item
      const indent = lineText.match(/^(\s*)/)?.[1] || '';
      view.dispatch({
        changes: {
          from: line.from,
          to: line.from + indent.length,
          insert: indent + '- [ ] '
        }
      });
    }
  }

  return true;
}
