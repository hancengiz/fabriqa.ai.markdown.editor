import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';

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
  private activeWebviews = new Map<string, { panel: vscode.WebviewPanel; mode: EditorMode }>();

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
      mode: defaultMode
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

    // Update webview when document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        this.updateWebview(webviewPanel.webview, document);
      }
    });

    // Clean up when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      changeThemeSubscription.dispose();
      this.activeWebviews.delete(document.uri.toString());
    });

    // Handle theme changes
    const changeThemeSubscription = vscode.window.onDidChangeActiveColorTheme(() => {
      this.sendThemeUpdate(webviewPanel.webview);
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
   * Send theme update to webview
   */
  private sendThemeUpdate(webview: vscode.Webview): void {
    const theme = vscode.window.activeColorTheme.kind;
    const themeType = theme === vscode.ColorThemeKind.Light ? 'light' : 'dark';

    webview.postMessage({
      type: 'themeChange',
      theme: themeType
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
        await this.applyEdit(document, message.content);
        break;

      case 'ready':
        // Webview is ready, send initial state
        Logger.info('Webview ready');
        break;

      case 'modeChanged':
        // Track mode change from webview
        const webviewData = this.activeWebviews.get(document.uri.toString());
        if (webviewData && message.mode) {
          webviewData.mode = message.mode;
          Logger.info(`Mode changed to ${message.mode} for ${document.uri.fsPath}`);
        }
        break;

      case 'log':
        // Log message from webview
        Logger.info(`[Webview] ${message.message}`);
        break;

      case 'error':
        // Error from webview
        Logger.error(`[Webview] ${message.message}`, message.error);
        vscode.window.showErrorMessage(`Fabriqa Editor Error: ${message.message}`);
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
  }

  /**
   * Get HTML content for webview
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    // Get URIs for scripts and styles
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.file(path.join(this.context.extensionPath, 'dist', 'webview.js'))
    );

    // Get CSP source
    const cspSource = webview.cspSource;

    // Get theme
    const theme = vscode.window.activeColorTheme.kind;
    const themeType = theme === vscode.ColorThemeKind.Light ? 'light' : 'dark';

    // Get configuration
    const config = vscode.workspace.getConfiguration('fabriqa');
    const defaultMode = config.get<EditorMode>('defaultMode', 'livePreview');
    const fontSize = config.get<number>('fontSize', 14);
    const lineHeight = config.get<number>('lineHeight', 1.6);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource};">
  <title>Fabriqa Markdown Editor</title>
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
    }

    #editor {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .cm-editor {
      height: 100%;
    }

    .cm-scroller {
      overflow: auto;
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

    .cm-selectionBackground {
      background-color: var(--vscode-editor-selectionBackground) !important;
    }

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
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('No active editor to switch mode');
      return;
    }

    // Find the webview for this document
    const webviewData = this.activeWebviews.get(activeEditor.document.uri.toString());
    if (!webviewData) {
      vscode.window.showWarningMessage('Active editor is not a Fabriqa markdown editor');
      return;
    }

    // Send mode switch message to webview
    webviewData.panel.webview.postMessage({
      type: 'switchMode',
      mode: mode
    });

    // Update tracked mode
    webviewData.mode = mode;
    Logger.info(`Switched to ${mode} mode for ${activeEditor.document.uri.fsPath}`);
  }

  /**
   * Get the current mode of the active editor
   */
  public getCurrentMode(): EditorMode | null {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return null;
    }

    const webviewData = this.activeWebviews.get(activeEditor.document.uri.toString());
    return webviewData?.mode || null;
  }
}
