import { afterEach, describe, expect, it } from 'vitest';
import { executeMarkdownCommand } from '../commands/markdown-commands.js';
import { Editor } from '../editor.js';

describe('commands', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('applies bold formatting in markdown mode', () => {
    const result = executeMarkdownCommand('hello world', { start: 6, end: 11 }, 'bold');

    expect(result?.value).toBe('hello **world**');
  });

  it('removes bold formatting when toggled again', () => {
    const result = executeMarkdownCommand('hello **world**', { start: 8, end: 13 }, 'bold');

    expect(result?.value).toBe('hello world');
  });

  it('renders toolbar buttons and executes bold from the toolbar', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'hello world',
      toolbarItems: ['bold', 'italic'],
    });

    const boldButton = container.querySelector('[data-command="bold"]') as HTMLButtonElement;
    expect(boldButton).toBeTruthy();
    expect(boldButton.querySelector('.toastwrite-editor-toolbar-icon')).toBeTruthy();
    expect(boldButton.closest('.toastwrite-editor-toolbar-item')?.querySelector('.toastwrite-editor-toolbar-tooltip')?.textContent).toContain('Bold');

    editor.setSelection({ start: 6, end: 11 });
    boldButton.click();

    expect(editor.getMarkdown()).toBe('hello **world**');

    editor.setSelection({ start: 8, end: 13 });
    boldButton.click();

    expect(editor.getMarkdown()).toBe('hello world');

    editor.destroy();
  });

  it('inserts a table from the toolbar in markdown mode', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['table'],
    });

    const tableButton = container.querySelector('[data-command="table"]') as HTMLButtonElement;
    expect(tableButton).toBeTruthy();
    expect(tableButton.querySelector('svg.toastwrite-editor-toolbar-icon-table')).toBeTruthy();

    editor.setSelection({ start: 5, end: 5 });
    tableButton.click();

    expect(editor.getMarkdown()).toContain('| Header 1 | Header 2 | Header 3 |');

    editor.destroy();
  });

  it('inserts a checked task list item from the toolbar', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Buy milk',
      toolbarItems: ['taskList'],
    });

    const taskListButton = container.querySelector('[data-command="taskList"]') as HTMLButtonElement;
    expect(taskListButton).toBeTruthy();
    expect(taskListButton.querySelector('svg.toastwrite-editor-toolbar-icon-taskList')).toBeTruthy();

    editor.setSelection({ start: 0, end: 8 });
    taskListButton.click();

    expect(editor.getMarkdown()).toBe('* [x] Buy milk');

    editor.destroy();
  });

});
