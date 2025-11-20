import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { StyleModule } from 'style-mod';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { SearchQuery, setSearchQuery, highlightSelectionMatches, search, getSearchQuery } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { foldGutter, indentOnInput, syntaxHighlighting as syntaxHighlightingFacet, bracketMatching } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { livePreviewPlugin } from './editors/livePreviewMode';
import { readingModePlugin } from './editors/readingMode';
import { markdownHidingStyles } from './lib/markdown-live-preview';
import {
  toggleBold,
  toggleItalic,
  toggleInlineCode,
  toggleStrikethrough,
  insertLink,
  insertCodeBlock,
  toggleHeading,
  toggleBulletList,
  toggleNumberedList,
  toggleBlockquote,
  toggleCheckbox
} from './editors/markdownCommands';

// Basic setup extensions (equivalent to basicSetup)
const basicExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  // drawSelection(), // REMOVED - trying native selection only
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  search({ top: false }), // Add search support without panel UI
  keymap.of([
    // Mode switching shortcuts (editor rendering modes)
    {
      key: 'Mod-Shift-p',
      run: () => {
        switchMode('livePreview');
        return true;
      }
    },
    {
      key: 'Mod-Shift-s',
      run: () => {
        switchMode('source');
        return true;
      }
    },
    {
      key: 'Mod-Shift-r',
      run: () => {
        switchMode('reading');
        return true;
      }
    },
    // Markdown formatting shortcuts (using Cmd+Alt to match Obsidian-style while avoiding VS Code conflicts)
    // Cmd+B conflicts with VS Code sidebar, Cmd+Shift+B conflicts with Build Task
    // So we use Cmd+Alt (Cmd+Option on Mac) which is standard for secondary shortcuts
    { key: 'Mod-Alt-b', run: toggleBold },
    { key: 'Mod-Alt-i', run: toggleItalic },
    { key: 'Mod-Alt-c', run: toggleInlineCode },
    { key: 'Mod-Alt-k', run: insertLink },
    { key: 'Mod-Alt-e', run: insertCodeBlock },
    { key: 'Mod-Alt-x', run: toggleStrikethrough },
    { key: 'Mod-Alt-h', run: toggleHeading },
    { key: 'Mod-Alt-8', run: toggleBulletList },
    { key: 'Mod-Alt-7', run: toggleNumberedList },
    { key: 'Mod-Alt-q', run: toggleBlockquote },
    { key: 'Mod-Alt-t', run: toggleCheckbox },
    // Default keymaps
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...historyKeymap,
    ...completionKeymap,
    ...lintKeymap
  ])
];

// Type definitions for VS Code API
declare const acquireVsCodeApi: any;

// Immediate debug log
console.log('[Webview] Script loaded at', new Date().toISOString());

/**
 * Editor modes
 */
type EditorMode = 'livePreview' | 'source' | 'reading';

/**
 * VS Code webview API
 */
let vscode: any;
try {
  vscode = acquireVsCodeApi();
  console.log('[Webview] VS Code API acquired');
} catch (error) {
  console.error('[Webview] Failed to acquire VS Code API', error);
  vscode = {
    postMessage: (msg: any) => console.log('[Mock] Would send message:', msg)
  };
}

/**
 * Intercept console methods to send to extension logger
 */
function setupConsoleLogging() {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error
  };

  console.log = (...args: any[]) => {
    originalConsole.log(...args);
    vscode.postMessage({
      type: 'console',
      level: 'log',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    });
  };

  console.info = (...args: any[]) => {
    originalConsole.info(...args);
    vscode.postMessage({
      type: 'console',
      level: 'info',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    });
  };

  console.warn = (...args: any[]) => {
    originalConsole.warn(...args);
    vscode.postMessage({
      type: 'console',
      level: 'warn',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    });
  };

  console.error = (...args: any[]) => {
    originalConsole.error(...args);
    vscode.postMessage({
      type: 'console',
      level: 'error',
      message: args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
    });
  };
}

// Setup console logging
setupConsoleLogging();

/**
 * Compartments for dynamic reconfiguration
 */
const modeCompartment = new Compartment();

/**
 * Editor instance
 */
let editorView: EditorView | null = null;
let currentMode: EditorMode = 'livePreview';
let currentContent: string = '';
let isUpdatingFromVSCode = false;

/**
 * Initialize the editor
 */
