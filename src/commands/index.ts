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
    vscode.commands.registerCommand('fabriqa.openMarkdownEditor', async (filePathOrUri?: string | vscode.Uri) => {
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
            openLabel: 'Open with Fabriqa Editor'
          });

          if (!selected || selected.length === 0) {
            return;
          }

          uri = selected[0];
        }

        // Open with custom editor
        await vscode.commands.executeCommand('vscode.openWith', uri, 'fabriqa.markdownEditor');
        Logger.info(`Opened file with Fabriqa editor: ${uri.fsPath}`);
      } catch (error) {
        Logger.error('Failed to open file with Fabriqa editor', error);
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
      vscode.window.showInformationMessage('Refreshed Fabriqa tree view');
    })
  );

  // Create new file
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.createFile', async (treeItem?: any) => {
      try {
        // Get section from tree item if available
        const section = treeItem?.section;

        // Prompt for file name
        const fileName = await vscode.window.showInputBox({
          prompt: 'Enter file name (without .md extension)',
          placeHolder: 'my-document',
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

        if (!fileName) {
          return;
        }

        // Get workspace root
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
          throw new Error('No workspace folder is open');
        }

        // Determine file path
        let filePath: string;
        if (section) {
          // Create in section's directory (assume first file's directory)
          const firstFile = section.files[0];
          if (firstFile) {
            const dir = path.dirname(firstFile.absolutePath);
            filePath = path.join(dir, `${fileName}.md`);
          } else {
            // Section has no files, create in workspace root
            filePath = path.join(workspaceRoot, `${fileName}.md`);
          }
        } else {
          // No section specified, create in workspace root
          filePath = path.join(workspaceRoot, `${fileName}.md`);
        }

        // Check if file already exists
        if (fs.existsSync(filePath)) {
          const overwrite = await vscode.window.showWarningMessage(
            `File "${fileName}.md" already exists. Overwrite?`,
            'Yes', 'No'
          );
          if (overwrite !== 'Yes') {
            return;
          }
        }

        // Create file with template content
        const content = `# ${fileName}\n\n`;
        fs.writeFileSync(filePath, content, 'utf-8');

        // Refresh tree view
        treeProvider.refresh();

        // Open the file
        const uri = vscode.Uri.file(filePath);
        await vscode.commands.executeCommand('vscode.openWith', uri, 'fabriqa.markdownEditor');

        Logger.info(`Created new file: ${filePath}`);
        vscode.window.showInformationMessage(`Created ${fileName}.md`);
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
      const config = vscode.workspace.getConfiguration('fabriqa');

      // Get current values
      const currentMode = editorProvider.getCurrentMode() || 'livePreview';
      const currentTheme = config.get<string>('theme', 'light');

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
          label: '$(color-mode) Theme: Light',
          description: currentTheme === 'light' ? '✓ Current' : '',
          action: 'theme:light'
        },
        {
          label: '$(color-mode) Theme: Dark',
          description: currentTheme === 'dark' ? '✓ Current' : '',
          action: 'theme:dark'
        },
        {
          label: '$(color-mode) Theme: Follow VS Code',
          description: currentTheme === 'vscode' ? '✓ Current' : '',
          action: 'theme:vscode'
        },
        { label: '', kind: vscode.QuickPickItemKind.Separator },
        {
          label: '$(gear) Open Settings',
          description: 'Configure all Fabriqa settings',
          action: 'open:settings'
        }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Fabriqa Editor Settings'
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

        case 'theme':
          await config.update('theme', value, vscode.ConfigurationTarget.Global);
          vscode.window.showInformationMessage(`Theme changed to: ${value}`);
          break;

        case 'open':
          if (value === 'settings') {
            await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:fabriqa.fabriqa-markdown-editor');
          }
          break;
      }
    })
  );


  // Change theme
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.changeTheme', async () => {
      const config = vscode.workspace.getConfiguration('fabriqa');
      const currentTheme = config.get<string>('theme', 'light');

      const themes = [
        { label: 'Light', value: 'light', description: currentTheme === 'light' ? '✓ Current' : '' },
        { label: 'Dark', value: 'dark', description: currentTheme === 'dark' ? '✓ Current' : '' },
        { label: 'Follow VS Code', value: 'vscode', description: currentTheme === 'vscode' ? '✓ Current' : '' }
      ];

      const selected = await vscode.window.showQuickPick(themes, {
        placeHolder: 'Select editor theme'
      });

      if (selected) {
        await config.update('theme', selected.value, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Theme changed to: ${selected.label}`);
      }
    })
  );
}

