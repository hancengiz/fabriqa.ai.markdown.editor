import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { keymap, highlightSpecialChars, drawSelection, highlightActiveLine, dropCursor, rectangularSelection, crosshairCursor, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { autocompletion, completionKeymap, closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { foldGutter, indentOnInput, syntaxHighlighting as syntaxHighlightingFacet, bracketMatching } from '@codemirror/language';
import { lintKeymap } from '@codemirror/lint';
import { livePreviewPlugin } from './editors/livePreviewMode';
import { readingModePlugin } from './editors/readingMode';
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
  toggleBlockquote
} from './editors/markdownCommands';

// Basic setup extensions (equivalent to basicSetup)
const basicExtensions = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter(),
  drawSelection(),
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
  keymap.of([
    // Markdown formatting shortcuts (Obsidian-style)
    { key: 'Mod-b', run: toggleBold },
    { key: 'Mod-i', run: toggleItalic },
    { key: 'Mod-e', run: toggleInlineCode },
    { key: 'Mod-k', run: insertLink },
    { key: 'Mod-Shift-e', run: insertCodeBlock },
    { key: 'Mod-Shift-x', run: toggleStrikethrough },
    { key: 'Mod-Shift-h', run: toggleHeading },
    { key: 'Mod-Shift-8', run: toggleBulletList },
    { key: 'Mod-Shift-7', run: toggleNumberedList },
    { key: 'Mod-Shift-.', run: toggleBlockquote },
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
const themeCompartment = new Compartment();

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
  const initialTheme = bodyElement.dataset.theme || 'light'; // Default to light, not dark!

  console.log('[Webview] [THEME] Body data-theme attribute:', bodyElement.dataset.theme);
  console.log('[Webview] [THEME] Resolved initial theme:', initialTheme);
  console.log('[Webview] Initial mode:', initialMode, 'theme:', initialTheme);
  currentMode = initialMode;

  try {
    console.log('[Webview] Creating EditorState...');
    // Create editor state
    const startState = EditorState.create({
      doc: '',
      extensions: [
        ...basicExtensions,
        markdown(),
        modeCompartment.of(getModeExtensions(initialMode)),
        themeCompartment.of(getThemeExtensions(initialTheme)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged && !isUpdatingFromVSCode) {
            // Send edit message to mark document as dirty
            const content = update.state.doc.toString();
            sendMessage({
              type: 'edit',
              content
            });
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
 * Get theme extensions
 */
function getThemeExtensions(theme: string): any[] {
  // Use VS Code's CSS variables for theming
  return [
    syntaxHighlighting(defaultHighlightStyle),
    EditorView.theme({
      '&': {
        color: 'var(--vscode-editor-foreground)',
        backgroundColor: 'var(--vscode-editor-background)'
      },
      '.cm-content': {
        caretColor: 'var(--vscode-editorCursor-foreground)'
      },
      '.cm-cursor, .cm-dropCursor': {
        borderLeftColor: 'var(--vscode-editorCursor-foreground)'
      },
      '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: 'var(--vscode-editor-selectionBackground)'
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
 * Update theme
 */
function updateTheme(theme: string): void {
  console.log('[Webview] [THEME] updateTheme called with theme:', theme);

  if (!editorView) {
    console.warn('[Webview] [THEME] Cannot update theme: editor not initialized');
    return;
  }

  try {
    console.log('[Webview] [THEME] Setting body data-theme attribute to:', theme);
    document.body.dataset.theme = theme;

    console.log('[Webview] [THEME] Reconfiguring editor theme extensions');
    editorView.dispatch({
      effects: themeCompartment.reconfigure(getThemeExtensions(theme))
    });

    console.log('[Webview] [THEME] Theme successfully updated to:', theme);
    log(`Theme updated to ${theme}`);
  } catch (error) {
    console.error('[Webview] [THEME] Failed to update theme:', error);
    logError('Failed to update theme', error);
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

    case 'themeChange':
      console.log('[Webview] [THEME] Received themeChange message with theme:', message.theme);
      updateTheme(message.theme);
      break;

    case 'fileInfo':
      updateFileInfo(message.fileName, message.relativePath);
      break;

    default:
      log(`Unknown message type: ${message.type}`);
  }
}

/**
 * Update file info header
 */
function updateFileInfo(fileName: string, relativePath: string): void {
  const titleEl = document.getElementById('filename-title');
  const pathEl = document.getElementById('filename-path');

  if (titleEl && pathEl) {
    titleEl.textContent = fileName;
    titleEl.title = relativePath; // Tooltip
    pathEl.textContent = relativePath;
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