function initializeEditor(): void {
  console.log('[Webview] initializeEditor called');
  const container = document.getElementById('editor');
  if (!container) {
    console.error('[Webview] Editor container not found!');
    logError('Editor container not found');
    return;
  }

  console.log('[Webview] Editor container found');

  // Get initial mode from body data attribute
  const bodyElement = document.body;
  const initialMode = (bodyElement.dataset.mode as EditorMode) || 'livePreview';

  console.log('[Webview] Initial mode:', initialMode);
  currentMode = initialMode;

  try {
    console.log('[Webview] Creating EditorState...');
    // Create editor state
    const startState = EditorState.create({
      doc: '',
      extensions: [
        ...basicExtensions,
        markdown(),
        markdownHidingStyles, // CSS for hiding markdown syntax
        modeCompartment.of(getModeExtensions(initialMode)),
        getThemeExtensions(),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromVSCode) {
            // Send edit message to mark document as dirty
            const content = update.state.doc.toString();
            sendMessage({
              type: 'edit',
              content
            });
          }
          // Debug: Log selection changes
          if (update.selectionSet) {
            const sel = update.state.selection.main;
            console.log('[Webview] Selection changed:', { from: sel.from, to: sel.to, empty: sel.empty });
          }
        }),
        EditorView.lineWrapping,
      ]
    });

    console.log('[Webview] EditorState created, creating EditorView...');

    // Clear loading message before creating editor
    console.log('[Webview] Clearing loading message...');
    container.innerHTML = '';

    // Create editor view
    editorView = new EditorView({
      state: startState,
      parent: container
    });

    console.log('[Webview] EditorView created successfully!');
    log(`Editor initialized in ${initialMode} mode`);

    // Notify VS Code that webview is ready
    sendMessage({ type: 'ready' });
    console.log('[Webview] Ready message sent');
  } catch (error) {
    console.error('[Webview] Initialization error:', error);
    logError('Failed to initialize editor', error);
    showError('Failed to initialize editor. Check console for details.');
  }
}

/**
 * Get extensions for a specific mode
 */
function getModeExtensions(mode: EditorMode): any[] {
  switch (mode) {
    case 'livePreview':
      return [livePreviewPlugin];
    case 'source':
      return []; // No special extensions for source mode
    case 'reading':
      return [readingModePlugin, EditorView.editable.of(false)];
    default:
      return [];
  }
}

/**
 * Get theme extensions (always light theme)
 */
function getThemeExtensions(): any[] {
  return [
    syntaxHighlighting(defaultHighlightStyle),
    // Use baseTheme for native browser selection only
    EditorView.baseTheme({
      '.cm-content ::selection': {
        backgroundColor: '#add6ff !important'
      },
      '.cm-content::selection': {
        backgroundColor: '#add6ff !important'
      },
      '.cm-line ::selection': {
        backgroundColor: '#add6ff !important'
      }
    }),
    EditorView.theme({
      '&': {
        color: '#000000',
        backgroundColor: '#ffffff'
      },
      '.cm-content': {
        caretColor: '#000000'
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: '#000000',
        borderLeftWidth: '2px'
      },
      // Active line
      '.cm-activeLine': {
        backgroundColor: '#f5f5f5'
      },
      // Line numbers
      '.cm-gutters': {
        backgroundColor: '#ffffff',
        color: '#999999',
        border: 'none'
      },
      '.cm-activeLineGutter': {
        backgroundColor: '#f5f5f5'
      },
      // Line wrapping
      '.cm-line': {
        padding: '0 4px'
      },
      // Search match highlighting (for VS Code native find)
      '.cm-searchMatch': {
        backgroundColor: 'var(--vscode-editor-findMatchBackground)',
        outline: '1px solid var(--vscode-editor-findMatchBorder)',
        borderRadius: '1px'
      },
      '.cm-searchMatch-selected': {
        backgroundColor: 'var(--vscode-editor-findMatchHighlightBackground)',
        outline: '1px solid var(--vscode-editor-findMatchHighlightBorder)'
      }
    })
  ];
}

/**
 * Switch editor mode
 */
function switchMode(newMode: EditorMode): void {
  if (!editorView) {
    logError('Cannot switch mode: editor not initialized');
    return;
  }

  if (currentMode === newMode) {
    return;
  }

  try {
    log(`Switching from ${currentMode} to ${newMode} mode`);

    // Update mode compartment
    editorView.dispatch({
      effects: modeCompartment.reconfigure(getModeExtensions(newMode))
    });

    currentMode = newMode;

    // Update body attribute for CSS
    document.body.dataset.mode = newMode;

    // Notify extension of mode change
    sendMessage({
      type: 'modeChanged',
      mode: newMode
    });

    log(`Switched to ${newMode} mode`);
  } catch (error) {
    logError('Failed to switch mode', error);
    sendMessage({
      type: 'error',
      message: `Failed to switch to ${newMode} mode`,
      error
    });
  }
}

/**
 * Update editor content
 */
