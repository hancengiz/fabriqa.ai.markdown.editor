/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./webview/**/*.{ts,html}",
        "./src/providers/MarkdownEditorProvider.ts"
    ],
    theme: {
        extend: {
            colors: {
                'editor-background': 'var(--vscode-editor-background)',
                'editor-foreground': 'var(--vscode-editor-foreground)',
                'primary': 'var(--vscode-button-background)',
                'primary-foreground': 'var(--vscode-button-foreground)',
                'primary-hover': 'var(--vscode-button-hoverBackground)',
                'secondary': 'var(--vscode-button-secondaryBackground)',
                'secondary-foreground': 'var(--vscode-button-secondaryForeground)',
                'dropdown': 'var(--vscode-dropdown-background)',
                'code-background': 'var(--vscode-textCodeBlock-background)',
                'code-foreground': 'var(--vscode-editor-foreground)',
            }
        },
    },
    plugins: [],
}
