import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { StyleModule } from 'style-mod';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { search, searchKeymap, highlightSelectionMatches } from '@codemirror/search';
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
  search({
    top: true,  // Place search panel at the top
  }),
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
    ...searchKeymap,
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
      // Search panel styling (VS Code-like)
      '.cm-panel.cm-search': {
        backgroundColor: 'var(--vscode-editorWidget-background)',
        border: '1px solid var(--vscode-editorWidget-border)',
        padding: '8px',
        borderRadius: '3px',
        boxShadow: '0 2px 8px var(--vscode-widget-shadow)'
      },
      '.cm-searchMatch': {
        backgroundColor: 'var(--vscode-editor-findMatchBackground)',
        border: '1px solid var(--vscode-editor-findMatchBorder)',
        borderRadius: '2px'
      },
      '.cm-searchMatch-selected': {
        backgroundColor: 'var(--vscode-editor-findMatchHighlightBackground)',
        border: '1px solid var(--vscode-editor-findMatchHighlightBorder)'
      },
      '.cm-panel input[type=text]': {
        backgroundColor: 'var(--vscode-input-background)',
        color: 'var(--vscode-input-foreground)',
        border: '1px solid var(--vscode-input-border)',
        padding: '4px 8px',
        borderRadius: '2px',
        outline: 'none'
      },
      '.cm-panel input[type=text]:focus': {
        border: '1px solid var(--vscode-focusBorder)',
        outline: '1px solid var(--vscode-focusBorder)',
        outlineOffset: '-1px'
      },
      '.cm-panel button': {
        backgroundColor: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
        border: 'none',
        padding: '4px 12px',
        borderRadius: '2px',
        cursor: 'pointer',
        fontSize: '12px',
        fontFamily: 'var(--vscode-font-family)'
      },
      '.cm-panel button:hover': {
        backgroundColor: 'var(--vscode-button-hoverBackground)'
      },
      '.cm-panel label': {
        color: 'var(--vscode-foreground)',
        fontSize: '12px',
        fontFamily: 'var(--vscode-font-family)',
        marginRight: '8px'
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
 * Listen for messages from VS Code
 */
console.log('[Webview] Adding message listener');
window.addEventListener('message', handleMessage);