function updateContent(content: string): void {
  if (!editorView) {
    logError('Cannot update content: editor not initialized');
    return;
  }

  if (currentContent === content) {
    return;
  }

  try {
    isUpdatingFromVSCode = true;
    currentContent = content;

    // Replace entire document
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: content
      }
    });

    isUpdatingFromVSCode = false;
  } catch (error) {
    isUpdatingFromVSCode = false;
    logError('Failed to update content', error);
  }
}

/**
 * Handle messages from VS Code
 */
function handleMessage(event: MessageEvent): void {
  const message = event.data;
  console.log('[Webview] Received message:', message.type, message);

  switch (message.type) {
    case 'update':
      updateContent(message.content);
      break;

    case 'switchMode':
      console.log('[Webview] Switching to mode:', message.mode);
      switchMode(message.mode);
      break;

    case 'find':
      handleFind(message.query, message.options);
      break;

    case 'findNext':
      handleFindNext();
      break;

    case 'findPrevious':
      handleFindPrevious();
      break;

    case 'replace':
      handleReplace(message.replacement);
      break;

    case 'replaceAll':
      handleReplaceAll(message.replacement);
      break;

    case 'clearFind':
      handleClearFind();
      break;

    case 'revealPosition':
      handleRevealPosition(message.line, message.character);
      break;

    default:
      log(`Unknown message type: ${message.type}`);
  }
}

/**
 * Send message to VS Code
 */
function sendMessage(message: any): void {
  vscode.postMessage(message);
}

/**
 * Log message to VS Code output
 */
function log(message: string): void {
  console.log(`[Webview] ${message}`);
  sendMessage({
    type: 'log',
    message
  });
}

/**
 * Log error to VS Code output
 */
function logError(message: string, error?: any): void {
  console.error(`[Webview] ${message}`, error);
  sendMessage({
    type: 'error',
    message,
    error: error ? error.toString() : undefined
  });
}

/**
 * Show error message in editor
 */
function showError(message: string): void {
  const container = document.getElementById('editor');
  if (container) {
    container.innerHTML = `
      <div class="error">
        <strong>Error:</strong> ${message}
      </div>
    `;
  }
}

/**
 * Initialize when DOM is ready
 */
console.log('[Webview] Document readyState:', document.readyState);
if (document.readyState === 'loading') {
  console.log('[Webview] Waiting for DOMContentLoaded...');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[Webview] DOMContentLoaded fired');
    initializeEditor();
  });
} else {
  console.log('[Webview] DOM already loaded, initializing immediately');
  initializeEditor();
}

/**
 * Find handlers for VS Code native find integration
 * Implements search without opening CodeMirror's search panel
 *
 * SEARCH BEHAVIOR:
 * - All search functions (handleFind, handleFindNext, handleFindPrevious) start from the current cursor position
 * - This creates an intuitive workflow where Cmd+F with pre-filled text acts like "find next"
 *
 * WORKFLOW EXAMPLE:
 * 1. Press Cmd+F, type "data", press Enter → finds first "data" after cursor
 * 2. Press Cmd+F again → search text is pre-filled with "data"
 * 3. Press Enter → finds next "data" after current position (acts like F3)
 * 4. Alternatively, press F3 directly → same behavior
 *
 * This unified "search from cursor" approach makes both Cmd+F+Enter and F3
 * behave identically, providing a seamless search experience.
 */
function handleFind(query: string, options?: { caseSensitive?: boolean; wholeWord?: boolean; regexp?: boolean }): void {
  if (!editorView) return;

  try {
    const searchQuery = new SearchQuery({
      search: query,
      caseSensitive: options?.caseSensitive,
      wholeWord: options?.wholeWord,
      regexp: options?.regexp
    });

    // Set the search query (this enables highlighting)
    editorView.dispatch({
      effects: setSearchQuery.of(searchQuery)
    });

    // Start searching from current cursor position
    const state = editorView.state;
    const currentPos = state.selection.main.head;

    // Find first match after current position
    let cursor = searchQuery.getCursor(state.doc, currentPos);
    let firstMatch = cursor.next();

    // If no match after cursor, wrap around to beginning
    if (firstMatch.done) {
      cursor = searchQuery.getCursor(state.doc, 0);
      firstMatch = cursor.next();
    }

    if (firstMatch.done === false) {
      // Jump to first match and select it
      editorView.dispatch({
        selection: { anchor: firstMatch.value.from, head: firstMatch.value.to },
        scrollIntoView: true
      });
      editorView.focus();
      log(`Find: "${query}" - found at position ${firstMatch.value.from}`);
    } else {
      log(`Find: "${query}" - no matches found`);
    }
  } catch (error) {
    logError('Find failed', error);
  }
}

