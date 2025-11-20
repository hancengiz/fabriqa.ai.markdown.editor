import { ViewPlugin, EditorView } from '@codemirror/view';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import mermaid from 'mermaid';

/**
 * Reading Mode Plugin
 * Renders markdown as HTML (read-only view)
 */
export const readingModePlugin = ViewPlugin.fromClass(
  class {
    private htmlContainer: HTMLDivElement | null = null;
    private view: EditorView | null = null;
    private mermaidInitialized = false;

    constructor(view: EditorView) {
      this.view = view;
      this.initMermaid();
      this.renderHTML(view);
    }

    /**
     * Initialize Mermaid (always use light theme)
     */
    initMermaid() {
      if (this.mermaidInitialized) return;

      // Always use light theme (extension only supports light theme)
      mermaid.initialize({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      });

      this.mermaidInitialized = true;
    }

    update(update: any) {
      if (update.docChanged) {
        this.renderHTML(update.view);
      }
    }

    destroy() {
      // Restore CodeMirror content visibility
      if (this.view) {
        const cmContent = this.view.dom.querySelector('.cm-content');
        if (cmContent) {
          (cmContent as HTMLElement).style.display = '';
        }

        // Restore parent element styles
        const parentElement = this.view.dom as HTMLElement;
        parentElement.style.position = '';
        parentElement.style.width = '';
        parentElement.style.height = '';
      }

      // Remove HTML container
      if (this.htmlContainer) {
        this.htmlContainer.remove();
        this.htmlContainer = null;
      }

      this.view = null;
    }

    renderHTML(view: EditorView) {
      const markdown = view.state.doc.toString();

      try {
        // Convert markdown to HTML
        const rawHtml = marked.parse(markdown) as string;

        // Sanitize HTML to prevent XSS (allow input for checkboxes)
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'p', 'br', 'strong', 'em', 'u', 's',
            'a', 'ul', 'ol', 'li',
            'blockquote', 'code', 'pre',
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            'img', 'hr', 'input'
          ],
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'type', 'checked', 'disabled']
        });

        // Create or update HTML container
        if (!this.htmlContainer) {
          this.htmlContainer = document.createElement('div');
          this.htmlContainer.className = 'reading-mode-content';

          // Ensure parent container has proper positioning and sizing
          const parentElement = view.dom as HTMLElement;
          parentElement.style.position = 'relative';
          parentElement.style.width = '100%';
          parentElement.style.height = '100%';

          // Apply markdown-preview-enhanced styling
          const style = document.createElement('style');
          style.textContent = `
.reading-mode-content {
  --base-size-4: 0.25rem;
  --base-size-8: 0.5rem;
  --base-size-16: 1rem;
  --base-size-24: 1.5rem;
  --base-size-40: 2.5rem;
  --base-text-weight-normal: 400;
  --base-text-weight-medium: 500;
  --base-text-weight-semibold: 600;
  --fontStack-monospace: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;

  /* VS Code theme-aware colors - automatically adapt to light/dark */
  --fgColor-default: var(--vscode-editor-foreground);
  --fgColor-muted: var(--vscode-descriptionForeground);
  --fgColor-accent: var(--vscode-textLink-foreground);
  --fgColor-success: var(--vscode-testing-iconPassed, #1a7f37);
  --fgColor-attention: var(--vscode-editorWarning-foreground, #9a6700);
  --fgColor-danger: var(--vscode-errorForeground);
  --fgColor-done: var(--vscode-textLink-activeForeground);
  --bgColor-default: var(--vscode-editor-background);
  --bgColor-muted: var(--vscode-textBlockQuote-background, var(--vscode-editor-inactiveSelectionBackground));
  --bgColor-neutral-muted: var(--vscode-textCodeBlock-background);
  --bgColor-attention-muted: var(--vscode-inputValidation-warningBackground, #fff8c5);
  --borderColor-default: var(--vscode-editorWidget-border);
  --borderColor-muted: var(--vscode-widget-border);
  --borderColor-neutral-muted: var(--vscode-widget-border);
  --borderColor-accent-emphasis: var(--vscode-textLink-foreground);
  --borderColor-success-emphasis: var(--vscode-testing-iconPassed, #1a7f37);
  --borderColor-attention-emphasis: var(--vscode-editorWarning-foreground, #9a6700);
  --borderColor-danger-emphasis: var(--vscode-errorForeground);
  --borderColor-done-emphasis: var(--vscode-textLink-activeForeground);
  --focus-outlineColor: var(--vscode-focusBorder);
  --color-prettylights-syntax-comment: var(--vscode-descriptionForeground);
  --color-prettylights-syntax-constant: var(--vscode-symbolIcon-constantForeground, var(--vscode-textLink-foreground));
  --color-prettylights-syntax-constant-other-reference-link: var(--vscode-textLink-foreground);
  --color-prettylights-syntax-entity: var(--vscode-symbolIcon-classForeground, var(--vscode-textLink-foreground));
  --color-prettylights-syntax-storage-modifier-import: var(--vscode-editor-foreground);
  --color-prettylights-syntax-entity-tag: var(--vscode-symbolIcon-functionForeground, var(--vscode-textLink-foreground));
  --color-prettylights-syntax-keyword: var(--vscode-symbolIcon-keywordForeground, var(--vscode-errorForeground));
  --color-prettylights-syntax-string: var(--vscode-symbolIcon-stringForeground, var(--vscode-textLink-foreground));
  --color-prettylights-syntax-variable: var(--vscode-symbolIcon-variableForeground, var(--vscode-editor-foreground));
  --color-prettylights-syntax-brackethighlighter-unmatched: var(--vscode-errorForeground);
  --color-prettylights-syntax-brackethighlighter-angle: var(--vscode-descriptionForeground);
  --color-prettylights-syntax-invalid-illegal-text: var(--vscode-editor-background);
  --color-prettylights-syntax-invalid-illegal-bg: var(--vscode-errorForeground);
  --color-prettylights-syntax-carriage-return-text: var(--vscode-editor-background);
  --color-prettylights-syntax-carriage-return-bg: var(--vscode-errorForeground);
  --color-prettylights-syntax-string-regexp: var(--vscode-symbolIcon-stringForeground, var(--vscode-testing-iconPassed, #1a7f37));
  --color-prettylights-syntax-markup-list: var(--vscode-editor-foreground);
  --color-prettylights-syntax-markup-heading: var(--vscode-textLink-foreground);
  --color-prettylights-syntax-markup-italic: var(--vscode-editor-foreground);
  --color-prettylights-syntax-markup-bold: var(--vscode-editor-foreground);
  --color-prettylights-syntax-markup-deleted-text: var(--vscode-errorForeground);
  --color-prettylights-syntax-markup-deleted-bg: var(--vscode-inputValidation-errorBackground);
  --color-prettylights-syntax-markup-inserted-text: var(--vscode-testing-iconPassed, #1a7f37);
  --color-prettylights-syntax-markup-inserted-bg: var(--vscode-diffEditor-insertedTextBackground);
  --color-prettylights-syntax-markup-changed-text: var(--vscode-editorWarning-foreground, #9a6700);
  --color-prettylights-syntax-markup-changed-bg: var(--vscode-inputValidation-warningBackground);
  --color-prettylights-syntax-markup-ignored-text: var(--vscode-descriptionForeground);
  --color-prettylights-syntax-markup-ignored-bg: var(--vscode-textCodeBlock-background);
  --color-prettylights-syntax-meta-diff-range: var(--vscode-textLink-activeForeground);
  --color-prettylights-syntax-sublimelinter-gutter-mark: var(--vscode-editorLineNumber-foreground);
}

.reading-mode-content {
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  margin: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px 32px;
  overflow: auto;
  box-sizing: border-box;
  color: var(--fgColor-default);
  background-color: var(--bgColor-default);
  font-family: -apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif,"Apple Color Emoji","Segoe UI Emoji";
  font-size: 16px;
  line-height: 1.5;
  word-wrap: break-word;
}

.reading-mode-content .octicon {
  display: inline-block;
  fill: currentColor;
  vertical-align: text-bottom;
}

.reading-mode-content h1:hover .anchor .octicon-link:before,
.reading-mode-content h2:hover .anchor .octicon-link:before,
.reading-mode-content h3:hover .anchor .octicon-link:before,
.reading-mode-content h4:hover .anchor .octicon-link:before,
.reading-mode-content h5:hover .anchor .octicon-link:before,
.reading-mode-content h6:hover .anchor .octicon-link:before {
  width: 16px;
  height: 16px;
  content: ' ';
  display: inline-block;
  background-color: currentColor;
  -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
  mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' version='1.1' aria-hidden='true'><path fill-rule='evenodd' d='M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-4.69 9.64a2 2 0 010-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25a.75.75 0 00-1.06-1.06l-1.25 1.25a2 2 0 01-2.83 0z'></path></svg>");
}

.reading-mode-content details,
.reading-mode-content figcaption,
.reading-mode-content figure {
  display: block;
}

.reading-mode-content summary {
  display: list-item;
}

.reading-mode-content [hidden] {
  display: none !important;
}

.reading-mode-content a {
  background-color: transparent;
  color: var(--fgColor-accent);
  text-decoration: none;
}

.reading-mode-content abbr[title] {
  border-bottom: none;
  -webkit-text-decoration: underline dotted;
  text-decoration: underline dotted;
}

.reading-mode-content b,
.reading-mode-content strong {
  font-weight: var(--base-text-weight-semibold, 600);
}

.reading-mode-content dfn {
  font-style: italic;
}

.reading-mode-content h1 {
  margin: .67em 0;
  font-weight: var(--base-text-weight-semibold, 600);
  padding-bottom: .3em;
  font-size: 2em;
  border-bottom: 1px solid var(--borderColor-muted);
}

.reading-mode-content mark {
  background-color: var(--bgColor-attention-muted);
  color: var(--fgColor-default);
}

.reading-mode-content small {
  font-size: 90%;
}

.reading-mode-content sub,
.reading-mode-content sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}

.reading-mode-content sub {
  bottom: -0.25em;
}

.reading-mode-content sup {
  top: -0.5em;
}

.reading-mode-content img {
  border-style: none;
  max-width: 100%;
  box-sizing: content-box;
}

.reading-mode-content code,
.reading-mode-content kbd,
.reading-mode-content pre,
.reading-mode-content samp {
  font-family: monospace;
  font-size: 1em;
}

.reading-mode-content figure {
  margin: 1em var(--base-size-40);
}

.reading-mode-content hr {
  box-sizing: content-box;
  overflow: hidden;
  background: transparent;
  border-bottom: 1px solid var(--borderColor-muted);
  height: .25em;
  padding: 0;
  margin: var(--base-size-24) 0;
  background-color: var(--borderColor-default);
  border: 0;
}

.reading-mode-content input {
  font: inherit;
  margin: 0;
  overflow: visible;
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

.reading-mode-content [type=button],
.reading-mode-content [type=reset],
.reading-mode-content [type=submit] {
  -webkit-appearance: button;
  appearance: button;
}

.reading-mode-content [type=checkbox],
.reading-mode-content [type=radio] {
  box-sizing: border-box;
  padding: 0;
}

.reading-mode-content [type=number]::-webkit-inner-spin-button,
.reading-mode-content [type=number]::-webkit-outer-spin-button {
  height: auto;
}

.reading-mode-content [type=search]::-webkit-search-cancel-button,
.reading-mode-content [type=search]::-webkit-search-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.reading-mode-content ::-webkit-input-placeholder {
  color: inherit;
  opacity: .54;
}

.reading-mode-content ::-webkit-file-upload-button {
  -webkit-appearance: button;
  appearance: button;
  font: inherit;
}

.reading-mode-content a:hover {
  text-decoration: underline;
}

.reading-mode-content ::placeholder {
  color: var(--fgColor-muted);
  opacity: 1;
}

.reading-mode-content hr::before {
  display: table;
  content: "";
}

.reading-mode-content hr::after {
  display: table;
  clear: both;
  content: "";
}

.reading-mode-content table {
  border-spacing: 0;
  border-collapse: collapse;
  display: block;
  width: max-content;
  max-width: 100%;
  overflow: auto;
  font-variant: tabular-nums;
}

.reading-mode-content td,
.reading-mode-content th {
  padding: 0;
}

.reading-mode-content details summary {
  cursor: pointer;
}

.reading-mode-content a:focus,
.reading-mode-content [role=button]:focus,
.reading-mode-content input[type=radio]:focus,
.reading-mode-content input[type=checkbox]:focus {
  outline: 2px solid var(--focus-outlineColor);
  outline-offset: -2px;
  box-shadow: none;
}

.reading-mode-content a:focus:not(:focus-visible),
.reading-mode-content [role=button]:focus:not(:focus-visible),
.reading-mode-content input[type=radio]:focus:not(:focus-visible),
.reading-mode-content input[type=checkbox]:focus:not(:focus-visible) {
  outline: solid 1px transparent;
}

.reading-mode-content a:focus-visible,
.reading-mode-content [role=button]:focus-visible,
.reading-mode-content input[type=radio]:focus-visible,
.reading-mode-content input[type=checkbox]:focus-visible {
  outline: 2px solid var(--focus-outlineColor);
  outline-offset: -2px;
  box-shadow: none;
}

.reading-mode-content a:not([class]):focus,
.reading-mode-content a:not([class]):focus-visible,
.reading-mode-content input[type=radio]:focus,
.reading-mode-content input[type=radio]:focus-visible,
.reading-mode-content input[type=checkbox]:focus,
.reading-mode-content input[type=checkbox]:focus-visible {
  outline-offset: 0;
}

.reading-mode-content kbd {
  display: inline-block;
  padding: var(--base-size-4);
  font: 11px var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
  line-height: 10px;
  color: var(--fgColor-default);
  vertical-align: middle;
  background-color: var(--bgColor-muted);
  border: solid 1px var(--borderColor-neutral-muted);
  border-bottom-color: var(--borderColor-neutral-muted);
  border-radius: 6px;
  box-shadow: inset 0 -1px 0 var(--borderColor-neutral-muted);
}

.reading-mode-content h1,
.reading-mode-content h2,
.reading-mode-content h3,
.reading-mode-content h4,
.reading-mode-content h5,
.reading-mode-content h6 {
  margin-top: var(--base-size-24);
  margin-bottom: var(--base-size-16);
  font-weight: var(--base-text-weight-semibold, 600);
  line-height: 1.25;
}

.reading-mode-content h2 {
  font-weight: var(--base-text-weight-semibold, 600);
  padding-bottom: .3em;
  font-size: 1.5em;
  border-bottom: 1px solid var(--borderColor-muted);
}

.reading-mode-content h3 {
  font-weight: var(--base-text-weight-semibold, 600);
  font-size: 1.25em;
}

.reading-mode-content h4 {
  font-weight: var(--base-text-weight-semibold, 600);
  font-size: 1em;
}

.reading-mode-content h5 {
  font-weight: var(--base-text-weight-semibold, 600);
  font-size: .875em;
}

.reading-mode-content h6 {
  font-weight: var(--base-text-weight-semibold, 600);
  font-size: .85em;
  color: var(--fgColor-muted);
}

.reading-mode-content p {
  margin-top: 0;
  margin-bottom: 10px;
}

.reading-mode-content blockquote {
  margin: 0;
  padding: 0 1em;
  color: var(--fgColor-muted);
  border-left: .25em solid var(--borderColor-default);
}

.reading-mode-content ul,
.reading-mode-content ol {
  margin-top: 0;
  margin-bottom: 0;
  padding-left: 2em;
}

.reading-mode-content ol ol,
.reading-mode-content ul ol {
  list-style-type: lower-roman;
}

.reading-mode-content ul ul ol,
.reading-mode-content ul ol ol,
.reading-mode-content ol ul ol,
.reading-mode-content ol ol ol {
  list-style-type: lower-alpha;
}

.reading-mode-content dd {
  margin-left: 0;
}

.reading-mode-content tt,
.reading-mode-content code,
.reading-mode-content samp {
  font-family: var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
  font-size: 12px;
}

.reading-mode-content pre {
  margin-top: 0;
  margin-bottom: 0;
  font-family: var(--fontStack-monospace, ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace);
  font-size: 12px;
  word-wrap: normal;
}

.reading-mode-content .octicon {
  display: inline-block;
  overflow: visible !important;
  vertical-align: text-bottom;
  fill: currentColor;
}

.reading-mode-content input::-webkit-outer-spin-button,
.reading-mode-content input::-webkit-inner-spin-button {
  margin: 0;
  appearance: none;
}

.reading-mode-content .mr-2 {
  margin-right: var(--base-size-8, 8px) !important;
}

.reading-mode-content::before {
  display: table;
  content: "";
}

.reading-mode-content::after {
  display: table;
  clear: both;
  content: "";
}

.reading-mode-content>*:first-child {
  margin-top: 0 !important;
}

.reading-mode-content>*:last-child {
  margin-bottom: 0 !important;
}

.reading-mode-content a:not([href]) {
  color: inherit;
  text-decoration: none;
}

.reading-mode-content .absent {
  color: var(--fgColor-danger);
}

.reading-mode-content .anchor {
  float: left;
  padding-right: var(--base-size-4);
  margin-left: -20px;
  line-height: 1;
}

.reading-mode-content .anchor:focus {
  outline: none;
}

.reading-mode-content p,
.reading-mode-content blockquote,
.reading-mode-content ul,
.reading-mode-content ol,
.reading-mode-content dl,
.reading-mode-content table,
.reading-mode-content pre,
.reading-mode-content details {
  margin-top: 0;
  margin-bottom: var(--base-size-16);
}

.reading-mode-content blockquote>:first-child {
  margin-top: 0;
}

.reading-mode-content blockquote>:last-child {
  margin-bottom: 0;
}

.reading-mode-content h1 .octicon-link,
.reading-mode-content h2 .octicon-link,
.reading-mode-content h3 .octicon-link,
.reading-mode-content h4 .octicon-link,
.reading-mode-content h5 .octicon-link,
.reading-mode-content h6 .octicon-link {
  color: var(--fgColor-default);
  vertical-align: middle;
  visibility: hidden;
}

.reading-mode-content h1:hover .anchor,
.reading-mode-content h2:hover .anchor,
.reading-mode-content h3:hover .anchor,
.reading-mode-content h4:hover .anchor,
.reading-mode-content h5:hover .anchor,
.reading-mode-content h6:hover .anchor {
  text-decoration: none;
}

.reading-mode-content h1:hover .anchor .octicon-link,
.reading-mode-content h2:hover .anchor .octicon-link,
.reading-mode-content h3:hover .anchor .octicon-link,
.reading-mode-content h4:hover .anchor .octicon-link,
.reading-mode-content h5:hover .anchor .octicon-link,
.reading-mode-content h6:hover .anchor .octicon-link {
  visibility: visible;
}

.reading-mode-content h1 tt,
.reading-mode-content h1 code,
.reading-mode-content h2 tt,
.reading-mode-content h2 code,
.reading-mode-content h3 tt,
.reading-mode-content h3 code,
.reading-mode-content h4 tt,
.reading-mode-content h4 code,
.reading-mode-content h5 tt,
.reading-mode-content h5 code,
.reading-mode-content h6 tt,
.reading-mode-content h6 code {
  padding: 0 .2em;
  font-size: inherit;
}

.reading-mode-content summary h1,
.reading-mode-content summary h2,
.reading-mode-content summary h3,
.reading-mode-content summary h4,
.reading-mode-content summary h5,
.reading-mode-content summary h6 {
  display: inline-block;
}

.reading-mode-content summary h1 .anchor,
.reading-mode-content summary h2 .anchor,
.reading-mode-content summary h3 .anchor,
.reading-mode-content summary h4 .anchor,
.reading-mode-content summary h5 .anchor,
.reading-mode-content summary h6 .anchor {
  margin-left: -40px;
}

.reading-mode-content summary h1,
.reading-mode-content summary h2 {
  padding-bottom: 0;
  border-bottom: 0;
}

.reading-mode-content ul.no-list,
.reading-mode-content ol.no-list {
  padding: 0;
  list-style-type: none;
}

.reading-mode-content ol[type="a s"] {
  list-style-type: lower-alpha;
}

.reading-mode-content ol[type="A s"] {
  list-style-type: upper-alpha;
}

.reading-mode-content ol[type="i s"] {
  list-style-type: lower-roman;
}

.reading-mode-content ol[type="I s"] {
  list-style-type: upper-roman;
}

.reading-mode-content ol[type="1"] {
  list-style-type: decimal;
}

.reading-mode-content div>ol:not([type]) {
  list-style-type: decimal;
}

.reading-mode-content ul ul,
.reading-mode-content ul ol,
.reading-mode-content ol ol,
.reading-mode-content ol ul {
  margin-top: 0;
  margin-bottom: 0;
}

.reading-mode-content li>p {
  margin-top: var(--base-size-16);
}

.reading-mode-content li+li {
  margin-top: .25em;
}

.reading-mode-content dl {
  padding: 0;
}

.reading-mode-content dl dt {
  padding: 0;
  margin-top: var(--base-size-16);
  font-size: 1em;
  font-style: italic;
  font-weight: var(--base-text-weight-semibold, 600);
}

.reading-mode-content dl dd {
  padding: 0 var(--base-size-16);
  margin-bottom: var(--base-size-16);
}

.reading-mode-content table th {
  font-weight: var(--base-text-weight-semibold, 600);
}

.reading-mode-content table th,
.reading-mode-content table td {
  padding: 6px 13px;
  border: 1px solid var(--borderColor-default);
}

.reading-mode-content table td>:last-child {
  margin-bottom: 0;
}

.reading-mode-content table tr {
  background-color: var(--bgColor-default);
  border-top: 1px solid var(--borderColor-muted);
}

.reading-mode-content table tr:nth-child(2n) {
  background-color: var(--bgColor-neutral-muted);
}

.reading-mode-content table img {
  background-color: transparent;
}

.reading-mode-content img[align=right] {
  padding-left: 20px;
}

.reading-mode-content img[align=left] {
  padding-right: 20px;
}

.reading-mode-content .emoji {
  max-width: none;
  vertical-align: text-top;
  background-color: transparent;
}

.reading-mode-content span.frame {
  display: block;
  overflow: hidden;
}

.reading-mode-content span.frame>span {
  display: block;
  float: left;
  width: auto;
  padding: 7px;
  margin: 13px 0 0;
  overflow: hidden;
  border: 1px solid var(--borderColor-default);
}

.reading-mode-content span.frame span img {
  display: block;
  float: left;
}

.reading-mode-content span.frame span span {
  display: block;
  padding: 5px 0 0;
  clear: both;
  color: var(--fgColor-default);
}

.reading-mode-content span.align-center {
  display: block;
  overflow: hidden;
  clear: both;
}

.reading-mode-content span.align-center>span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: center;
}

.reading-mode-content span.align-center span img {
  margin: 0 auto;
  text-align: center;
}

.reading-mode-content span.align-right {
  display: block;
  overflow: hidden;
  clear: both;
}

.reading-mode-content span.align-right>span {
  display: block;
  margin: 13px 0 0;
  overflow: hidden;
  text-align: right;
}

.reading-mode-content span.align-right span img {
  margin: 0;
  text-align: right;
}

.reading-mode-content span.float-left {
  display: block;
  float: left;
  margin-right: 13px;
  overflow: hidden;
}

.reading-mode-content span.float-left span {
  margin: 13px 0 0;
}

.reading-mode-content span.float-right {
  display: block;
  float: right;
  margin-left: 13px;
  overflow: hidden;
}

.reading-mode-content span.float-right>span {
  display: block;
  margin: 13px auto 0;
  overflow: hidden;
  text-align: right;
}

.reading-mode-content code,
.reading-mode-content tt {
  padding: .2em .4em;
  margin: 0;
  font-size: 85%;
  white-space: break-spaces;
  background-color: var(--bgColor-neutral-muted);
  border-radius: 6px;
}

.reading-mode-content code br,
.reading-mode-content tt br {
  display: none;
}

.reading-mode-content del code {
  text-decoration: inherit;
}

.reading-mode-content samp {
  font-size: 85%;
}

.reading-mode-content pre code {
  font-size: 100%;
}

.reading-mode-content pre>code {
  padding: 0;
  margin: 0;
  word-break: normal;
  white-space: pre;
  background: transparent;
  border: 0;
}

.reading-mode-content .highlight {
  margin-bottom: var(--base-size-16);
}

.reading-mode-content .highlight pre {
  margin-bottom: 0;
  word-break: normal;
}

.reading-mode-content .highlight pre,
.reading-mode-content pre {
  padding: var(--base-size-16);
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  color: var(--fgColor-default);
  background-color: var(--bgColor-neutral-muted);
  border-radius: 6px;
}

.reading-mode-content pre code,
.reading-mode-content pre tt {
  display: inline;
  max-width: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  line-height: inherit;
  word-wrap: normal;
  background-color: transparent;
  border: 0;
}

.reading-mode-content .csv-data td,
.reading-mode-content .csv-data th {
  padding: 5px;
  overflow: hidden;
  font-size: 12px;
  line-height: 1;
  text-align: left;
  white-space: nowrap;
}

.reading-mode-content .csv-data .blob-num {
  padding: 10px var(--base-size-8) 9px;
  text-align: right;
  background: var(--bgColor-default);
  border: 0;
}

.reading-mode-content .csv-data tr {
  border-top: 0;
}

.reading-mode-content .csv-data th {
  font-weight: var(--base-text-weight-semibold, 600);
  background: var(--bgColor-muted);
  border-top: 0;
}

.reading-mode-content [data-footnote-ref]::before {
  content: "[";
}

.reading-mode-content [data-footnote-ref]::after {
  content: "]";
}

.reading-mode-content .footnotes {
  font-size: 12px;
  color: var(--fgColor-muted);
  border-top: 1px solid var(--borderColor-default);
}

.reading-mode-content .footnotes ol {
  padding-left: var(--base-size-16);
}

.reading-mode-content .footnotes ol ul {
  display: inline-block;
  padding-left: var(--base-size-16);
  margin-top: var(--base-size-16);
}

.reading-mode-content .footnotes li {
  position: relative;
}

.reading-mode-content .footnotes li:target::before {
  position: absolute;
  top: calc(var(--base-size-8)*-1);
  right: calc(var(--base-size-8)*-1);
  bottom: calc(var(--base-size-8)*-1);
  left: calc(var(--base-size-24)*-1);
  pointer-events: none;
  content: "";
  border: 2px solid var(--borderColor-accent-emphasis);
  border-radius: 6px;
}

.reading-mode-content .footnotes li:target {
  color: var(--fgColor-default);
}

.reading-mode-content .footnotes .data-footnote-backref g-emoji {
  font-family: monospace;
}

.reading-mode-content body:has(:modal) {
  padding-right: var(--dialog-scrollgutter) !important;
}

.reading-mode-content .pl-c {
  color: var(--color-prettylights-syntax-comment);
}

.reading-mode-content .pl-c1,
.reading-mode-content .pl-s .pl-v {
  color: var(--color-prettylights-syntax-constant);
}

.reading-mode-content .pl-e,
.reading-mode-content .pl-en {
  color: var(--color-prettylights-syntax-entity);
}

.reading-mode-content .pl-smi,
.reading-mode-content .pl-s .pl-s1 {
  color: var(--color-prettylights-syntax-storage-modifier-import);
}

.reading-mode-content .pl-ent {
  color: var(--color-prettylights-syntax-entity-tag);
}

.reading-mode-content .pl-k {
  color: var(--color-prettylights-syntax-keyword);
}

.reading-mode-content .pl-s,
.reading-mode-content .pl-pds,
.reading-mode-content .pl-s .pl-pse .pl-s1,
.reading-mode-content .pl-sr,
.reading-mode-content .pl-sr .pl-cce,
.reading-mode-content .pl-sr .pl-sre,
.reading-mode-content .pl-sr .pl-sra {
  color: var(--color-prettylights-syntax-string);
}

.reading-mode-content .pl-v,
.reading-mode-content .pl-smw {
  color: var(--color-prettylights-syntax-variable);
}

.reading-mode-content .pl-bu {
  color: var(--color-prettylights-syntax-brackethighlighter-unmatched);
}

.reading-mode-content .pl-ii {
  color: var(--color-prettylights-syntax-invalid-illegal-text);
  background-color: var(--color-prettylights-syntax-invalid-illegal-bg);
}

.reading-mode-content .pl-c2 {
  color: var(--color-prettylights-syntax-carriage-return-text);
  background-color: var(--color-prettylights-syntax-carriage-return-bg);
}

.reading-mode-content .pl-sr .pl-cce {
  font-weight: bold;
  color: var(--color-prettylights-syntax-string-regexp);
}

.reading-mode-content .pl-ml {
  color: var(--color-prettylights-syntax-markup-list);
}

.reading-mode-content .pl-mh,
.reading-mode-content .pl-mh .pl-en,
.reading-mode-content .pl-ms {
  font-weight: bold;
  color: var(--color-prettylights-syntax-markup-heading);
}

.reading-mode-content .pl-mi {
  font-style: italic;
  color: var(--color-prettylights-syntax-markup-italic);
}

.reading-mode-content .pl-mb {
  font-weight: bold;
  color: var(--color-prettylights-syntax-markup-bold);
}

.reading-mode-content .pl-md {
  color: var(--color-prettylights-syntax-markup-deleted-text);
  background-color: var(--color-prettylights-syntax-markup-deleted-bg);
}

.reading-mode-content .pl-mi1 {
  color: var(--color-prettylights-syntax-markup-inserted-text);
  background-color: var(--color-prettylights-syntax-markup-inserted-bg);
}

.reading-mode-content .pl-mc {
  color: var(--color-prettylights-syntax-markup-changed-text);
  background-color: var(--color-prettylights-syntax-markup-changed-bg);
}

.reading-mode-content .pl-mi2 {
  color: var(--color-prettylights-syntax-markup-ignored-text);
  background-color: var(--color-prettylights-syntax-markup-ignored-bg);
}

.reading-mode-content .pl-mdr {
  font-weight: bold;
  color: var(--color-prettylights-syntax-meta-diff-range);
}

.reading-mode-content .pl-ba {
  color: var(--color-prettylights-syntax-brackethighlighter-angle);
}

.reading-mode-content .pl-sg {
  color: var(--color-prettylights-syntax-sublimelinter-gutter-mark);
}

.reading-mode-content .pl-corl {
  text-decoration: underline;
  color: var(--color-prettylights-syntax-constant-other-reference-link);
}

.reading-mode-content [role=button]:focus:not(:focus-visible),
.reading-mode-content [role=tabpanel][tabindex="0"]:focus:not(:focus-visible),
.reading-mode-content button:focus:not(:focus-visible),
.reading-mode-content summary:focus:not(:focus-visible),
.reading-mode-content a:focus:not(:focus-visible) {
  outline: none;
  box-shadow: none;
}

.reading-mode-content [tabindex="0"]:focus:not(:focus-visible),
.reading-mode-content details-dialog:focus:not(:focus-visible) {
  outline: none;
}

.reading-mode-content g-emoji {
  display: inline-block;
  min-width: 1ch;
  font-family: "Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol";
  font-size: 1em;
  font-style: normal !important;
  font-weight: var(--base-text-weight-normal, 400);
  line-height: 1;
  vertical-align: -0.075em;
}

.reading-mode-content g-emoji img {
  width: 1em;
  height: 1em;
}

.reading-mode-content .task-list-item {
  list-style-type: none;
}

.reading-mode-content .task-list-item label {
  font-weight: var(--base-text-weight-normal, 400);
}

.reading-mode-content .task-list-item.enabled label {
  cursor: pointer;
}

.reading-mode-content .task-list-item+.task-list-item {
  margin-top: var(--base-size-4);
}

.reading-mode-content .task-list-item .handle {
  display: none;
}

.reading-mode-content .task-list-item-checkbox {
  margin: 0 .5em .25em -1.4em;
  vertical-align: middle;
  appearance: none;
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid #d0d0d0;
  border-radius: 3px;
  background: #ffffff;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.reading-mode-content .task-list-item-checkbox:hover {
  border-color: #4d82f3;
}

.reading-mode-content .task-list-item-checkbox:checked {
  background-color: #4d82f3;
  border-color: #4d82f3;
}

.reading-mode-content .task-list-item-checkbox:checked::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid #ffffff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.reading-mode-content ul:dir(rtl) .task-list-item-checkbox {
  margin: 0 -1.6em .25em .5em;
}

.reading-mode-content ol:dir(rtl) .task-list-item-checkbox {
  margin: 0 -1.6em .25em .5em;
}

.reading-mode-content .contains-task-list:hover .task-list-item-convert-container,
.reading-mode-content .contains-task-list:focus-within .task-list-item-convert-container {
  display: block;
  width: auto;
  height: 24px;
  overflow: visible;
  clip: auto;
}

.reading-mode-content ::-webkit-calendar-picker-indicator {
  filter: invert(50%);
}

.reading-mode-content .markdown-alert {
  padding: var(--base-size-8) var(--base-size-16);
  margin-bottom: var(--base-size-16);
  color: inherit;
  border-left: .25em solid var(--borderColor-default);
}

.reading-mode-content .markdown-alert>:first-child {
  margin-top: 0;
}

.reading-mode-content .markdown-alert>:last-child {
  margin-bottom: 0;
}

.reading-mode-content .markdown-alert .markdown-alert-title {
  display: flex;
  font-weight: var(--base-text-weight-medium, 500);
  align-items: center;
  line-height: 1;
}

.reading-mode-content .markdown-alert.markdown-alert-note {
  border-left-color: var(--borderColor-accent-emphasis);
}

.reading-mode-content .markdown-alert.markdown-alert-note .markdown-alert-title {
  color: var(--fgColor-accent);
}

.reading-mode-content .markdown-alert.markdown-alert-important {
  border-left-color: var(--borderColor-done-emphasis);
}

.reading-mode-content .markdown-alert.markdown-alert-important .markdown-alert-title {
  color: var(--fgColor-done);
}

.reading-mode-content .markdown-alert.markdown-alert-warning {
  border-left-color: var(--borderColor-attention-emphasis);
}

.reading-mode-content .markdown-alert.markdown-alert-warning .markdown-alert-title {
  color: var(--fgColor-attention);
}

.reading-mode-content .markdown-alert.markdown-alert-tip {
  border-left-color: var(--borderColor-success-emphasis);
}

.reading-mode-content .markdown-alert.markdown-alert-tip .markdown-alert-title {
  color: var(--fgColor-success);
}

.reading-mode-content .markdown-alert.markdown-alert-caution {
  border-left-color: var(--borderColor-danger-emphasis);
}

.reading-mode-content .markdown-alert.markdown-alert-caution .markdown-alert-title {
  color: var(--fgColor-danger);
}

.reading-mode-content>*:first-child>.heading-element:first-child {
  margin-top: 0 !important;
}

.reading-mode-content .highlight pre:has(+.zeroclipboard-container) {
  min-height: 52px;
}

          `;
          document.head.appendChild(style);

          // Hide CodeMirror content
          const cmContent = view.dom.querySelector('.cm-content');
          if (cmContent) {
            (cmContent as HTMLElement).style.display = 'none';
          }

          // Append HTML container
          view.dom.appendChild(this.htmlContainer);
        }

        // Update content
        this.htmlContainer.innerHTML = cleanHtml;

        // Make checkboxes interactive
        this.setupCheckboxHandlers(view);

        // Make links clickable with Cmd/Ctrl+Click
        this.setupLinkHandlers(view);

        // Render Mermaid diagrams
        this.renderMermaidDiagrams();
      } catch (error) {
        console.error('Failed to render markdown:', error);
        if (this.htmlContainer) {
          this.htmlContainer.innerHTML = `
            <div style="color: #e51400; padding: 20px;">
              <strong>Error rendering markdown:</strong> ${error}
            </div>
          `;
        }
      }
    }

    /**
     * Setup click handlers for checkboxes in reading mode
     * Allows toggling task list items by clicking checkboxes
     */
    setupCheckboxHandlers(view: EditorView) {
      if (!this.htmlContainer) return;

      const checkboxes = this.htmlContainer.querySelectorAll('input[type="checkbox"]');

      checkboxes.forEach((checkbox, index) => {
        checkbox.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent default to handle manually

          const isChecked = (checkbox as HTMLInputElement).checked;
          const newChecked = !isChecked;

          // Find the checkbox in the markdown source
          const doc = view.state.doc;
          let checkboxCount = 0;

          for (let lineNum = 1; lineNum <= doc.lines; lineNum++) {
            const line = doc.line(lineNum);
            const lineText = line.text;

            // Check if this line has a checkbox (with or without list marker)
            // Support [ ], [], and [x] patterns
            if (lineText.match(/^(\s*)(?:[-*+]\s)?\[(?:\s|x|X|)\]/)) {
              if (checkboxCount === index) {
                // This is the checkbox we clicked
                const newLine = newChecked
                  ? lineText.replace(/\[(?:\s|)\]/, '[x]')
                  : lineText.replace(/\[x\]/i, '[ ]');

                view.dispatch({
                  changes: {
                    from: line.from,
                    to: line.to,
                    insert: newLine
                  }
                });
                return;
              }
              checkboxCount++;
            }
          }
        });
      });
    }

    /**
     * Setup click handlers for links in reading mode
     * Allows opening markdown files with Cmd/Ctrl+Click
     */
    setupLinkHandlers(view: EditorView) {
      if (!this.htmlContainer) return;

      const links = this.htmlContainer.querySelectorAll('a[href]');

      links.forEach((link) => {
        link.addEventListener('click', (e) => {
          const mouseEvent = e as MouseEvent;

          // Only handle Cmd/Ctrl+Click
          if (mouseEvent.metaKey || mouseEvent.ctrlKey) {
            e.preventDefault();
            e.stopPropagation();

            const href = (link as HTMLAnchorElement).getAttribute('href');
            if (href) {
              // Send message to VS Code to open the file
              const vscode = (window as any).acquireVsCodeApi?.() || (window as any).vscode;
              if (vscode) {
                vscode.postMessage({
                  type: 'openLink',
                  url: href
                });
              }
            }
          }
        });
      });
    }

    /**
     * Render Mermaid diagrams in reading mode
     * Finds code blocks with language-mermaid class and replaces them with rendered SVG
     */
    async renderMermaidDiagrams() {
      if (!this.htmlContainer) return;

      const mermaidBlocks = this.htmlContainer.querySelectorAll('pre code.language-mermaid');

      for (let i = 0; i < mermaidBlocks.length; i++) {
        const codeBlock = mermaidBlocks[i] as HTMLElement;
        const mermaidCode = codeBlock.textContent || '';
        const preElement = codeBlock.parentElement;

        if (!preElement) continue;

        try {
          // Generate unique ID for this diagram
          const diagramId = `mermaid-diagram-${Date.now()}-${i}`;

          // Render the diagram
          const { svg } = await mermaid.render(diagramId, mermaidCode);

          // Create a container for the diagram - fit content with max 75% width
          const container = document.createElement('div');
          container.className = 'mermaid-diagram-container';
          container.innerHTML = svg;
          container.style.cssText = `
            position: relative;
            border: 1px solid #d4d4d4;
            border-radius: 4px;
            padding: 16px;
            background: #ffffff;
            margin: 16px 0 16px 0;
            overflow: auto;
            width: fit-content;
            max-width: 75%;
            display: block;
          `;

          // Replace the pre element with the rendered diagram
          preElement.replaceWith(container);
        } catch (error) {
          // Show error in place of diagram
          console.error('Failed to render mermaid diagram:', error);

          const errorContainer = document.createElement('div');
          errorContainer.className = 'mermaid-error-container';
          errorContainer.style.cssText = `
            position: relative;
            border: 2px solid #e51400;
            border-radius: 4px;
            padding: 16px;
            background: #f2dede;
            margin: 16px 0;
          `;
          errorContainer.innerHTML = `
            <div style="color: #e51400; font-weight: bold; margin-bottom: 8px;">
              ⚠️ Mermaid Diagram Error
            </div>
            <div style="color: #e51400; font-size: 12px; font-family: monospace;">
              ${(error as Error).message || 'Invalid Mermaid syntax'}
            </div>
            <details style="margin-top: 12px;">
              <summary style="cursor: pointer; color: #717171;">
                View Code
              </summary>
              <pre style="margin-top: 8px; padding: 8px; background: #f3f3f3; border-radius: 3px; overflow: auto;"><code>${mermaidCode}</code></pre>
            </details>
          `;

          preElement.replaceWith(errorContainer);
        }
      }
    }
  }
);
