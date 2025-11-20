# Task: Code Block Styling Improvements

## Overview
Improve the visual styling of code blocks across all editor modes (Live Preview, Source, and Reading Mode) to ensure better readability and consistency with VS Code themes.

## Current Status
- ✅ **FIXED**: Reading Mode code blocks now use `--bgColor-neutral-muted` (maps to `--vscode-textCodeBlock-background`)
- ✅ **FIXED**: Reading Mode table alternating rows now use `--bgColor-neutral-muted` for better contrast
- ⏳ **PENDING**: Verify styling works well in both light and dark VS Code themes
- ⏳ **PENDING**: Consider syntax highlighting for code blocks in Reading Mode

## Problem Statement
Previously, code blocks in Reading Mode used `--bgColor-muted` which resolved to dark/black backgrounds in some VS Code themes, making code difficult to read. Users requested light gray backgrounds for better readability.

## Solution Implemented
Changed background colors to use `--bgColor-neutral-muted` which:
- Maps to VS Code's `--vscode-textCodeBlock-background`
- Automatically adapts to light/dark themes
- Provides better contrast for code readability

## Files Modified
- `/webview/editors/readingMode.ts` (lines 723, 884)
  - Changed table row alternating background
  - Changed pre/code block background

## Testing Checklist
- [ ] Test in VS Code Light theme - verify code blocks have light gray background
- [ ] Test in VS Code Dark theme - verify code blocks have appropriate dark background
- [ ] Test in VS Code High Contrast themes - verify readability
- [ ] Test table rendering with alternating row colors
- [ ] Test inline code blocks (`` `code` ``)
- [ ] Test fenced code blocks (` ```language\ncode\n``` `)
- [ ] Verify Live Preview mode code block styling
- [ ] Verify Source mode code block styling

## Future Enhancements
1. **Syntax Highlighting in Reading Mode**
   - Consider adding syntax highlighting using a library like Prism.js or highlight.js
   - Maintain theme consistency with VS Code's syntax colors

2. **Code Block Features**
   - Copy to clipboard button
   - Line numbers
   - Language label display
   - Expand/collapse for long code blocks

3. **Live Preview Enhancements**
   - Ensure code blocks have consistent styling with Reading Mode
   - Consider adding language hints/labels

## Related Issues
- User reported: "I want you to use light gray background for code blocks for live and reading mode not black"
- User feedback: "you see these are not readable" (referring to dark table rows)

## Notes
- The fix uses theme-aware CSS variables, so it automatically adapts to the user's chosen VS Code theme
- `--vscode-textCodeBlock-background` is the recommended VS Code variable for code backgrounds
- No hardcoded colors were used to maintain theme compatibility
