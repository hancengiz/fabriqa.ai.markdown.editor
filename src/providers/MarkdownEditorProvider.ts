import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';
import { WebviewLogger } from '../utils/WebviewLogger';

/**
 * Editor mode types
 */
export type EditorMode = 'livePreview' | 'source' | 'reading';

/**
 * Message types for webview communication
 */
export interface WebviewMessage {
  type: string;
  [key: string]: any;
}

/**
 * Custom editor provider for markdown files
 */
export class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  private static readonly viewType = 'fabriqa.markdownEditor';
  private activeWebviews = new Map<string, { panel: vscode.WebviewPanel; mode: EditorMode; isUpdatingFromWebview: boolean }>();
  private currentActivePanel: vscode.WebviewPanel | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configManager: ConfigManager
  ) {}

  /**
   * Resolve a custom editor for a given document
   */
  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    Logger.info(`Opening custom editor for ${document.uri.fsPath}`);

    // Configure webview
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'dist')),
        vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))
      ]
    };

    // Get default mode from settings
    const config = vscode.workspace.getConfiguration('fabriqa');
    const defaultMode = config.get<EditorMode>('defaultMode', 'livePreview');

    // Track this webview
    this.activeWebviews.set(document.uri.toString(), {
      panel: webviewPanel,
      mode: defaultMode,
      isUpdatingFromWebview: false
    });

    // Set this panel as currently active
    this.currentActivePanel = webviewPanel;

    // Track when this panel becomes active/inactive
    webviewPanel.onDidChangeViewState(e => {
      if (e.webviewPanel.active) {
        this.currentActivePanel = e.webviewPanel;
        Logger.info(`Webview panel became active for ${document.uri.fsPath}`);
      }
    });

    // Set initial HTML content
    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Send initial document content to webview
    this.updateWebview(webviewPanel.webview, document);

    // Handle messages from webview
    webviewPanel.webview.onDidReceiveMessage(
      message => this.handleWebviewMessage(message, document, webviewPanel.webview),
      undefined,
      this.context.subscriptions
    );

    // Update webview when document changes (but not when the change came from the webview)
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        const webviewData = this.activeWebviews.get(document.uri.toString());
        // Only update webview if the change didn't come from the webview itself
        if (webviewData && !webviewData.isUpdatingFromWebview) {
          this.updateWebview(webviewPanel.webview, document);
        }
      }
    });

    // Clean up when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      this.activeWebviews.delete(document.uri.toString());

      // Clear current active panel if this was it
      if (this.currentActivePanel === webviewPanel) {
        this.currentActivePanel = null;
      }
    });
  }

  /**
   * Send document content to webview
   */
  private updateWebview(webview: vscode.Webview, document: vscode.TextDocument): void {
    webview.postMessage({
      type: 'update',
      content: document.getText(),
      uri: document.uri.toString()
    });
  }

  /**
   * Handle messages from webview
   */
  private async handleWebviewMessage(
    message: WebviewMessage,
    document: vscode.TextDocument,
    webview: vscode.Webview
  ): Promise<void> {
    switch (message.type) {
      case 'edit':
        // Apply edit from webview to document
        const webviewData = this.activeWebviews.get(document.uri.toString());
        if (webviewData) {
          webviewData.isUpdatingFromWebview = true;
          await this.applyEdit(document, message.content);
          // Reset flag after a short delay to allow the edit to complete
          setTimeout(() => {
            webviewData.isUpdatingFromWebview = false;
          }, 100);
        }
        break;

      case 'ready':
        // Webview is ready, send initial state
        Logger.info('Webview ready');
        break;

      case 'modeChanged':
        // Track mode change from webview
        const modeWebviewData = this.activeWebviews.get(document.uri.toString());
        if (modeWebviewData && message.mode) {
          modeWebviewData.mode = message.mode;
          Logger.info(`Mode changed to ${message.mode} for ${document.uri.fsPath}`);
        }
        break;

      case 'log':
        // Log message from webview
        Logger.info(`[Webview] ${message.message}`);
        WebviewLogger.log('log', message.message, message.data);
        break;

      case 'error':
        // Error from webview
        Logger.error(`[Webview] ${message.message}`, message.error);
        WebviewLogger.log('error', message.message, message.error);
        vscode.window.showErrorMessage(`Fabriqa Editor Error: ${message.message}`);
        break;

      case 'console':
        // Console message from webview (for debug logging)
        WebviewLogger.log(message.level || 'log', message.message, message.data);
        break;

      default:
        Logger.warn(`Unknown message type from webview: ${message.type}`);
    }
  }

  /**
   * Apply edit to document
   */
  private async applyEdit(document: vscode.TextDocument, content: string): Promise<void> {
    const edit = new vscode.WorkspaceEdit();

    // Replace entire document content
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content
    );

    await vscode.workspace.applyEdit(edit);
    // Document is now dirty - user can save with Cmd+S like normal VS Code editors
  }

  /**
   * Get HTML content for webview
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Get URIs for scripts and styles
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview.js'))
    );

    // Get CSS file URI
    const cssUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'webview', 'styles', 'editor.css'))
    );

    // Get CSP source
    const cspSource = webview.cspSource;

    // Get configuration
    const config = vscode.workspace.getConfiguration('fabriqa');
    const defaultMode = config.get<EditorMode>('defaultMode', 'livePreview');
    const fontSize = config.get<number>('fontSize', 14);
    const lineHeight = config.get<number>('lineHeight', 1.6);

    // Always use light theme
    const themeType = 'light';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource};">
  <title>fabriqa Markdown Editor</title>
  <link rel="stylesheet" href="${cssUri}">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      height: 100%;
      overflow: hidden;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-size: ${fontSize}px;
      line-height: ${lineHeight};
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
    }

    #editor {
      flex: 1;
      overflow: auto;
      height: 100%;
    }

    .cm-editor {
      height: 100%;
    }

    .cm-scroller {
      overflow: auto;
    }

    /* Light theme CSS variables */
    body {
      --vscode-editor-foreground: #000000 !important;
      --vscode-editor-background: #ffffff !important;
      --vscode-editorCursor-foreground: #000000 !important;
      --vscode-editor-selectionBackground: #add6ff !important;
      --vscode-textLink-foreground: #006ab1 !important;
      --vscode-symbolIcon-classForeground: #267f99 !important;
      --vscode-textCodeBlock-background: #f5f5f5 !important;
      --vscode-foreground: #3b3b3b !important;
    }

    /* CodeMirror theme integration */
    .cm-content {
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      caret-color: var(--vscode-editorCursor-foreground);
    }

    .cm-line {
      padding: 0 4px;
    }

    /* Selection is handled by EditorView.theme in webview/main.ts - do not override here */

    .cm-cursor {
      border-left-color: var(--vscode-editorCursor-foreground);
    }

    /* Markdown styling */
    .cm-header {
      font-weight: bold;
      color: var(--vscode-symbolIcon-classForeground);
    }

    .cm-strong {
      font-weight: bold;
    }

    .cm-em {
      font-style: italic;
    }

    .cm-link {
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }

    .cm-link:hover {
      text-decoration: underline;
    }

    .cm-code {
      font-family: var(--vscode-editor-font-family);
      background-color: var(--vscode-textCodeBlock-background);
      padding: 2px 4px;
      border-radius: 3px;
    }

    /* Loading state */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--vscode-foreground);
    }

    /* Error state */
    .error {
      padding: 20px;
      color: var(--vscode-errorForeground);
      background-color: var(--vscode-inputValidation-errorBackground);
      border: 1px solid var(--vscode-inputValidation-errorBorder);
      border-radius: 4px;
      margin: 20px;
    }
  </style>
