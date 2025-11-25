const vscode = require('vscode');

// --- Constants ---

const ROMAN_MAP = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
const ROMAN_VALUES = [
  { val: 1000, sym: 'm' }, { val: 900, sym: 'cm' }, { val: 500, sym: 'd' }, { val: 400, sym: 'cd' },
  { val: 100, sym: 'c' }, { val: 90, sym: 'xc' }, { val: 50, sym: 'l' }, { val: 40, sym: 'xl' },
  { val: 10, sym: 'x' }, { val: 9, sym: 'ix' }, { val: 5, sym: 'v' }, { val: 4, sym: 'iv' }, { val: 1, sym: 'i' }
];

// Regex for list items:
// Group 1: Indentation
// Group 2: Bullet ( *, -, •, 1., a., i., etc.)
// Group 3: Content
const LIST_ITEM_REGEX = /^(\s*)([\*\-•▪▫◦‣⁃]|\d+\.|[ivxlcdmIVXLCDM]+\.|[a-zA-Z]+\.)\s+(.*)$/;

// --- Helper Functions ---

/**
 * Formats the current date and time.
 * @param {Date} now 
 * @returns {string} Formatted date string (YYYY.MM.DD HH:mm)
 */
function formatDateTime(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Converts a Roman numeral string to a number.
 * @param {string} roman 
 * @returns {number}
 */
function romanToNum(roman) {
  let num = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = ROMAN_MAP[roman[i].toLowerCase()];
    const next = ROMAN_MAP[roman[i + 1]?.toLowerCase()];
    if (next > current) {
      num += next - current;
      i++;
    } else {
      num += current;
    }
  }
  return num;
}

/**
 * Converts a number to a Roman numeral string.
 * @param {number} num 
 * @returns {string}
 */
function numToRoman(num) {
  let roman = '';
  let n = num;
  for (const { val, sym } of ROMAN_VALUES) {
    while (n >= val) {
      roman += sym;
      n -= val;
    }
  }
  return roman;
}

/**
 * Gets the next letter in a sequence (a -> b, z -> aa).
 * @param {string} letter 
 * @returns {string}
 */
function nextLetter(letter) {
  const code = letter.charCodeAt(0);
  if (letter === 'z') return 'aa';
  if (letter === 'Z') return 'AA';
  return String.fromCharCode(code + 1);
}

/**
 * Checks if a bullet string looks like a Roman numeral.
 * @param {string} bullet 
 * @returns {boolean}
 */
function isRomanBullet(bullet) {
  return /^[ivxlcdmIVXLCDM]+\.$/.test(bullet);
}

/**
 * Checks if a bullet string looks like a Letter.
 * @param {string} bullet 
 * @returns {boolean}
 */
function isLetterBullet(bullet) {
  return /^[a-zA-Z]+\.$/.test(bullet);
}

/**
 * Checks if a bullet string looks like a Number.
 * @param {string} bullet 
 * @returns {boolean}
 */
function isNumberBullet(bullet) {
  return /^\d+\.$/.test(bullet);
}

// --- Command Handlers ---

function insertDateTimeLine(editor, { before = false } = {}) {
  if (!editor) return;

  const cursorPos = editor.selection.active;
  const line = `--- ✄ --------- ${formatDateTime()} -------------------`;
  const textToInsert = before ? `\n${line}\n` : `${line}\n`;

  editor.edit(editBuilder => {
    editBuilder.insert(cursorPos, textToInsert);
  }).then(() => {
    if (before) {
      const newPos = new vscode.Position(cursorPos.line, cursorPos.character);
      editor.selection = new vscode.Selection(newPos, newPos);
      editor.revealRange(new vscode.Range(newPos, newPos));
    }
  });
}

function handleEnter() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const text = line.text;
  const match = text.match(LIST_ITEM_REGEX);

  if (!match) {
    vscode.commands.executeCommand('type', { source: 'keyboard', text: '\n' });
    return;
  }

  const [_, indent, bullet, content] = match;

  // If line is empty (just bullet), remove bullet and new line
  if (content.trim().length === 0) {
    editor.edit(editBuilder => {
      editBuilder.replace(line.range, '');
      editBuilder.insert(line.range.start, '\n');
    });
    return;
  }

  let newBullet = bullet;
  let currentLineReplacement = null;

  // Handle standard bullets
  if (bullet === '*') {
    newBullet = '•';
    const bulletIndex = text.indexOf('*');
    if (bulletIndex >= 0) {
      const bulletRange = new vscode.Range(
        position.line, bulletIndex,
        position.line, bulletIndex + 1
      );
      currentLineReplacement = { range: bulletRange, text: '•' };
    }
  } else if (['-', '•', '▪', '▫', '◦', '‣', '⁃'].includes(bullet)) {
    newBullet = bullet;
  } else if (isNumberBullet(bullet)) {
    const num = parseInt(bullet.slice(0, -1));
    newBullet = `${num + 1}.`;
  } else {
    // Handle ambiguous Letter vs Roman
    let isRoman = isRomanBullet(bullet);

    // Disambiguate single letters: c, d, l, m are usually letters; i, v, x usually Roman
    if (isRoman && /^[cdlmCDLM]\.$/.test(bullet)) {
      isRoman = false;
    }

    // Context check from previous lines
    const targetIndentLen = indent.length;
    let contextBullet = null;
    for (let i = position.line - 1; i >= 0; i--) {
      const prevLine = editor.document.lineAt(i);
      if (prevLine.isEmptyOrWhitespace) continue;
      const prevMatch = prevLine.text.match(LIST_ITEM_REGEX);
      if (prevMatch) {
        const [_, prevIndent, prevBullet] = prevMatch;
        if (prevIndent.length === targetIndentLen) {
          contextBullet = prevBullet;
          break;
        }
        if (prevIndent.length < targetIndentLen) break;
      }
    }

    if (contextBullet) {
      if (isRomanBullet(contextBullet) && !/^[cdlmCDLM]\.$/.test(contextBullet)) {
        const prevRoman = romanToNum(contextBullet.slice(0, -1));
        const currRoman = romanToNum(bullet.slice(0, -1));
        if (currRoman === prevRoman + 1) isRoman = true;
      }
      if (isLetterBullet(contextBullet)) {
        const prevCode = contextBullet.charCodeAt(0);
        const currCode = bullet.charCodeAt(0);
        if (currCode === prevCode + 1) isRoman = false;
      }
    }

    if (isRoman) {
      const roman = bullet.slice(0, -1);
      const num = romanToNum(roman);
      newBullet = `${numToRoman(num + 1)}.`;
      if (bullet === bullet.toUpperCase()) {
        newBullet = newBullet.toUpperCase();
      }
    } else {
      const letter = bullet.slice(0, -1);
      newBullet = `${nextLetter(letter)}.`;
    }
  }

  const textToInsert = `\n${indent}${newBullet} `;

  editor.edit(editBuilder => {
    if (currentLineReplacement) {
      editBuilder.replace(currentLineReplacement.range, currentLineReplacement.text);
    }
    editBuilder.insert(position, textToInsert);
  });
}

