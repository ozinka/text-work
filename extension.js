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

function activate(context) {
  const register = (cmd, options) => vscode.commands.registerCommand(cmd, () => {
    const editor = vscode.window.activeTextEditor;
    insertDateTimeLine(editor, options);
  });

  context.subscriptions.push(
    register('oziWork.insertDateTimeLineAfter', { before: false }), // Alt+Enter
    register('oziWork.insertDateTimeLineBefore', { before: true })   // Alt+Shift+Enter
  );
}

function deactivate() { }

module.exports = { activate, deactivate };