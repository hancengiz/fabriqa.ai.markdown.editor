import { ThemeInfo } from './types';

/**
 * VS Code Auto Theme
 * Dynamically adapts to the current VSCode theme by using CSS variables
 * These variables are automatically provided by VSCode to webviews
 *
 * This theme will automatically match the user's active VSCode theme,
 * whether it's light, dark, or a custom theme.
 */
export const vscodeAutoTheme: ThemeInfo = {
  id: 'vscode-auto',
  name: 'VS Code Auto',
  type: 'custom',
  theme: {
    // Background colors - using VSCode's theme variables
    bgColor: {
      default: 'var(--vscode-editor-background)',
      muted: 'var(--vscode-textCodeBlock-background)',
      neutral: 'var(--vscode-editorWidget-background)',
      attention: 'var(--vscode-inputValidation-warningBackground)',
    },

    // Foreground/text colors
    fgColor: {
      default: 'var(--vscode-editor-foreground)',
      muted: 'var(--vscode-descriptionForeground)',
      accent: 'var(--vscode-textLink-foreground)',
      success: 'var(--vscode-terminal-ansiGreen)',
      attention: 'var(--vscode-inputValidation-warningForeground)',
      danger: 'var(--vscode-errorForeground)',
      done: 'var(--vscode-terminal-ansiMagenta)',
    },

    // Border colors
    borderColor: {
      default: 'var(--vscode-editorWidget-border)',
      muted: 'var(--vscode-panel-border)',
      accent: 'var(--vscode-focusBorder)',
      success: 'var(--vscode-terminal-ansiGreen)',
      attention: 'var(--vscode-inputValidation-warningBorder)',
      danger: 'var(--vscode-inputValidation-errorBorder)',
      done: 'var(--vscode-terminal-ansiMagenta)',
    },

    // Code colors
    code: {
      background: 'var(--vscode-input-background)',
      text: 'var(--vscode-textPreformat-foreground, var(--vscode-editor-foreground))',
      inlineBackground: 'var(--vscode-input-background)',
    },

    // Blockquote colors
    blockquote: {
      background: 'var(--vscode-input-background)',
      text: 'var(--vscode-descriptionForeground)',
      border: 'var(--vscode-panel-border)',
    },

    // Checkbox colors
    checkbox: {
      border: 'var(--vscode-checkbox-border)',
      background: 'var(--vscode-checkbox-background)',
      checkedBackground: 'var(--vscode-checkbox-background)',
      checkedBorder: 'var(--vscode-focusBorder)',
      checkmark: 'var(--vscode-checkbox-foreground)',
    },

    // Editor UI
    editor: {
      background: 'var(--vscode-editor-background)',
      foreground: 'var(--vscode-editor-foreground)',
      selection: 'var(--vscode-editor-selectionBackground)',
      activeLine: 'var(--vscode-editor-lineHighlightBackground)',
      cursor: 'var(--vscode-editorCursor-foreground)',
      lineNumber: 'var(--vscode-editorLineNumber-foreground)',
      activeLineNumber: 'var(--vscode-editorLineNumber-activeForeground)',
    },

    // Links
    link: {
      default: 'var(--vscode-textLink-foreground)',
      hover: 'var(--vscode-textLink-activeForeground)',
    },

    // Headings
    heading: {
      color: 'var(--vscode-editor-foreground)',
    },

    // Focus
    focus: {
      outline: 'var(--vscode-focusBorder)',
    },

    // GitHub Alerts/Admonitions
    // These use semantic colors that adapt to the theme
    alert: {
      note: {
        background: 'var(--vscode-editorInfo-background)',
        border: 'var(--vscode-editorInfo-foreground)',
        icon: 'var(--vscode-editorInfo-foreground)',
      },
      tip: {
        background: 'var(--vscode-terminal-ansiGreen)',
        border: 'var(--vscode-terminal-ansiGreen)',
        icon: 'var(--vscode-terminal-ansiGreen)',
      },
      important: {
        background: 'var(--vscode-terminal-ansiMagenta)',
        border: 'var(--vscode-terminal-ansiMagenta)',
        icon: 'var(--vscode-terminal-ansiMagenta)',
      },
      warning: {
        background: 'var(--vscode-editorWarning-background)',
        border: 'var(--vscode-editorWarning-foreground)',
        icon: 'var(--vscode-editorWarning-foreground)',
      },
      caution: {
        background: 'var(--vscode-editorError-background)',
        border: 'var(--vscode-editorError-foreground)',
        icon: 'var(--vscode-editorError-foreground)',
      },
    },
  },
};
