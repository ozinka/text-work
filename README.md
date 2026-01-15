# Text Work

Do you work with text a lot? Do you want to highlight even txt files? This extension provides custom highlighting and productivity tools for `.txt` files (and `text-work` language).

![Example](imgs/example.webp)

## Features

### 1. Custom Highlighting
Provides rich syntax highlighting for `.txt` files, treating them as `text-work` language.
- **Keywords**: `status`, `error`, `run`, `if`, `else`, `install`, `cp`, `mv`, `tf`, `npm`, `npx`, `python`, `terraform`, `echo`, `git`, `ssh` and much more.
- **Colors**: `violet`, `red`, `green`, `yellow`, `blue`.
- **UUIDs**: Automatically highlights UUIDs.
- **Tags**: Highlights `@tags`.  
- **Emails & URLs**: Highlights email addresses and web links (`http://`, `https://`).
- **Abbreviations**: Highlights uppercase abbreviations (e.g., `ABC`, `API`) and words with underscores (e.g., `SN_Global_Support`).

### 2. Autobullet Lists
Automatically manages lists when you press `Enter`:
- **Standard Bullets**: `*`, `-`, `•`, `▪`, `▫`, `◦`, `‣`, `⁃` (converts `*` to `•`)
- **Numbering**: `1.`, `2.` (increments numbers)
- **Letters**: `a.`, `b.` (increments letters)
- **Roman Numerals**: `i.`, `ii.` (increments roman numerals)
- **Indentation**: Maintains indentation and supports nested lists.
- Pressing `Enter` on an empty list item clears the line.

### 3. Section divider with Date/Time Insertion
- **Alt+Enter**: Insert current date/time separator line *after* the cursor.
- **Shift+Alt+Enter**: Insert current date/time separator line *before* the cursor.
## Example
`--- ✄ --------- 2026.01.06 14:06 -------------------`

### 4. Mask Passwords
Password masking works by replacing characters with asterisks using a custom font. This requires installing a font family that renders bold text as asterisks. The extension automatically applies a bold style to any word followed by `@pass`, which triggers the custom font to mask the password.
- Add `@pass` after a word to mask it (e.g. `mySecret @pass`).
- **Note**: PasswordMask fonts must be installed from the [fonts folder](https://github.com/ozinka/vs-text-work/tree/main/fonts). Install at least:
  - `PasswordMask-Regular.ttf`
  - `PasswordMask-Bold.ttf`

## Usage

1. Open any `.txt` file.
2. The language mode should automatically switch to `text-work` (or you can select it manually).
3. Enjoy the highlighting and productivity features!

## Release Notes

### 0.0.12
- Add support for browser mode.
- Refactoring highlight rules.

### 0.0.11
- Refactored color highlighting code.
- Changed colors, brightness of some colors where decreased.

### 0.0.3
- Added support for Roman numeral and Letter based lists.
- Expanded keyword and color highlighting.
- General improvements and bug fixes.

### 0.0.1
Initial release with highlighting, autobullet, and date/time insertion features.
