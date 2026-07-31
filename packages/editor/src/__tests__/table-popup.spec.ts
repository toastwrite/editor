import { afterEach, describe, expect, it } from 'vitest';
import { Editor } from '../editor.js';

describe('table popup', () => {
  let container: HTMLDivElement;

  afterEach(() => {
    container?.remove();
  });

  it('opens the popup when clicking the table toolbar button', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['table'],
    });

    const tableButton = container.querySelector('[data-command="table"]') as HTMLButtonElement;
    tableButton.click();

    const popup = container.querySelector('.toastwrite-editor-table-popup') as HTMLElement;
    expect(popup.hidden).toBe(false);
    expect(container.querySelector('.toastwrite-editor-table-popup-label')?.textContent).toBe(
      'Insert table'
    );

    editor.destroy();
  });

  it('updates the size label while hovering the grid', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['table'],
    });

    const tableButton = container.querySelector('[data-command="table"]') as HTMLButtonElement;
    tableButton.click();

    const popup = container.querySelector('.toastwrite-editor-table-popup') as HTMLElement;
    const cell = popup.querySelector('[data-row="4"][data-col="5"]') as HTMLButtonElement;

    cell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    expect(container.querySelector('.toastwrite-editor-table-popup-label')?.textContent).toBe(
      '5 x 4'
    );

    editor.destroy();
  });

  it('inserts a table with the selected dimensions', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['table'],
    });

    editor.setSelection({ start: 5, end: 5 });

    const tableButton = container.querySelector('[data-command="table"]') as HTMLButtonElement;
    tableButton.click();

    const popup = container.querySelector('.toastwrite-editor-table-popup') as HTMLElement;
    const cell = popup.querySelector('[data-row="3"][data-col="4"]') as HTMLButtonElement;
    cell.click();

    expect(editor.getMarkdown()).toContain('|  |  |  |  |');
    expect(editor.getMarkdown()).toContain('|  |  |  |  |\n\n\n');

    editor.destroy();
  });

  it('does not expand beyond 15 rows or 10 columns', () => {
    container = document.createElement('div');
    document.body.appendChild(container);

    const editor = new Editor({
      el: container,
      initialValue: 'Hello',
      toolbarItems: ['table'],
    });

    const tableButton = container.querySelector('[data-command="table"]') as HTMLButtonElement;
    tableButton.click();

    const popup = container.querySelector('.toastwrite-editor-table-popup') as HTMLElement;

    let previousCount = 0;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const cells = popup.querySelectorAll<HTMLElement>('.toastwrite-editor-table-popup-cell');
      if (cells.length === previousCount) {
        break;
      }

      previousCount = cells.length;

      let maxRow = 0;
      let maxCol = 0;
      cells.forEach((cell) => {
        maxRow = Math.max(maxRow, Number(cell.dataset.row));
        maxCol = Math.max(maxCol, Number(cell.dataset.col));
      });

      const edgeCell = popup.querySelector(
        `[data-row="${maxRow}"][data-col="${maxCol}"]`
      ) as HTMLButtonElement;
      edgeCell.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    }

    expect(popup.querySelectorAll('.toastwrite-editor-table-popup-cell').length).toBe(150);
    expect(popup.querySelector('[data-row="15"][data-col="10"]')).toBeTruthy();
    expect(popup.querySelector('[data-row="16"]')).toBeNull();
    expect(popup.querySelector('[data-col="11"]')).toBeNull();

    editor.destroy();
  });
});
