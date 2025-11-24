const vscode = require('vscode');

function formatDateTime(now = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

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

// Helper functions for list logic
function romanToNum(roman) {
  const map = { i: 1, v: 5, x: 10, l: 50, c: 100, d: 500, m: 1000 };
  let num = 0;
  for (let i = 0; i < roman.length; i++) {
    const current = map[roman[i].toLowerCase()];
    const next = map[roman[i + 1]?.toLowerCase()];
    if (next > current) {
      num += next - current;
      i++;
    } else {
      num += current;
    }
  }
  return num;
}

function numToRoman(num) {
  const map = [
    { val: 1000, sym: 'm' }, { val: 900, sym: 'cm' }, { val: 500, sym: 'd' }, { val: 400, sym: 'cd' },
    { val: 100, sym: 'c' }, { val: 90, sym: 'xc' }, { val: 50, sym: 'l' }, { val: 40, sym: 'xl' },
    { val: 10, sym: 'x' }, { val: 9, sym: 'ix' }, { val: 5, sym: 'v' }, { val: 4, sym: 'iv' }, { val: 1, sym: 'i' }
  ];
  let roman = '';
  for (const { val, sym } of map) {
    while (num >= val) {
      roman += sym;
      num -= val;
    }
  }
  return roman;
}

function nextLetter(letter) {
  const code = letter.charCodeAt(0);
  // Handle z -> aa is complex, sticking to simple cycling or just z->a for now, or just increment char code
  // User example: a -> b. Let's assume simple a-z.
  if (letter === 'z') return 'aa'; // Simple overflow handling
  if (letter === 'Z') return 'AA';
  return String.fromCharCode(code + 1);
}

function handleEnter() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const text = line.text;

  // Updated regex to prioritize Roman numerals in matching group (though logic handles disambiguation)
  const regex = /^(\s*)([\*\-•]|\d+\.|[ivxlcdmIVXLCDM]+\.|[a-zA-Z]+\.)\s+(.*)$/;
  const match = text.match(regex);

  if (!match) {
    vscode.commands.executeCommand('type', { source: 'keyboard', text: '\n' });
    return;
  }

  const [fullMatch, indent, bullet, content] = match;

  if (content.trim().length === 0) {
    editor.edit(editBuilder => {
      editBuilder.replace(line.range, '');
      editBuilder.insert(line.range.start, '\n');
    });
    return;
  }

  let newBullet = bullet;
  let currentLineReplacement = null;

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
    // Keep the same bullet
    newBullet = bullet;
  } else if (/^\d+\.$/.test(bullet)) {
    const num = parseInt(bullet.slice(0, -1));
    newBullet = `${num + 1}.`;
  } else {
    // Handle Letter vs Roman ambiguity
    let isRoman = false;

    // Check if it looks like Roman
    if (/^[ivxlcdmIVXLCDM]+\.$/.test(bullet)) {
      isRoman = true;
      // Disambiguate single letters that could be both (i, v, x, l, c, d, m)
      // We assume c, d, l, m are usually Letters in outlines unless context says otherwise
      // We assume i, v, x are usually Roman in outlines unless context says otherwise
      if (/^[cdlmCDLM]\.$/.test(bullet)) {
        isRoman = false;
      }
    }

    // Context check
    const targetIndentLen = indent.length;
    let contextBullet = null;
    for (let i = position.line - 1; i >= 0; i--) {
      const prevLine = editor.document.lineAt(i);
      if (prevLine.isEmptyOrWhitespace) continue;
      const prevMatch = prevLine.text.match(/^(\s*)([\*\-•]|\d+\.|[ivxlcdmIVXLCDM]+\.|[a-zA-Z]+\.)\s+(.*)$/);
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
      // If context was Roman, we should probably be Roman
      if (/^[ivxlcdmIVXLCDM]+\.$/.test(contextBullet) && !/^[cdlmCDLM]\.$/.test(contextBullet)) {
        // Check if current bullet is next Roman of context
        const prevRoman = romanToNum(contextBullet.slice(0, -1));
        const currRoman = romanToNum(bullet.slice(0, -1));
        if (currRoman === prevRoman + 1) isRoman = true;
      }
      // If context was Letter, we should probably be Letter
      if (/^[a-zA-Z]\.$/.test(contextBullet)) {
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
      // Treat as Letter
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

  const regex = /^(\s*)([\*\-•]|\d+\.|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\.)\s+(.*)$/;
  const match = text.match(regex);

  if (!match) {
    vscode.commands.executeCommand('tab');
    return;
  }

  const [fullMatch, indent, bullet, content] = match;
  let newBullet = bullet;

  if (/^\d+\.$/.test(bullet)) {
    newBullet = 'a.';
  } else if (/^[a-zA-Z]\.$/.test(bullet)) {
    newBullet = 'i.';
  } else if (/^[ivxlcdmIVXLCDM]+\.$/.test(bullet)) {
    newBullet = '1.';
  }

  const newText = `    ${indent}${newBullet} ${content}`;

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

  const regex = /^(\s*)([\*\-•]|\d+\.|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\.)\s+(.*)$/;
  const match = text.match(regex);

  if (!match) {
    vscode.commands.executeCommand('outdent');
    return;
  }

  const [fullMatch, indent, bullet, content] = match;

  if (indent.length < 4) {
    vscode.commands.executeCommand('outdent');
    return;
  }

  // Smart outdent: look for context
  const targetIndentLen = indent.length - 4;
  let contextBullet = null;

  for (let i = position.line - 1; i >= 0; i--) {
    const prevLine = editor.document.lineAt(i);
    if (prevLine.isEmptyOrWhitespace) continue;

    const prevMatch = prevLine.text.match(/^(\s*)([\*\-•]|\d+\.|[a-zA-Z]\.|[ivxlcdmIVXLCDM]+\.)\s+(.*)$/);
    if (prevMatch) {
      const [_, prevIndent, prevBullet] = prevMatch;
      if (prevIndent.length === targetIndentLen) {
        contextBullet = prevBullet;
        break;
      }
      if (prevIndent.length < targetIndentLen) {
        // We went too far up, stop searching
        break;
      }
    }
  }

  let newBullet = bullet;

  if (contextBullet) {
    // Increment context bullet
    if (/^\d+\.$/.test(contextBullet)) {
      const num = parseInt(contextBullet.slice(0, -1));
      newBullet = `${num + 1}.`;
    } else if (/^[a-zA-Z]\.$/.test(contextBullet)) {
      const letter = contextBullet.slice(0, -1);
      newBullet = `${nextLetter(letter)}.`;
    } else if (/^[ivxlcdmIVXLCDM]+\.$/.test(contextBullet)) {
      const roman = contextBullet.slice(0, -1);
      const num = romanToNum(roman);
      newBullet = `${numToRoman(num + 1)}.`;
      if (contextBullet === contextBullet.toUpperCase()) {
        newBullet = newBullet.toUpperCase();
      }
    }
  } else {
    // Fallback to cycle logic if no context found
    if (/^\d+\.$/.test(bullet)) {
      newBullet = 'i.';
    } else if (/^[a-zA-Z]\.$/.test(bullet)) {
      newBullet = '1.';
    } else if (/^[ivxlcdmIVXLCDM]+\.$/.test(bullet)) {
      newBullet = 'a.';
    }
  }

  // Remove 4 spaces from indentation
  const newIndent = indent.substring(4);
  const newText = `${newIndent}${newBullet} ${content}`;

  editor.edit(editBuilder => {
    editBuilder.replace(line.range, newText);
  });
}

function activate(context) {
  const register = (cmd, callback) => vscode.commands.registerCommand(cmd, callback);

  context.subscriptions.push(
    register('textWork.insertDateTimeLineAfter', () => {
      const editor = vscode.window.activeTextEditor;
      insertDateTimeLine(editor, { before: false });
    }),
    register('textWork.insertDateTimeLineBefore', () => {
      const editor = vscode.window.activeTextEditor;
      insertDateTimeLine(editor, { before: true });
    }),
    register('textWork.onEnter', handleEnter),
    register('textWork.onTab', handleTab),
    register('textWork.onShiftTab', handleShiftTab)
  );
}

function deactivate() { }

module.exports = { activate, deactivate };