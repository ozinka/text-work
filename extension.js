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

function handleEnter() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;

  const position = editor.selection.active;
  const line = editor.document.lineAt(position.line);
  const text = line.text;

  const regex = /^(\s*)([\*\-•]|\d+\.)\s+(.*)$/;
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
  } else if (/^\d+\.$/.test(bullet)) {
    const num = parseInt(bullet.slice(0, -1));
    newBullet = `${num + 1}.`;
  }

  const textToInsert = `\n${indent}${newBullet} `;

  editor.edit(editBuilder => {
    if (currentLineReplacement) {
      editBuilder.replace(currentLineReplacement.range, currentLineReplacement.text);
    }
    editBuilder.insert(position, textToInsert);
  });
}

function activate(context) {
  const register = (cmd, callback) => vscode.commands.registerCommand(cmd, callback);

  context.subscriptions.push(
    register('oziWork.insertDateTimeLineAfter', () => {
      const editor = vscode.window.activeTextEditor;
      insertDateTimeLine(editor, { before: false });
    }),
    register('oziWork.insertDateTimeLineBefore', () => {
      const editor = vscode.window.activeTextEditor;
      insertDateTimeLine(editor, { before: true });
    }),
    register('oziWork.onEnter', handleEnter)
  );
}

function deactivate() { }

module.exports = { activate, deactivate };