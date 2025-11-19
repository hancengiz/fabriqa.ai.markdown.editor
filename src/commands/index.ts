import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { MarkdownTreeProvider } from '../providers/MarkdownTreeProvider';
import { MarkdownEditorProvider, EditorMode } from '../providers/MarkdownEditorProvider';
import { ConfigManager } from '../config/ConfigManager';
import { Logger } from '../utils/Logger';
import { WebviewLogger } from '../utils/WebviewLogger';

/**
 * Register all commands for the extension
 */
export function registerCommands(
  context: vscode.ExtensionContext,
  treeProvider: MarkdownTreeProvider,
  editorProvider: MarkdownEditorProvider,
  configManager: ConfigManager
): void {
  // Open markdown file with custom editor
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.openMarkdownEditor', async (filePathOrUri?: string | vscode.Uri, preview?: boolean) => {
      try {
        let uri: vscode.Uri;

        if (typeof filePathOrUri === 'string') {
          uri = vscode.Uri.file(filePathOrUri);
        } else if (filePathOrUri instanceof vscode.Uri) {
          uri = filePathOrUri;
        } else {
          // No file specified, show file picker
          const selected = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { 'Markdown': ['md'] },
            openLabel: 'Open with fabriqa Editor'
          });

          if (!selected || selected.length === 0) {
            return;
          }

          uri = selected[0];
        }

        // Open with custom editor
        // If preview is true, VS Code will open in preview mode (single-click)
        // If preview is false or undefined, it opens permanently (double-click)
        await vscode.commands.executeCommand('vscode.openWith', uri, 'fabriqa.markdownEditor', {
          preview: preview !== false // Default to preview mode
        });

        Logger.info(`Opened file with fabriqa editor (preview: ${preview}): ${uri.fsPath}`);
      } catch (error) {
        Logger.error('Failed to open file with fabriqa editor', error);
        vscode.window.showErrorMessage(`Failed to open file: ${error}`);
      }
    })
  );

  // Switch to Live Preview mode
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.switchToLivePreview', async () => {
      try {
        await editorProvider.switchMode('livePreview');
        Logger.info('Switched to Live Preview mode');
      } catch (error) {
        Logger.error('Failed to switch to Live Preview mode', error);
        vscode.window.showErrorMessage('Failed to switch mode');
      }
    })
  );

  // Switch to Source mode
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.switchToSource', async () => {
      try {
        await editorProvider.switchMode('source');
        Logger.info('Switched to Source mode');
      } catch (error) {
        Logger.error('Failed to switch to Source mode', error);
        vscode.window.showErrorMessage('Failed to switch mode');
      }
    })
  );

  // Switch to Reading mode
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.switchToReading', async () => {
      try {
        await editorProvider.switchMode('reading');
        Logger.info('Switched to Reading mode');
      } catch (error) {
        Logger.error('Failed to switch to Reading mode', error);
        vscode.window.showErrorMessage('Failed to switch mode');
      }
    })
  );

  // Refresh tree view
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.refreshTree', () => {
      treeProvider.refresh();
      vscode.window.showInformationMessage('Refreshed fabriqa tree view');
    })
  );

  // Create new file
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.createFile', async (treeItem?: any) => {
      try {
        // Get section from tree item if available
        const section = treeItem?.section;

        // Get workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
          throw new Error('No workspace folder is open');
        }

        // Determine default directory path for the section
        let defaultPath = '';
        if (section) {
          // Try to get directory from first file in section
          const firstFile = section.files[0];
          if (firstFile) {
            const relativeDir = path.dirname(firstFile.relativePath);
            defaultPath = relativeDir === '.' ? '' : relativeDir + '/';
          } else {
            // No files in section - try to infer from section ID
            // e.g., section.id = "specs" → "specs/"
            defaultPath = section.id + '/';
          }
        }

        // Prompt for file path (relative to workspace)
        const filePathInput = await vscode.window.showInputBox({
          prompt: 'Enter file path relative to workspace (e.g., specs/my-file.md)',
          placeHolder: 'specs/my-document.md',
          value: defaultPath,
          valueSelection: [defaultPath.length, defaultPath.length], // Cursor at end
          validateInput: (value) => {
            if (!value) {
              return 'File path cannot be empty';
            }
            if (!value.endsWith('.md')) {
              return 'File must have .md extension';
            }
            if (value.startsWith('/') || value.startsWith('\\')) {
              return 'Path should be relative (don\'t start with /)';
            }
            return null;
          }
        });

        if (!filePathInput) {
          return;
        }

        // Construct absolute file path
        const filePath = path.join(workspaceRoot, filePathInput);
        const fileDir = path.dirname(filePath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
          Logger.info(`Created directory: ${fileDir}`);
        }

        // Check if file already exists
        if (fs.existsSync(filePath)) {
          const overwrite = await vscode.window.showWarningMessage(
            `File "${filePathInput}" already exists. Overwrite?`,
            'Yes', 'No'
          );
          if (overwrite !== 'Yes') {
            return;
          }
        }

        // Create file with template content
        const fileName = path.basename(filePathInput, '.md');
        const content = `# ${fileName}\n\n`;
        fs.writeFileSync(filePath, content, 'utf-8');

        // Refresh tree view (file watcher will auto-refresh, but do it anyway)
        treeProvider.refresh();

        // Open the file
        const uri = vscode.Uri.file(filePath);
        await vscode.commands.executeCommand('vscode.openWith', uri, 'fabriqa.markdownEditor');

        Logger.info(`Created new file: ${filePath}`);
        vscode.window.showInformationMessage(`Created ${filePathInput}`);
      } catch (error) {
        Logger.error('Failed to create file', error);
        vscode.window.showErrorMessage(`Failed to create file: ${error}`);
      }
    })
  );

  // Delete file
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.deleteFile', async (treeItem?: any) => {
      try {
        const file = treeItem?.file;
        if (!file) {
          vscode.window.showErrorMessage('No file selected');
          return;
        }

        // Confirm deletion
        const confirm = await vscode.window.showWarningMessage(
          `Are you sure you want to delete "${file.displayName}"?`,
          { modal: true },
          'Delete'
        );

        if (confirm !== 'Delete') {
          return;
        }

        // Delete file
        fs.unlinkSync(file.absolutePath);

        // Refresh tree view
        treeProvider.refresh();

        Logger.info(`Deleted file: ${file.absolutePath}`);
        vscode.window.showInformationMessage(`Deleted ${file.displayName}`);
      } catch (error) {
        Logger.error('Failed to delete file', error);
        vscode.window.showErrorMessage(`Failed to delete file: ${error}`);
      }
    })
  );

  // Rename file
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.renameFile', async (treeItem?: any) => {
      try {
        const file = treeItem?.file;
        if (!file) {
          vscode.window.showErrorMessage('No file selected');
          return;
        }

        // Prompt for new name (strip .md for input, add it back for file operation)
        const baseNameWithoutExt = path.basename(file.displayName, '.md');
        const newName = await vscode.window.showInputBox({
          prompt: 'Enter new file name (without .md extension)',
          placeHolder: 'my-document',
          value: baseNameWithoutExt,
          validateInput: (value) => {
            if (!value) {
              return 'File name cannot be empty';
            }
            if (value.includes('/') || value.includes('\\')) {
              return 'File name cannot contain path separators';
            }
            return null;
          }
        });

        if (!newName || newName === baseNameWithoutExt) {
          return;
        }

        // Create new path
        const dir = path.dirname(file.absolutePath);
        const newPath = path.join(dir, `${newName}.md`);

        // Check if target already exists
        if (fs.existsSync(newPath)) {
          vscode.window.showErrorMessage(`File "${newName}.md" already exists`);
          return;
        }

        // Rename file
        fs.renameSync(file.absolutePath, newPath);

        // Refresh tree view
        treeProvider.refresh();

        Logger.info(`Renamed file: ${file.absolutePath} -> ${newPath}`);
        vscode.window.showInformationMessage(`Renamed to ${newName}.md`);
      } catch (error) {
        Logger.error('Failed to rename file', error);
        vscode.window.showErrorMessage(`Failed to rename file: ${error}`);
      }
    })
  );

  // Collapse section
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.collapseSection', async () => {
      vscode.window.showInformationMessage('Collapse section (not yet implemented)');
    })
  );

  // Expand section
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.expandSection', async () => {
      vscode.window.showInformationMessage('Expand section (not yet implemented)');
    })
  );

  // Show webview console logs
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.showWebviewLogs', async () => {
      await WebviewLogger.showLogFile();
    })
  );

  // Show editor settings menu
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.showEditorSettings', async () => {
      // Get current mode
      const currentMode = editorProvider.getCurrentMode() || 'livePreview';

      // Build menu items
      const items = [
        {
          label: '$(eye) Switch to Live Preview',
          description: currentMode === 'livePreview' ? '✓ Current' : '',
          action: 'mode:livePreview'
        },
        {
          label: '$(code) Switch to Source',
          description: currentMode === 'source' ? '✓ Current' : '',
          action: 'mode:source'
        },
        {
          label: '$(book) Switch to Reading',
          description: currentMode === 'reading' ? '✓ Current' : '',
          action: 'mode:reading'
        },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        {
          label: '$(gear) Open Settings',
          description: 'Configure all fabriqa settings',
          action: 'open:settings'
        }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'fabriqa Editor Settings'
      });

      if (!selected || !selected.action) {
        return;
      }

      // Handle action
      const [type, value] = selected.action.split(':');

      switch (type) {
        case 'mode':
          await editorProvider.switchMode(value as EditorMode);
          break;

        case 'open':
          if (value === 'settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:fabriqa.fabriqa-markdown-editor');
          }
          break;
      }
    })
  );


}

