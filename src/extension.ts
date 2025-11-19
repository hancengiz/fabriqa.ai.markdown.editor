import * as vscode from 'vscode';
import { MarkdownTreeProvider } from './providers/MarkdownTreeProvider';
import { MarkdownEditorProvider } from './providers/MarkdownEditorProvider';
import { ConfigManager } from './config/ConfigManager';
import { registerCommands } from './commands';
import { Logger } from './utils/Logger';

let treeProvider: MarkdownTreeProvider | undefined;
let editorProvider: MarkdownEditorProvider | undefined;

export function activate(context: vscode.ExtensionContext): void {
  Logger.info('Fabriqa Markdown Editor activating...');

  try {
    // Initialize configuration manager
    const configManager = new ConfigManager();

    // Create tree provider for sidebar
    treeProvider = new MarkdownTreeProvider(configManager);
    context.subscriptions.push(
      vscode.window.registerTreeDataProvider('fabriqa.markdownTree', treeProvider)
    );

    // Register custom editor provider
    editorProvider = new MarkdownEditorProvider(context, configManager);
    context.subscriptions.push(
      vscode.window.registerCustomEditorProvider(
        'fabriqa.markdownEditor',
        editorProvider,
        {
          webviewOptions: {
            retainContextWhenHidden: true,
          },
          supportsMultipleEditorsPerDocument: false,
        }
      )
    );

    // Register commands
    registerCommands(context, treeProvider, editorProvider, configManager);

    // Watch for config file changes
    setupFileWatchers(context, treeProvider, configManager);

    Logger.info('Fabriqa Markdown Editor activated successfully');
  } catch (error) {
    Logger.error('Failed to activate Fabriqa Markdown Editor', error);
    vscode.window.showErrorMessage(`Failed to activate Fabriqa Markdown Editor: ${error}`);
  }
}

export function deactivate(): void {
  Logger.info('Fabriqa Markdown Editor deactivating...');
  treeProvider = undefined;
  editorProvider = undefined;
}

function setupFileWatchers(
  context: vscode.ExtensionContext,
  treeProvider: MarkdownTreeProvider,
  configManager: ConfigManager
): void {
  // Watch for changes to the config file
  const configPath = configManager.getConfigPath();
  const configWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(
      vscode.workspace.workspaceFolders![0],
      configPath
    )
  );

  configWatcher.onDidChange(() => {
    Logger.info('Config file changed, refreshing tree view');
    configManager.reload();
    treeProvider.refresh();
  });

  configWatcher.onDidCreate(() => {
    Logger.info('Config file created, refreshing tree view');
    configManager.reload();
    treeProvider.refresh();
  });

  configWatcher.onDidDelete(() => {
    Logger.info('Config file deleted, refreshing tree view');
    configManager.reload();
    treeProvider.refresh();
  });

  context.subscriptions.push(configWatcher);

  // Watch for markdown file changes
  const mdWatcher = vscode.workspace.createFileSystemWatcher('**/*.md');

  mdWatcher.onDidCreate(() => treeProvider.refresh());
  mdWatcher.onDidDelete(() => treeProvider.refresh());
  mdWatcher.onDidChange(() => treeProvider.refresh());

  context.subscriptions.push(mdWatcher);
}