function handleTab() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const text = line.text;
  const match = text.match(LIST_ITEM_REGEX);

  if (!match) {
    vscode.commands.executeCommand('tab');
    return;
  }

  const [_, indent, bullet, content] = match;
  let newBullet = bullet;

  // Cycle bullet type on indent
  if (isNumberBullet(bullet)) {
    newBullet = 'a.';
  } else if (isLetterBullet(bullet)) {
    newBullet = 'i.';
  } else if (isRomanBullet(bullet)) {
    newBullet = '1.';
  }

  // Get user's tab size preference
  const tabSize = editor.options.tabSize || 4;
  const indentString = ' '.repeat(tabSize);

  const newText = `${indentString}${indent}${newBullet} ${content}`;

  editor.edit(editBuilder => {
    editBuilder.replace(line.range, newText);
  });
}

function handleShiftTab() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const text = line.text;
  const match = text.match(LIST_ITEM_REGEX);

  if (!match) {
    vscode.commands.executeCommand('outdent');
    return;
  }

  const [_, indent, bullet, content] = match;
  const tabSize = editor.options.tabSize || 4;

  if (indent.length < tabSize) {
    vscode.commands.executeCommand('outdent');
    return;
  }

  // Smart outdent: look for context
  const targetIndentLen = indent.length - tabSize;
  let contextBullet = null;

  for (let i = position.line - 1; i >= 0; i--) {
    const prevLine = editor.document.lineAt(i);
    if (prevLine.isEmptyOrWhitespace) continue;

    const prevMatch = prevLine.text.match(LIST_ITEM_REGEX);
    if (prevMatch) {
      const [_, prevIndent, prevBullet] = prevMatch;
      if (prevIndent.length === targetIndentLen) {
        contextBullet = prevBullet;
        break;
      }
      if (prevIndent.length < targetIndentLen) break;
    }
  }

  let newBullet = bullet;

  if (contextBullet) {
    // Increment context bullet to guess next logical bullet
    if (isNumberBullet(contextBullet)) {
      const num = parseInt(contextBullet.slice(0, -1));
      newBullet = `${num + 1}.`;
    } else if (isLetterBullet(contextBullet)) {
      const letter = contextBullet.slice(0, -1);
      newBullet = `${nextLetter(letter)}.`;
    } else if (isRomanBullet(contextBullet)) {
      const roman = contextBullet.slice(0, -1);
      const num = romanToNum(roman);
      newBullet = `${numToRoman(num + 1)}.`;
      if (contextBullet === contextBullet.toUpperCase()) {
        newBullet = newBullet.toUpperCase();
      }
    }
  } else {
    // Fallback cycle logic
    if (isNumberBullet(bullet)) {
      newBullet = 'i.';
    } else if (isLetterBullet(bullet)) {
      newBullet = '1.';
    } else if (isRomanBullet(bullet)) {
      newBullet = 'a.';
    }
  }

  const newIndent = indent.substring(tabSize);
  const newText = `${newIndent}${newBullet} ${content}`;

  editor.edit(editBuilder => {
    editBuilder.replace(line.range, newText);
  });
}

// --- Extension Activation ---

function activate(context) {
  const register = (cmd, callback) => vscode.commands.registerCommand(cmd, callback);

  context.subscriptions.push(
    register('textWork.insertDateTimeLineAfter', () => {
      insertDateTimeLine(vscode.window.activeTextEditor, { before: false });
    }),
    register('textWork.insertDateTimeLineBefore', () => {
      insertDateTimeLine(vscode.window.activeTextEditor, { before: true });
    }),
    register('textWork.onEnter', handleEnter),
    register('textWork.onTab', handleTab),
    register('textWork.onShiftTab', handleShiftTab)
  );
}

function deactivate() { }

module.exports = { activate, deactivate };