function handleFindNext(): void {
  if (!editorView) return;

  try {
    // Get current search query from editor state
    const querySpec = getSearchQuery(editorView.state);

    if (!querySpec || !querySpec.search) {
      log('Find next: no active search');
      return;
    }

    // Create a new SearchQuery instance from the spec
    const query = new SearchQuery(querySpec);

    const state = editorView.state;
    const currentPos = state.selection.main.head;

    // Find next match after current position
    const cursor = query.getCursor(state.doc, currentPos);
    let nextMatch = cursor.next();

    // If no match after cursor, wrap around to beginning
    if (nextMatch.done) {
      const wrappedCursor = query.getCursor(state.doc, 0);
      nextMatch = wrappedCursor.next();
    }

    if (nextMatch.done === false) {
      editorView.dispatch({
        selection: { anchor: nextMatch.value.from, head: nextMatch.value.to },
        scrollIntoView: true
      });
      editorView.focus();
      log(`Find next: found at position ${nextMatch.value.from}`);
    } else {
      log('Find next: no more matches');
    }
  } catch (error) {
    logError('Find next failed', error);
  }
}

function handleFindPrevious(): void {
  if (!editorView) return;

  try {
    // Get current search query from editor state
    const querySpec = getSearchQuery(editorView.state);

    if (!querySpec || !querySpec.search) {
      log('Find previous: no active search');
      return;
    }

    // Create a new SearchQuery instance from the spec
    const query = new SearchQuery(querySpec);

    const state = editorView.state;
    const currentPos = state.selection.main.from;

    // Find all matches before current position
    const cursor = query.getCursor(state.doc, 0);
    let lastMatch = null;
    let match = cursor.next();

    while (!match.done && match.value.from < currentPos) {
      lastMatch = match.value;
      match = cursor.next();
    }

    // If no match before cursor, wrap around to end
    if (!lastMatch) {
      while (!match.done) {
        lastMatch = match.value;
        match = cursor.next();
      }
    }

    if (lastMatch) {
      editorView.dispatch({
        selection: { anchor: lastMatch.from, head: lastMatch.to },
        scrollIntoView: true
      });
      editorView.focus();
      log(`Find previous: found at position ${lastMatch.from}`);
    } else {
      log('Find previous: no matches');
    }
  } catch (error) {
    logError('Find previous failed', error);
  }
}

function handleReplace(replacement: string): void {
  if (!editorView || currentMode === 'reading') {
    log('Replace not available in reading mode');
    return;
  }

  try {
    // Replace current selection and move to next match
    const state = editorView.state;
    const selection = state.selection.main;

    if (!selection.empty) {
      editorView.dispatch({
        changes: { from: selection.from, to: selection.to, insert: replacement },
        selection: { anchor: selection.from + replacement.length }
      });

      // Move to next match using our custom function
      handleFindNext();
      log(`Replaced with: "${replacement}"`);
    }
  } catch (error) {
    logError('Replace failed', error);
  }
}

function handleReplaceAll(replacement: string): void {
  if (!editorView || currentMode === 'reading') {
    log('Replace all not available in reading mode');
    return;
  }

  try {
    // Get current search query from state
    const state = editorView.state;
    // This is a simplified version - a full implementation would need to
    // iterate through all matches and replace them
    log(`Replace all with: "${replacement}" - Not fully implemented yet`);
  } catch (error) {
    logError('Replace all failed', error);
  }
}

function handleClearFind(): void {
  if (!editorView) return;

  try {
    editorView.dispatch({
      effects: setSearchQuery.of(new SearchQuery({ search: '' }))
    });
    log('Cleared find');
  } catch (error) {
    logError('Clear find failed', error);
  }
}

function handleRevealPosition(line: number, character: number): void {
  if (!editorView) return;

  try {
    // Convert line/character (1-indexed) to document position (0-indexed)
    const doc = editorView.state.doc;
    const lineNum = Math.max(1, Math.min(line, doc.lines)); // Clamp to valid range
    const lineObj = doc.line(lineNum);
    const charPos = Math.max(0, Math.min(character, lineObj.length)); // Clamp to line length
    const pos = lineObj.from + charPos;

    // Set selection and scroll into view
    editorView.dispatch({
      selection: { anchor: pos },
      scrollIntoView: true
    });

    // Focus the editor
    editorView.focus();

    log(`Revealed position: line ${line}, character ${character} (doc pos ${pos})`);
  } catch (error) {
    logError('Reveal position failed', error);
  }
}

/**
 * Listen for messages from VS Code
 */
console.log('[Webview] Adding message listener');
window.addEventListener('message', handleMessage);
