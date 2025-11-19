import * as vscode from 'vscode';

class LoggerService {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('Fabriqa Markdown Editor');
  }

  public info(message: string, ...args: any[]): void {
    const formatted = this.formatMessage('INFO', message, args);
    this.outputChannel.appendLine(formatted);
    console.log(formatted);
  }

  public warn(message: string, ...args: any[]): void {
    const formatted = this.formatMessage('WARN', message, args);
    this.outputChannel.appendLine(formatted);
    console.warn(formatted);
  }

  public error(message: string, error?: any): void {
    const formatted = this.formatMessage('ERROR', message, [error]);
    this.outputChannel.appendLine(formatted);
    console.error(formatted, error);

    if (error?.stack) {
      this.outputChannel.appendLine(error.stack);
    }
  }

  public debug(message: string, ...args: any[]): void {
    const formatted = this.formatMessage('DEBUG', message, args);
    this.outputChannel.appendLine(formatted);
    console.debug(formatted);
  }

  public show(): void {
    this.outputChannel.show();
  }

  private formatMessage(level: string, message: string, args: any[]): string {
    const timestamp = new Date().toISOString();
    const argsStr = args.length > 0 ? ' ' + JSON.stringify(args) : '';
    return `[${timestamp}] [${level}] ${message}${argsStr}`;
  }
}

export const Logger = new LoggerService();
