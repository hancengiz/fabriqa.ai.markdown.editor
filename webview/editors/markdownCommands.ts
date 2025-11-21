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
 * Supports checkbox syntax: [ ] or [x] (with or without list marker prefix)
 */
export function toggleCheckbox(view: EditorView): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);
  const lineText = line.text;

  // Check if line has a checkbox (checked or unchecked, with or without list marker)
  const uncheckedMatch = lineText.match(/^(\s*)(?:[-*+]\s)?\[\s\](?:\s|$)/);
  const checkedMatch = lineText.match(/^(\s*)(?:[-*+]\s)?\[x\](?:\s|$)/i);

  if (uncheckedMatch) {
    // Toggle unchecked to checked (preserve list marker if present)
    const hasListMarker = lineText.match(/^(\s*)[-*+]\s\[\s\]/);
    const indent = uncheckedMatch[1];
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + uncheckedMatch[0].length,
        insert: hasListMarker ? indent + '- [x] ' : indent + '[x] '
      }
    });
  } else if (checkedMatch) {
    // Toggle checked to unchecked (preserve list marker if present)
    const hasListMarker = lineText.match(/^(\s*)[-*+]\s\[x\]/i);
    const indent = checkedMatch[1];
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + checkedMatch[0].length,
        insert: hasListMarker ? indent + '- [ ] ' : indent + '[ ] '
      }
    });
  } else {
    // No checkbox - add unchecked checkbox (without list marker by default)
    const indent = lineText.match(/^(\s*)/)?.[1] || '';
    view.dispatch({
      changes: {
        from: line.from,
        to: line.from + indent.length,
        insert: indent + '[ ] '
      }
    });
  }

  return true;
}

/**
 * TABLE EDITING UTILITIES
 */

interface TableInfo {
  startLine: number;
  endLine: number;
  rows: string[];
  currentRow: number;
  currentCol: number;
  colCount: number;
}

/**
 * Parse table information at cursor position
 */
function getTableInfo(view: EditorView): TableInfo | null {
  const selection = view.state.selection.main;
  const currentLine = view.state.doc.lineAt(selection.from);
  const currentLineNum = currentLine.number;
  const doc = view.state.doc;

  // Check if current line is part of a table
  const isTableLine = (text: string) => {
    return text.trim().startsWith('|') || text.includes('|');
  };

  if (!isTableLine(currentLine.text)) {
    return null;
  }

  // Find table boundaries
  let startLine = currentLineNum;
  let endLine = currentLineNum;

  // Find start of table
  for (let i = currentLineNum - 1; i >= 1; i--) {
    const line = doc.line(i);
    if (isTableLine(line.text)) {
      startLine = i;
    } else {
      break;
    }
  }

  // Find end of table
  for (let i = currentLineNum + 1; i <= doc.lines; i++) {
    const line = doc.line(i);
    if (isTableLine(line.text)) {
      endLine = i;
    } else {
      break;
    }
  }

  // Extract table rows
  const rows: string[] = [];
  for (let i = startLine; i <= endLine; i++) {
    rows.push(doc.line(i).text);
  }

  // Determine current row and column
  const currentRow = currentLineNum - startLine;

  // Calculate current column by counting pipes before cursor
  const lineStart = currentLine.from;
  const posInLine = selection.from - lineStart;
  const textBeforeCursor = currentLine.text.substring(0, posInLine);
  const currentCol = (textBeforeCursor.match(/\|/g) || []).length;

  // Count total columns (from first row)
  const colCount = (rows[0].match(/\|/g) || []).length - 1;

  return {
    startLine,
    endLine,
    rows,
    currentRow,
    currentCol,
    colCount
  };
}

/**
 * Parse a table row into cells
 */
function parseTableRow(row: string): string[] {
  // Remove leading/trailing pipes and split
  const trimmed = row.trim().replace(/^\||\|$/g, '');
  return trimmed.split('|').map(cell => cell.trim());
}

/**
 * Format a table row from cells
 */
function formatTableRow(cells: string[]): string {
  return '| ' + cells.join(' | ') + ' |';
}

/**
 * Create a separator row for markdown table
 */
function createSeparatorRow(colCount: number, alignments?: string[]): string {
  const cells = [];
  for (let i = 0; i < colCount; i++) {
    const align = alignments?.[i] || 'left';
    if (align === 'center') {
      cells.push(':---:');
    } else if (align === 'right') {
      cells.push('---:');
    } else {
      cells.push('---');
    }
  }
  return formatTableRow(cells);
}