</head>
<body data-theme="${themeType}" data-mode="${defaultMode}">
  <div id="editor">
    <div class="loading">Loading editor...</div>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Switch editor mode for the active editor
   */
  public async switchMode(mode: EditorMode): Promise<void> {
    // Use the currently active webview panel instead of activeTextEditor
    if (!this.currentActivePanel) {
      vscode.window.showWarningMessage('No active Fabriqa markdown editor to switch mode');
      return;
    }

    // Find the webview data for this panel
    let foundUri: string | null = null;
    for (const [uri, data] of this.activeWebviews.entries()) {
      if (data.panel === this.currentActivePanel) {
        foundUri = uri;
        break;
      }
    }

    if (!foundUri) {
      vscode.window.showWarningMessage('Could not find webview data for active editor');
      return;
    }

    const webviewData = this.activeWebviews.get(foundUri);
    if (!webviewData) {
      return;
    }

    // Send mode switch message to webview
    webviewData.panel.webview.postMessage({
      type: 'switchMode',
      mode: mode
    });

    // Update tracked mode
    webviewData.mode = mode;
    Logger.info(`Switched to ${mode} mode`);
  }

  /**
   * Get the current mode of the active editor
   */
  public getCurrentMode(): EditorMode | null {
    if (!this.currentActivePanel) {
      return null;
    }

    // Find the webview data for the current active panel
    for (const [_, data] of this.activeWebviews.entries()) {
      if (data.panel === this.currentActivePanel) {
        return data.mode;
      }
    }

    return null;
  }
}
