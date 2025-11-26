import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { marked } from 'marked';
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
  private pendingReveal: { uri: string; line: number; character: number } | null = null;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly configManager: ConfigManager
  ) {
    // Note: VS Code's Custom Editor API does not provide a way to receive selection/position
    // information when opening files from search results. This is a known limitation.
    // Users can use Cmd+F within the editor for search functionality.

    // Listen for theme changes to update webviews in auto mode
    vscode.window.onDidChangeActiveColorTheme(() => {
      this.handleThemeChange();
    });
  }

  /**
   * Handle VS Code theme change
   * Updates all active webviews if theme is set to 'auto'
   */
  private handleThemeChange(): void {
    const config = vscode.workspace.getConfiguration('fabriqa');
    const themeSetting = config.get<string>('theme', 'light');

    // Only update if in auto mode - tell webviews to refresh their theme
    if (themeSetting === 'auto') {
      Logger.info(`VSCode theme changed, notifying webviews to refresh auto theme`);

      // Update all active webviews to refresh their theme
      for (const [uri, webviewData] of this.activeWebviews.entries()) {
        webviewData.panel.webview.postMessage({
          type: 'themeChanged',
          theme: 'auto'
        });
      }
    }
  }

  /**
   * Resolve theme based on user setting and VS Code's current theme
   * Returns 'light', 'dark', or 'auto'
   */
  private resolveTheme(): 'light' | 'dark' | 'auto' {
    const config = vscode.workspace.getConfiguration('fabriqa');
    const themeSetting = config.get<string>('theme', 'light');

    if (themeSetting === 'light' || themeSetting === 'dark' || themeSetting === 'auto') {
      return themeSetting as 'light' | 'dark' | 'auto';
    }

    // Default to light
    return 'light';
  }

  /**
   * Check if a color is dark by calculating its perceived brightness
   */
  private isColorDark(color: string): boolean {
    // Handle RGB/RGBA colors
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      // Calculate perceived brightness using the formula
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }

    // Handle hex colors
    const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (hexMatch) {
      const r = parseInt(hexMatch[1], 16);
      const g = parseInt(hexMatch[2], 16);
      const b = parseInt(hexMatch[3], 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness < 128;
    }

    // Default to dark for unknown formats
    return true;
  }

  /**
   * Resolve auto theme to actual light or dark based on VS Code's current theme
   * Detects dark themes by checking the actual background color brightness
   */
  private resolveAutoTheme(): 'light' | 'dark' {
    const themeKind = vscode.window.activeColorTheme.kind;

    // First try the theme kind
    if (themeKind === vscode.ColorThemeKind.Dark || themeKind === vscode.ColorThemeKind.HighContrast) {
      Logger.info(`Theme kind ${themeKind} detected as dark`);
      return 'dark';
    }

    if (themeKind === vscode.ColorThemeKind.Light || themeKind === vscode.ColorThemeKind.HighContrastLight) {
      Logger.info(`Theme kind ${themeKind} detected as light`);
      return 'light';
    }

    // For custom themes that don't report their kind correctly,
    // check the background color brightness
    try {
      const editorBg = new vscode.ThemeColor('editor.background');
      // Unfortunately, we can't get the actual color value from ThemeColor in extensions
      // So we'll default based on common theme patterns
      Logger.info(`Unknown theme kind ${themeKind}, defaulting to dark for custom themes`);
      return 'dark'; // Most custom themes are dark
    } catch (error) {
      Logger.warn('Failed to detect theme, defaulting to light');
      return 'light';
    }
  }

  /**
   * Resolve a custom editor for a given document
   */

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    console.log(`[fabriqa resolveCustomTextEditor] Opening ${document.uri.fsPath.split('/').pop()}`);
    Logger.info(`[resolveCustomTextEditor] Opening custom editor for ${document.uri.fsPath}`);

    // Note: Custom editors don't receive selection information from search results
    // This is a limitation of VS Code's Custom Editor API

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
        console.log(`[fabriqa ready] Webview ready for ${document.uri.fsPath.split('/').pop()}`);
        Logger.info('Webview ready');

        // Check if there's a pending reveal (e.g., from search results)
        if (this.pendingReveal && this.pendingReveal.uri === document.uri.toString()) {
          const { line, character } = this.pendingReveal;
          console.log(`[fabriqa ready] ✓ Sending revealPosition: line ${line}, char ${character}`);

          // DEBUG: Show alert
          vscode.window.showInformationMessage(`🎯 Sending reveal to webview: line ${line}, char ${character}`);

          // Send reveal message to webview
          webview.postMessage({
            type: 'revealPosition',
            line: line,
            character: character
          });
          Logger.info(`Revealed position: line ${line}, column ${character}`);
          // Clear pending reveal
          this.pendingReveal = null;
        } else {
          console.log(`[fabriqa ready] ✗ No pending reveal`);
        }
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

      case 'openLink':
        // Open linked markdown file with Fabriqa editor
        await this.openLinkedFile(message.url, document);
        break;

      case 'openInBrowser':
        // Generate HTML and open in default browser
        await this.openInBrowser(message.markdown, document, message.themeColors);
        break;

      default:
        Logger.warn(`Unknown message type from webview: ${message.type}`);
    }
  }

  /**
   * Open a linked markdown file in the Fabriqa editor
   */
  private async openLinkedFile(url: string, currentDocument: vscode.TextDocument): Promise<void> {
    try {
      Logger.info(`Opening linked file: ${url}`);

      // Resolve the link relative to the current document
      const currentDir = path.dirname(currentDocument.uri.fsPath);
      const targetPath = path.isAbsolute(url) ? url : path.join(currentDir, url);

      // Create URI for the target file
      const targetUri = vscode.Uri.file(targetPath);

      // Check if file exists
      try {
        await vscode.workspace.fs.stat(targetUri);
      } catch (error) {
        vscode.window.showWarningMessage(`File not found: ${url}`);
        return;
      }

      // Open the file with Fabriqa editor
      await vscode.commands.executeCommand('vscode.openWith', targetUri, 'fabriqa.markdownEditor');

      Logger.info(`Successfully opened linked file: ${targetPath}`);
    } catch (error) {
      Logger.error(`Failed to open linked file: ${url}`, error);
      vscode.window.showErrorMessage(`Failed to open linked file: ${url}`);
    }
  }

  /**
   * Open markdown content in default browser as HTML
   */
  private async openInBrowser(markdown: string, document: vscode.TextDocument, themeColors?: any): Promise<void> {
    try {
      Logger.info('Generating HTML for browser');

      // Configure marked for GitHub Flavored Markdown
      marked.setOptions({
        gfm: true,
        breaks: true
      });

      // Process GitHub alerts before converting to HTML
      const processedMarkdown = this.processGitHubAlerts(markdown);

      // Convert markdown to HTML
      let htmlContent = await marked(processedMarkdown);

      // Post-process: Replace alert placeholders with actual alert HTML
      htmlContent = await this.replaceAlertPlaceholders(htmlContent);

      // Create complete HTML document with CrossNote styling
      const fullHtml = this.generateFullHtml(htmlContent, document, themeColors);

      // Generate temp file path
      const tempDir = os.tmpdir();
      const fileName = `fabriqa-${path.basename(document.uri.fsPath, '.md')}-${Date.now()}.html`;
      const tempFilePath = path.join(tempDir, fileName);

      // Write HTML to temp file
      fs.writeFileSync(tempFilePath, fullHtml, 'utf-8');
      Logger.info(`HTML file created at: ${tempFilePath}`);

      // Open with default browser
      const fileUri = vscode.Uri.file(tempFilePath);
      await vscode.env.openExternal(fileUri);

      Logger.info('Opened HTML in browser');
      vscode.window.showInformationMessage('Opened in browser');
    } catch (error) {
      Logger.error('Failed to open in browser', error);
      vscode.window.showErrorMessage(`Failed to open in browser: ${error}`);
    }
  }

  /**
   * Process GitHub-style alerts in markdown
   * Converts > [!TYPE] syntax to a placeholder that will be replaced after markdown processing
   */
  private processGitHubAlerts(markdown: string): string {
    // Match GitHub alert patterns like:
    // > [!NOTE]
    // > Content here
    const alertPattern = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>\s*.*\n?)*)/gim;
    
    const alertIcons: Record<string, string> = {
      'NOTE': 'ℹ️',
      'TIP': '💡',
      'IMPORTANT': '❗',
      'WARNING': '⚠️',
      'CAUTION': '⚠️'
    };

    // Store alert data for post-processing
    const alerts: Array<{type: string, content: string, icon: string}> = [];
    let alertIndex = 0;

    // Replace alerts with placeholders
    const withPlaceholders = markdown.replace(alertPattern, (match, type, content) => {
      const alertType = type.toLowerCase();
      const icon = alertIcons[type.toUpperCase()];
      
      // Remove leading '> ' from each content line to get raw markdown
      const cleanContent = content
        .split('\n')
        .map((line: string) => line.replace(/^>\s?/, ''))
        .join('\n')
        .trim();

      alerts.push({
        type: alertType,
        content: cleanContent,
        icon: icon
      });

      // Use a unique placeholder that won't be touched by marked
      return `:::GITHUB_ALERT_${alertIndex++}:::\n`;
    });

    // Store alerts on the instance for post-processing
    (this as any)._pendingAlerts = alerts;

    return withPlaceholders;
  }

  /**
   * Replace alert placeholders with actual alert HTML after markdown processing
   */
  private async replaceAlertPlaceholders(html: string): Promise<string> {
    const alerts = (this as any)._pendingAlerts as Array<{type: string, content: string, icon: string}> || [];
    
    // Clean up the stored alerts
    delete (this as any)._pendingAlerts;

    if (alerts.length === 0) {
      return html;
    }

    // Process each alert's content as markdown
    let result = html;
    for (let i = 0; i < alerts.length; i++) {
      const alert = alerts[i];
      const placeholder = `<p>:::<span>GITHUB_ALERT_${i}</span>:::</p>`;
      const placeholderAlt = `:::GITHUB_ALERT_${i}:::`;
      
      // Convert the alert content from markdown to HTML
      const alertContentHtml = await marked(alert.content);
      
      // Create the alert HTML
      const alertHtml = `<div class="markdown-alert markdown-alert-${alert.type}">
  <p class="markdown-alert-title">${alert.icon} ${alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}</p>
  ${alertContentHtml}
</div>`;

      // Replace placeholder (marked wraps it in a <p> tag)
      result = result.replace(placeholder, alertHtml);
      // Also try without the <p> wrapper in case marked didn't wrap it
      result = result.replace(placeholderAlt, alertHtml);
    }

    return result;
  }

  /**
   * Generate complete HTML document with CrossNote (Markdown Preview Enhanced) styling
   * Supports both light and dark themes, and uses actual theme colors when available
   */
  private generateFullHtml(bodyContent: string, document: vscode.TextDocument, themeColors?: any): string {
    const title = path.basename(document.uri.fsPath, '.md');
    const currentTheme = this.resolveTheme();

    // If we have actual theme colors from the webview (auto mode), use them
    let isDark = false;
    let useActualColors = false;
    if (themeColors && themeColors.bgColor && themeColors.bgColor.default) {
      // Check if background is dark by parsing the color
      const bgColor = themeColors.bgColor.default;
      isDark = this.isColorDark(bgColor);
      useActualColors = true;
      Logger.info(`Using actual VSCode theme colors, detected as ${isDark ? 'dark' : 'light'} based on background: ${bgColor}`);
    } else {
      // Fallback to theme detection
      const resolvedTheme = currentTheme === 'auto'
        ? this.resolveAutoTheme()
        : currentTheme;
      isDark = resolvedTheme === 'dark';
    }

    // Define color variables based on whether we have actual theme colors or fallback
    const colors = useActualColors ? {
      // Use actual VSCode theme colors
      body: {
        text: themeColors.fgColor.default,
        background: themeColors.bgColor.default
      },
      heading: themeColors.fgColor.default,
      strong: themeColors.fgColor.default,
      del: themeColors.fgColor.muted,
      link: {
        default: themeColors.link.default,
        hover: themeColors.link.hover
      },
      blockquote: {
        text: themeColors.blockquote.text,
        background: themeColors.blockquote.background,
        border: themeColors.blockquote.border
      },
      hr: themeColors.borderColor.muted,
      table: {
        heading: themeColors.fgColor.default,
        border: themeColors.borderColor.default
      },
      code: {
        text: themeColors.code.text,
        background: themeColors.code.background,
        inlineBackground: themeColors.code.inlineBackground
      },
      kbd: {
        text: themeColors.fgColor.default,
        background: themeColors.code.background,
        border: themeColors.borderColor.default,
        borderBottom: themeColors.borderColor.muted
      }
    } : {
      // Fallback to hardcoded light/dark colors
      body: {
        text: isDark ? '#d4d4d4' : '#333',
        background: isDark ? '#1e1e1e' : '#fff'
      },
      heading: isDark ? '#d4d4d4' : '#000',
      strong: isDark ? '#d4d4d4' : '#000',
      del: isDark ? '#858585' : '#5c5c5c',
      link: {
        default: isDark ? '#4fc1ff' : '#08c',
        hover: isDark ? '#6dd1ff' : '#00a3f5'
      },
      blockquote: {
        text: isDark ? '#858585' : '#5c5c5c',
        background: isDark ? '#252526' : '#f0f0f0',
        border: isDark ? '#3e3e42' : '#d6d6d6'
      },
      hr: isDark ? '#3e3e42' : '#d6d6d6',
      table: {
        heading: isDark ? '#d4d4d4' : '#000',
        border: isDark ? '#3e3e42' : '#d6d6d6'
      },
      code: {
        text: isDark ? '#d4d4d4' : '#000',
        background: isDark ? '#252526' : '#f5f5f5',
        inlineBackground: isDark ? '#2d2d30' : '#f0f0f0'
      },
      kbd: {
        text: isDark ? '#d4d4d4' : '#000',
        background: isDark ? '#252526' : '#f0f0f0',
        border: isDark ? '#3e3e42' : '#d6d6d6',
        borderBottom: isDark ? '#2d2d30' : '#c7c7c7'
      }
    };

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* CrossNote / Markdown Preview Enhanced CSS - Theme Aware */
    html body {
      font-family: 'Helvetica Neue', Helvetica, 'Segoe UI', Arial, freesans, sans-serif;
      font-size: 16px;
      line-height: 1.6;
      color: ${colors.body.text};
      background-color: ${colors.body.background};
      overflow: initial;
      box-sizing: border-box;
      word-wrap: break-word;
    }

    html body > :first-child {
      margin-top: 0;
    }

    /* Headings */
    html body h1, html body h2, html body h3, html body h4, html body h5, html body h6 {
      line-height: 1.2;
      margin-top: 1em;
      margin-bottom: 16px;
      color: ${colors.heading};
    }

    html body h1 {
      font-size: 2.25em;
      font-weight: 300;
      padding-bottom: .3em;
    }

    html body h2 {
      font-size: 1.75em;
      font-weight: 400;
      padding-bottom: .3em;
    }

    html body h3 {
      font-size: 1.5em;
      font-weight: 500;
    }

    html body h4 {
      font-size: 1.25em;
      font-weight: 600;
    }

    html body h5 {
      font-size: 1.1em;
      font-weight: 600;
    }

    html body h6 {
      font-size: 1em;
      font-weight: 600;
      color: #5c5c5c;
    }

    /* Override for h1-h5 to ensure weight 600 */
    html body h1, html body h2, html body h3, html body h4, html body h5 {
      font-weight: 600;
    }

    /* Re-apply specific weights for h1 and h2 */
    html body h1 {
      font-weight: 300;
    }

    html body h2 {
      font-weight: 400;
    }

    html body h5 {
      font-size: 1em;
    }

    /* Text styling */
    html body strong {
      color: ${colors.strong};
    }

    html body del {
      color: ${colors.del};
    }

    html body a:not([href]) {
      color: inherit;
      text-decoration: none;
    }

    html body a {
      color: ${colors.link.default};
      text-decoration: none;
    }

    html body a:hover {
      color: ${colors.link.hover};
      text-decoration: none;
    }

    html body img {
      max-width: 100%;
    }

    /* Paragraphs */
    html body > p {
      margin-top: 0;
      margin-bottom: 16px;
      word-wrap: break-word;
    }

    /* Lists */
    html body > ul, html body > ol {
      margin-bottom: 16px;
    }

    html body ul, html body ol {
      padding-left: 2em;
    }

    html body ul.no-list, html body ol.no-list {
      padding: 0;
      list-style-type: none;
    }

    html body ul ul, html body ul ol, html body ol ol, html body ol ul {
      margin-top: 0;
      margin-bottom: 0;
    }

    html body li {
      margin-bottom: 0;
    }

    html body li.task-list-item {
      list-style: none;
    }

    html body li > p {
      margin-top: 0;
      margin-bottom: 0;
    }

    html body .task-list-item-checkbox {
      margin: 0 .2em .25em -1.8em;
      vertical-align: middle;
    }

    html body .task-list-item-checkbox:hover {
      cursor: pointer;
    }

    /* Blockquotes */
    html body blockquote {
      margin: 16px 0;
      font-size: inherit;
      padding: 0 15px;
      color: ${colors.blockquote.text};
      background-color: ${colors.blockquote.background};
      border-left: 4px solid ${colors.blockquote.border};
    }

    html body blockquote > :first-child {
      margin-top: 0;
    }

    html body blockquote > :last-child {
      margin-bottom: 0;
    }

    /* Horizontal rules */
    html body hr {
      height: 4px;
      margin: 32px 0;
      background-color: ${colors.hr};
      border: 0 none;
    }

    /* Tables */
    html body table {
      margin: 10px 0 15px 0;
      border-collapse: collapse;
      border-spacing: 0;
      display: block;
      width: 100%;
      overflow: auto;
      word-break: normal;
      word-break: keep-all;
    }

    html body table th {
      font-weight: 700;
      color: ${colors.table.heading};
    }

    html body table td, html body table th {
      border: 1px solid ${colors.table.border};
      padding: 6px 13px;
    }

    /* Definition lists */
    html body dl {
      padding: 0;
    }

    html body dl dt {
      padding: 0;
      margin-top: 16px;
      font-size: 1em;
      font-style: italic;
      font-weight: 700;
    }

    html body dl dd {
      padding: 0 16px;
      margin-bottom: 16px;
    }

    /* Code */
    html body code {
      font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
      font-size: .85em;
      color: ${colors.code.text};
      background-color: ${colors.code.inlineBackground};
      border-radius: 3px;
      padding: .2em 0;
    }

    html body code::before, html body code::after {
      letter-spacing: -.2em;
      content: "\\00a0";
    }

    html body pre > code {
      padding: 0;
      margin: 0;
      word-break: normal;
      white-space: pre;
      background: transparent;
      border: 0;
    }

    html body .highlight {
      margin-bottom: 16px;
    }

    html body .highlight pre, html body pre {
      padding: 1em;
      overflow: auto;
      line-height: 1.45;
      background-color: ${colors.code.background};
      border: ${colors.table.border};
      border-radius: 3px;
    }

    html body .highlight pre {
      margin-bottom: 0;
      word-break: normal;
    }

    html body pre code, html body pre tt {
      display: inline;
      max-width: initial;
      padding: 0;
      margin: 0;
      overflow: initial;
      line-height: inherit;
      word-wrap: normal;
      background-color: transparent;
      border: 0;
    }

    html body pre code:before, html body pre code:after,
    html body pre tt:before, html body pre tt:after {
      content: normal;
    }

    html body p, html body blockquote, html body ul, html body ol,
    html body dl, html body pre {
      margin-top: 0;
      margin-bottom: 16px;
    }

    html body kbd {
      color: ${colors.kbd.text};
      border: 1px solid ${colors.kbd.border};
      border-bottom: 2px solid ${colors.kbd.borderBottom};
      padding: 2px 4px;
      background-color: ${colors.kbd.background};
      border-radius: 3px;
    }

    /* Prism syntax highlighting for code blocks */
    code[class*="language-"],
    pre[class*="language-"] {
      color: ${colors.code.text};
      background: none;
      font-family: Consolas, "Liberation Mono", Menlo, Courier, monospace;
      text-align: left;
      white-space: pre;
      word-spacing: normal;
      word-break: normal;
      word-wrap: normal;
      line-height: 1.4;
      -moz-tab-size: 8;
      -o-tab-size: 8;
      tab-size: 8;
      -webkit-hyphens: none;
      -moz-hyphens: none;
      -ms-hyphens: none;
      hyphens: none;
    }

    pre[class*="language-"] {
      padding: .8em;
      overflow: auto;
      border-radius: 3px;
      background: ${colors.code.background};
    }

    :not(pre) > code[class*="language-"] {
      padding: .1em;
      border-radius: .3em;
      white-space: normal;
      background: ${colors.code.background};
    }

    /* Markdown preview wrapper */
    .markdown-preview {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }

    .markdown-preview ul {
      list-style: disc;
    }

    .markdown-preview ul ul {
      list-style: circle;
    }

    .markdown-preview ul ul ul {
      list-style: square;
    }

    .markdown-preview ol {
      list-style: decimal;
    }

    .markdown-preview ol ol,
    .markdown-preview ul ol {
      list-style-type: lower-roman;
    }

    .markdown-preview ol ol ol,
    .markdown-preview ol ul ol,
    .markdown-preview ul ol ol,
    .markdown-preview ul ul ol {
      list-style-type: lower-alpha;
    }

    /* Page layout for HTML export */
    html body[for="html-export"]:not([data-presentation-mode]) {
      position: relative;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      margin: 0;
      padding: 0;
      overflow: auto;
    }

    html body[for="html-export"]:not([data-presentation-mode]) .markdown-preview {
      position: relative;
      top: 0;
    }

    @media screen and (min-width: 914px) {
      html body[for="html-export"]:not([data-presentation-mode]) .markdown-preview {
        padding: 2em calc(50% - 457px + 2em);
      }
    }

    @media screen and (max-width: 914px) {
      html body[for="html-export"]:not([data-presentation-mode]) .markdown-preview {
        padding: 2em;
      }
    }

    @media screen and (max-width: 450px) {
      html body[for="html-export"]:not([data-presentation-mode]) .markdown-preview {
        font-size: 14px !important;
        padding: 1em;
      }
    }

    @media print {
      html body {
        background-color: ${colors.body.background};
      }
      html body h1, html body h2, html body h3, html body h4, html body h5, html body h6 {
        color: ${colors.heading};
        page-break-after: avoid;
      }
      html body blockquote {
        color: ${colors.blockquote.text};
      }
      html body pre {
        page-break-inside: avoid;
      }
      html body table {
        display: table;
      }
      html body img {
        display: block;
        max-width: 100%;
        max-height: 100%;
      }
      html body pre,
      html body code {
        word-wrap: break-word;
        white-space: pre;
      }
    }

    /* GitHub Alerts / Admonitions */
    .markdown-alert {
      padding: 0.5rem 1rem;
      margin-bottom: 1rem;
      border-left: 0.25rem solid ${colors.table.border};
      border-radius: 0.25rem;
    }

    .markdown-alert > :first-child {
      margin-top: 0;
    }

    .markdown-alert > :last-child {
      margin-bottom: 0;
    }

    .markdown-alert .markdown-alert-title {
      display: flex;
      font-weight: 600;
      align-items: center;
      line-height: 1;
      margin-bottom: 0.5rem;
    }

    .markdown-alert-note {
      border-left-color: ${useActualColors ? (themeColors.borderColor.accent || '#0969da') : (isDark ? '#4493f8' : '#0969da')};
      background-color: ${useActualColors ? (themeColors.bgColor.muted || 'rgba(9, 105, 218, 0.1)') : (isDark ? 'rgba(68, 147, 248, 0.15)' : 'rgba(9, 105, 218, 0.1)')};
    }

    .markdown-alert-note .markdown-alert-title {
      color: ${useActualColors ? (themeColors.fgColor.accent || '#0969da') : (isDark ? '#4493f8' : '#0969da')};
    }

    .markdown-alert-tip {
      border-left-color: ${useActualColors ? (themeColors.borderColor.success || '#1a7f37') : (isDark ? '#3fb950' : '#1a7f37')};
      background-color: ${useActualColors ? 'rgba(26, 127, 55, 0.1)' : (isDark ? 'rgba(63, 185, 80, 0.15)' : 'rgba(26, 127, 55, 0.1)')};
    }

    .markdown-alert-tip .markdown-alert-title {
      color: ${useActualColors ? (themeColors.fgColor.success || '#1a7f37') : (isDark ? '#3fb950' : '#1a7f37')};
    }

    .markdown-alert-important {
      border-left-color: ${useActualColors ? (themeColors.borderColor.done || '#8250df') : (isDark ? '#a371f7' : '#8250df')};
      background-color: ${useActualColors ? 'rgba(130, 80, 223, 0.1)' : (isDark ? 'rgba(163, 113, 247, 0.15)' : 'rgba(130, 80, 223, 0.1)')};
    }

    .markdown-alert-important .markdown-alert-title {
      color: ${useActualColors ? (themeColors.fgColor.done || '#8250df') : (isDark ? '#a371f7' : '#8250df')};
    }

    .markdown-alert-warning {
      border-left-color: ${useActualColors ? (themeColors.borderColor.attention || '#9a6700') : (isDark ? '#d29922' : '#9a6700')};
      background-color: ${useActualColors ? (themeColors.bgColor.attention || 'rgba(154, 103, 0, 0.1)') : (isDark ? 'rgba(210, 153, 34, 0.15)' : 'rgba(154, 103, 0, 0.1)')};
    }

    .markdown-alert-warning .markdown-alert-title {
      color: ${useActualColors ? (themeColors.fgColor.attention || '#9a6700') : (isDark ? '#d29922' : '#9a6700')};
    }

    .markdown-alert-caution {
      border-left-color: ${useActualColors ? (themeColors.borderColor.danger || '#d1242f') : (isDark ? '#f85149' : '#d1242f')};
      background-color: ${useActualColors ? 'rgba(209, 36, 47, 0.1)' : (isDark ? 'rgba(248, 81, 73, 0.15)' : 'rgba(209, 36, 47, 0.1)')};
    }

    .markdown-alert-caution .markdown-alert-title {
      color: ${useActualColors ? (themeColors.fgColor.danger || '#d1242f') : (isDark ? '#f85149' : '#d1242f')};
    }
  </style>
</head>
<body for="html-export">
  <div class="markdown-preview">
${bodyContent}
  </div>
</body>
</html>`;
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

    // Resolve theme based on user setting
    const themeType = this.resolveTheme();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src ${cspSource}; img-src https: data:;">
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
      font-family: 'Helvetica Neue', Helvetica, 'Segoe UI', Arial, freesans, sans-serif;
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

    /* All theme colors are managed by the theme system in webview/themes/ */
    /* Theme is applied dynamically via CodeMirror's theme extensions */

    /* Context menu - basic structure only, colors injected dynamically */
    #context-menu {
      display: none;
      position: fixed;
      border-radius: 3px;
      z-index: 10000;
      min-width: 180px;
      padding: 4px 0;
    }

    .context-menu-item {
      padding: 6px 12px;
      cursor: pointer;
      font-size: 13px;
    }

    .context-menu-separator {
      height: 1px;
      margin: 4px 0;
    }

    /* Loading and error states - minimal structure */
    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .error {
      padding: 20px;
      border-radius: 4px;
      margin: 20px;
    }
  </style>
</head>
<body data-theme="${themeType}" data-mode="${defaultMode}">
  <div id="context-menu">
    <div class="context-menu-item" data-action="openInBrowser">Open in Browser</div>
  </div>
  <div id="editor">
    <div class="loading">Loading editor...</div>
  </div>
  <script src="${scriptUri}"></script>
</body>
</html>`;
  }

  /**
   * Set a pending position to reveal when the next webview becomes ready
   * Used for opening files from search results at a specific position
   */
  public setPendingReveal(uri: vscode.Uri, line: number, character: number): void {
    this.pendingReveal = {
      uri: uri.toString(),
      line: line,
      character: character
    };
    Logger.info(`Set pending reveal for ${uri.fsPath} at line ${line}, column ${character}`);
  }

  /**
   * Send message to the currently active webview
   * Used by global find commands
   */
  public async sendToActiveWebview(message: any): Promise<void> {
    if (!this.currentActivePanel) {
      Logger.warn('No active Fabriqa editor to send message to');
      return;
    }

    this.currentActivePanel.webview.postMessage(message);
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

  /**
   * Dispose resources
   */
  public dispose(): void {
    // Nothing to dispose currently
  }
}