/**
 * Insert a new markdown table at cursor
 */
export function insertTable(view: EditorView, rows = 3, cols = 3): boolean {
  const selection = view.state.selection.main;
  const line = view.state.doc.lineAt(selection.from);

  // Create table header
  const headerCells = Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`);
  const header = formatTableRow(headerCells);

  // Create separator
  const separator = createSeparatorRow(cols);

  // Create data rows
  const dataRows = [];
  for (let i = 0; i < rows - 1; i++) {
    const cells = Array(cols).fill('');
    dataRows.push(formatTableRow(cells));
  }

  const table = [header, separator, ...dataRows].join('\n');

  // Insert at beginning of line
  view.dispatch({
    changes: {
      from: line.from,
      to: line.from,
      insert: table + '\n'
    },
    selection: EditorSelection.cursor(line.from + header.length + 3) // Position in first data cell
  });

  return true;
}

/**
 * Navigate to next table cell (Tab key)
 */
export function navigateTableCellNext(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, currentRow, currentCol, colCount, startLine } = tableInfo;
  const doc = view.state.doc;

  let nextRow = currentRow;
  let nextCol = currentCol + 1;

  // Move to next row if at end of current row
  if (nextCol >= colCount + 1) {
    nextCol = 1;
    nextRow = currentRow + 1;

    // If at last row, add a new row
    if (nextRow >= rows.length) {
      const newCells = Array(colCount).fill('');
      const newRow = formatTableRow(newCells);
      const lastLine = doc.line(startLine + rows.length - 1);

      view.dispatch({
        changes: {
          from: lastLine.to,
          to: lastLine.to,
          insert: '\n' + newRow
        }
      });

      nextRow = rows.length;
    }
  }

  // Calculate position in next cell
  const targetLine = doc.line(startLine + nextRow);
  const targetText = targetLine.text;

  // Find the position after the nth pipe
  let pipeCount = 0;
  let pos = 0;
  for (let i = 0; i < targetText.length; i++) {
    if (targetText[i] === '|') {
      pipeCount++;
      if (pipeCount === nextCol) {
        pos = i + 2; // After pipe and space
        break;
      }
    }
  }

  view.dispatch({
    selection: EditorSelection.cursor(targetLine.from + pos)
  });

  return true;
}

/**
 * Navigate to previous table cell (Shift+Tab key)
 */
export function navigateTableCellPrevious(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { currentRow, currentCol, colCount, startLine } = tableInfo;
  const doc = view.state.doc;

  let prevRow = currentRow;
  let prevCol = currentCol - 1;

  // Move to previous row if at beginning of current row
  if (prevCol < 1) {
    prevCol = colCount;
    prevRow = currentRow - 1;

    // Don't go above header
    if (prevRow < 0) {
      return true; // Stay in place
    }
  }

  // Calculate position in previous cell
  const targetLine = doc.line(startLine + prevRow);
  const targetText = targetLine.text;

  // Find the position after the nth pipe
  let pipeCount = 0;
  let pos = 0;
  for (let i = 0; i < targetText.length; i++) {
    if (targetText[i] === '|') {
      pipeCount++;
      if (pipeCount === prevCol) {
        pos = i + 2; // After pipe and space
        break;
      }
    }
  }

  view.dispatch({
    selection: EditorSelection.cursor(targetLine.from + pos)
  });

  return true;
}

/**
 * Insert row above current row
 */
export function insertTableRowAbove(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { currentRow, colCount, startLine } = tableInfo;
  const doc = view.state.doc;

  // Don't insert above separator row
  if (currentRow === 1) {
    return false;
  }

  const newCells = Array(colCount).fill('');
  const newRow = formatTableRow(newCells);

  const insertLine = doc.line(startLine + currentRow);
  view.dispatch({
    changes: {
      from: insertLine.from,
      to: insertLine.from,
      insert: newRow + '\n'
    }
  });

  return true;
}

/**
 * Insert row below current row
 */
export function insertTableRowBelow(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { currentRow, colCount, startLine } = tableInfo;
  const doc = view.state.doc;

  const newCells = Array(colCount).fill('');
  const newRow = formatTableRow(newCells);

  const insertLine = doc.line(startLine + currentRow);
  view.dispatch({
    changes: {
      from: insertLine.to,
      to: insertLine.to,
      insert: '\n' + newRow
    }
  });

  return true;
}

/**
 * Delete current row
 */
export function deleteTableRow(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, currentRow, startLine } = tableInfo;
  const doc = view.state.doc;

  // Don't delete if only header and separator remain
  if (rows.length <= 2) {
    return false;
  }

  // Don't delete header or separator
  if (currentRow === 0 || currentRow === 1) {
    return false;
  }

  const deleteLine = doc.line(startLine + currentRow);
  const deleteFrom = currentRow === rows.length - 1 ? deleteLine.from - 1 : deleteLine.from;
  const deleteTo = currentRow === rows.length - 1 ? deleteLine.to : deleteLine.to + 1;

  view.dispatch({
    changes: {
      from: deleteFrom,
      to: deleteTo,
      insert: ''
    }
  });

  return true;
}

/**
 * Insert column to the left
 */
export function insertTableColumnLeft(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, currentCol, startLine } = tableInfo;
  const doc = view.state.doc;

  for (let i = 0; i < rows.length; i++) {
    const line = doc.line(startLine + i);
    const cells = parseTableRow(line.text);

    // Insert empty cell or separator
    if (i === 1) {
      cells.splice(currentCol, 0, '---');
    } else {
      cells.splice(currentCol, 0, '');
    }

    const newRow = formatTableRow(cells);

    view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: newRow
      }
    });
  }

  return true;
}

/**
 * Insert column to the right
 */
export function insertTableColumnRight(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, currentCol, startLine } = tableInfo;
  const doc = view.state.doc;

  for (let i = 0; i < rows.length; i++) {
    const line = doc.line(startLine + i);
    const cells = parseTableRow(line.text);

    // Insert empty cell or separator
    if (i === 1) {
      cells.splice(currentCol + 1, 0, '---');
    } else {
      cells.splice(currentCol + 1, 0, '');
    }

    const newRow = formatTableRow(cells);

    view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: newRow
      }
    });
  }

  return true;
}

/**
 * Delete current column
 */
export function deleteTableColumn(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, currentCol, colCount, startLine } = tableInfo;
  const doc = view.state.doc;

  // Don't delete if only one column remains
  if (colCount <= 1) {
    return false;
  }

  for (let i = 0; i < rows.length; i++) {
    const line = doc.line(startLine + i);
    const cells = parseTableRow(line.text);

    cells.splice(currentCol, 1);

    const newRow = formatTableRow(cells);

    view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert: newRow
      }
    });
  }

  return true;
}

/**
 * Format table (align all columns)
 */
export function formatTable(view: EditorView): boolean {
  const tableInfo = getTableInfo(view);
  if (!tableInfo) {
    return false;
  }

  const { rows, startLine } = tableInfo;
  const doc = view.state.doc;

  // Parse all rows into cells
  const allCells = rows.map(row => parseTableRow(row));

  // Calculate max width for each column
  const colWidths: number[] = [];
  allCells.forEach(cells => {
    cells.forEach((cell, i) => {
      colWidths[i] = Math.max(colWidths[i] || 0, cell.length);
    });
  });

  // Format each row with padding
  const formattedRows = allCells.map((cells, rowIndex) => {
    const paddedCells = cells.map((cell, colIndex) => {
      // For separator row, adjust separator length
      if (rowIndex === 1 && cell.includes('-')) {
        const isCenter = cell.startsWith(':') && cell.endsWith(':');
        const isRight = !cell.startsWith(':') && cell.endsWith(':');
        const width = colWidths[colIndex];

        if (isCenter) {
          return ':' + '-'.repeat(width - 2) + ':';
        } else if (isRight) {
          return '-'.repeat(width - 1) + ':';
        } else {
          return '-'.repeat(width);
        }
      }
      return cell.padEnd(colWidths[colIndex], ' ');
    });
    return formatTableRow(paddedCells);
  });

  // Replace all table rows
  const firstLine = doc.line(startLine);
  const lastLine = doc.line(startLine + rows.length - 1);

  view.dispatch({
    changes: {
      from: firstLine.from,
      to: lastLine.to,
      insert: formattedRows.join('\n')
    }
  });

  return true;
}
