import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

/**
 * WebviewLogger - Captures and logs webview console messages to a file
 * Only active when VS Code is in development/debug mode
 */
export class WebviewLogger {
  private static logFilePath: string | null = null;
  private static isDebugMode = false;

  /**
   * Initialize the webview logger
   * @param context Extension context
   */
  static initialize(context: vscode.ExtensionContext): void {
    // Check if we're in debug mode
    this.isDebugMode = process.env.VSCODE_DEBUG_MODE === 'true' ||
                       context.extensionMode === vscode.ExtensionMode.Development;

    if (!this.isDebugMode) {
      console.log('[WebviewLogger] Not in debug mode, logging disabled');
      return;
    }

    // Create logs directory in workspace
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      console.log('[WebviewLogger] No workspace folder, logging disabled');
      return;
    }

    const logsDir = path.join(workspaceFolder.uri.fsPath, '.vscode', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create log file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFilePath = path.join(logsDir, `webview-${timestamp}.log`);

    // Write header
    fs.writeFileSync(
      this.logFilePath,
      `=== Fabriqa Webview Console Log ===\n` +
      `Started: ${new Date().toISOString()}\n` +
      `Mode: ${context.extensionMode === vscode.ExtensionMode.Development ? 'Development' : 'Production'}\n` +
      `\n`,
      'utf8'
    );

    console.log(`[WebviewLogger] Logging to: ${this.logFilePath}`);
  }

  /**
   * Log a webview console message
   */
  static log(level: 'log' | 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.isDebugMode || !this.logFilePath) {
      return;
    }

    try {
      const timestamp = new Date().toISOString();
      const levelStr = level.toUpperCase().padEnd(5);
      let logLine = `[${timestamp}] ${levelStr} ${message}`;

      if (data !== undefined) {
        logLine += `\n  Data: ${JSON.stringify(data, null, 2)}`;
      }

      logLine += '\n';

      fs.appendFileSync(this.logFilePath, logLine, 'utf8');
    } catch (error) {
      console.error('[WebviewLogger] Failed to write log:', error);
    }
  }

  /**
   * Get the current log file path
   */
  static getLogFilePath(): string | null {
    return this.logFilePath;
  }

  /**
   * Show the log file in VS Code
   */
  static async showLogFile(): Promise<void> {
    if (!this.logFilePath) {
      vscode.window.showInformationMessage('Webview logging is not enabled (not in debug mode)');
      return;
    }

    try {
      const doc = await vscode.workspace.openTextDocument(this.logFilePath);
      await vscode.window.showTextDocument(doc, { preview: false });
    } catch (error) {
      vscode.window.showErrorMessage(`Failed to open log file: ${error}`);
    }
  }
}
