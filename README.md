# Ozi Highlighting

Custom highlighting and productivity tools for `.txt` files (and `ozi-work` language).

## Features

### 1. Custom Highlighting
Provides rich syntax highlighting for `.txt` files, treating them as `ozi-work` language.
- **Keywords**: `status`, `error`, `violet`, `run`, `if`, `else`, `install`, `cp`, `mv`, `tf`, `npm`, `npx`.
- **UUIDs**: Automatically highlights UUIDs.
- **Dates**: Highlights date patterns.
- **Booleans**: Highlights `true`, `false`, `ok`, `fail`, etc.
- **Tags**: Highlights `@tags`.
- **Emails & URLs**: Highlights email addresses and web links (`http://`, `https://`).
- **Abbreviations**: Highlights uppercase abbreviations (e.g., `ABC`, `API`) and words with underscores (e.g., `SN_Global_Support`).

### 2. Autobullet Lists
Automatically manages lists when you press `Enter`:
- `* text` -> `• text` (converts `*` to `•`)
- `• text` -> continues with `• `
- `- text` -> continues with `- `
- `1. text` -> continues with `2. ` (increments numbers)
- Pressing `Enter` on an empty list item clears the line.

### 3. Date/Time Insertion
- **Alt+Enter**: Insert current date/time separator line *after* the cursor.
- **Shift+Alt+Enter**: Insert current date/time separator line *before* the cursor.

## Usage

1. Open any `.txt` file.
2. The language mode should automatically switch to `ozi-work` (or you can select it manually).
3. Enjoy the highlighting and productivity features!

## Extension Settings

This extension contributes the following settings:

*   `editor.tokenColorCustomizations`: Customizes colors for specific syntax tokens.
*   `editor.semanticTokenColorCustomizations`: Customizes semantic token colors.

## Release Notes

### 0.0.1
Initial release with highlighting, autobullet, and date/time insertion features.
