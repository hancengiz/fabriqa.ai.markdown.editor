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
  // Track last click for double-click detection
  let lastClickTime = 0;
  let lastClickedFile = '';
  const DOUBLE_CLICK_THRESHOLD = 500; // milliseconds

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

        // Detect double-click: if same file clicked within threshold
        const now = Date.now();
        const filePath = uri.fsPath;
        const isDoubleClick = (now - lastClickTime < DOUBLE_CLICK_THRESHOLD) && (filePath === lastClickedFile);

        lastClickTime = now;
        lastClickedFile = filePath;

        // Determine preview mode
        let usePreview = preview !== false; // Default to preview
        if (isDoubleClick) {
          usePreview = false; // Double-click = permanent tab
        }

        // Open with custom editor
        await vscode.commands.executeCommand('vscode.openWith', uri, 'fabriqa.markdownEditor', {
          preview: usePreview,
          preserveFocus: false
        });

        Logger.info(`Opened file with fabriqa editor (preview: ${usePreview}, double-click: ${isDoubleClick}): ${uri.fsPath}`);
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

      // Check if .vscode/fabriqa-markdown-editor-config.json exists
      const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
      const sidebarConfigPath = workspaceRoot ? path.join(workspaceRoot, '.vscode', 'fabriqa-markdown-editor-config.json') : null;
      const sidebarConfigExists = sidebarConfigPath ? fs.existsSync(sidebarConfigPath) : false;

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
        },
        {
          label: sidebarConfigExists ? '$(file) Edit Sidebar Config' : '$(new-file) Create Sidebar Config',
          description: sidebarConfigExists ? 'Edit .vscode/fabriqa-markdown-editor-config.json' : 'Create config with default settings',
          action: 'sidebar:config'
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

        case 'sidebar':
          if (value === 'config') {
            await vscode.commands.executeCommand('fabriqa.createOrEditSidebarConfig');
          }
          break;
      }
    })
  );

  // Create or edit sidebar config file
  context.subscriptions.push(
    vscode.commands.registerCommand('fabriqa.createOrEditSidebarConfig', async () => {
      try {
        const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        if (!workspaceRoot) {
          vscode.window.showErrorMessage('No workspace folder is open');
          return;
        }

        // Create .vscode directory if it doesn't exist
        const vscodeDir = path.join(workspaceRoot, '.vscode');
        if (!fs.existsSync(vscodeDir)) {
          fs.mkdirSync(vscodeDir, { recursive: true });
        }

        const sidebarConfigPath = path.join(vscodeDir, 'fabriqa-markdown-editor-config.json');
        const configExists = fs.existsSync(sidebarConfigPath);

        // If file doesn't exist, create it with content from current config
        if (!configExists) {
          // Get current config to use as template
          const currentConfig = configManager.getConfig();
          const defaultContent = {
            sections: currentConfig.sections.map(section => ({
              id: section.id,
              title: section.title,
              collapsed: section.collapsed,
              ...(section.files.length > 0 && {
                files: section.files.map(file => file.relativePath)
              }),
              ...(section.description && { description: section.description })
            }))
          };

          fs.writeFileSync(sidebarConfigPath, JSON.stringify(defaultContent, null, 2), 'utf-8');
          Logger.info(`Created sidebar config: ${sidebarConfigPath}`);
          vscode.window.showInformationMessage('Created .vscode/fabriqa-markdown-editor-config.json with current settings');
        }

        // Open the file
        const uri = vscode.Uri.file(sidebarConfigPath);
        await vscode.commands.executeCommand('vscode.open', uri);

        // Refresh tree view to pick up changes
        setTimeout(() => {
          treeProvider.refresh();
        }, 500);

      } catch (error) {
        Logger.error('Failed to create/edit sidebar config', error);
        vscode.window.showErrorMessage(`Failed to create/edit config: ${error}`);
      }
    })
  );


}

