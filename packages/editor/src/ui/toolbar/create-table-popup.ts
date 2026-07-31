export interface TablePopupOptions {
  mount: HTMLElement;
  onSubmit: (rows: number, cols: number) => void;
}

export interface TablePopupController {
  open(trigger: HTMLElement): void;
  close(): void;
  isOpen(): boolean;
  destroy(): void;
}

const POPUP_MARGIN_FROM_RIGHT = 20;
const INITIAL_GRID_SIZE = 8;
const MAX_GRID_ROWS = 15;
const MAX_GRID_COLS = 10;

function positionPopup(popup: HTMLElement, trigger: HTMLElement, mount: HTMLElement): void {
  const mountRect = mount.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const left = triggerRect.left - mountRect.left;
  const top = triggerRect.bottom - mountRect.top + 4;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;

  requestAnimationFrame(() => {
    const popupWidth = popup.offsetWidth;
    const maxLeft = Math.max(mount.clientWidth - popupWidth - POPUP_MARGIN_FROM_RIGHT, 0);
    popup.style.left = `${Math.min(left, maxLeft)}px`;
  });
}

export function createTablePopup({ mount, onSubmit }: TablePopupOptions): TablePopupController {
  const popup = document.createElement('div');
  popup.className = 'toastwrite-editor-table-popup';
  popup.hidden = true;
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Insert table');

  const grid = document.createElement('div');
  grid.className = 'toastwrite-editor-table-popup-grid';
  grid.setAttribute('role', 'grid');

  const label = document.createElement('div');
  label.className = 'toastwrite-editor-table-popup-label';
  label.textContent = 'Insert table';

  popup.append(grid, label);
  mount.appendChild(popup);

  let gridRows = INITIAL_GRID_SIZE;
  let gridCols = INITIAL_GRID_SIZE;
  let selectedRows = 0;
  let selectedCols = 0;

  const updateLabel = (): void => {
    label.textContent =
      selectedRows > 0 && selectedCols > 0 ? `${selectedCols} x ${selectedRows}` : 'Insert table';
  };

  const updateSelection = (): void => {
    grid.querySelectorAll<HTMLElement>('.toastwrite-editor-table-popup-cell').forEach((cell) => {
      const row = Number(cell.dataset.row);
      const col = Number(cell.dataset.col);
      const isSelected = row <= selectedRows && col <= selectedCols;

      cell.classList.toggle('is-selected', isSelected);
      cell.classList.toggle('is-selection-top', isSelected && row === 1);
      cell.classList.toggle('is-selection-bottom', isSelected && row === selectedRows);
      cell.classList.toggle('is-selection-left', isSelected && col === 1);
      cell.classList.toggle('is-selection-right', isSelected && col === selectedCols);
    });

    updateLabel();
  };

  const maybeExpandGrid = (rowIndex: number, colIndex: number): void => {
    let expanded = false;

    if (rowIndex >= gridRows - 1 && gridRows < MAX_GRID_ROWS) {
      gridRows += 1;
      expanded = true;
    }

    if (colIndex >= gridCols - 1 && gridCols < MAX_GRID_COLS) {
      gridCols += 1;
      expanded = true;
    }

    if (expanded) {
      renderGrid();
    }
  };

  const handleCellHover = (rowIndex: number, colIndex: number): void => {
    selectedRows = rowIndex + 1;
    selectedCols = colIndex + 1;
    updateSelection();
    maybeExpandGrid(rowIndex, colIndex);
  };

  const handleCellClick = (rowIndex: number, colIndex: number): void => {
    const rows = rowIndex + 1;
    const cols = colIndex + 1;
    onSubmit(rows, cols);
    close();
  };

  const renderGrid = (): void => {
    grid.replaceChildren();
    grid.style.gridTemplateColumns = `repeat(${gridCols}, var(--toastwrite-editor-table-cell-size))`;

    for (let rowIndex = 0; rowIndex < gridRows; rowIndex += 1) {
      for (let colIndex = 0; colIndex < gridCols; colIndex += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'toastwrite-editor-table-popup-cell';
        cell.dataset.row = String(rowIndex + 1);
        cell.dataset.col = String(colIndex + 1);
        cell.setAttribute('aria-label', `${colIndex + 1} by ${rowIndex + 1} table`);

        cell.addEventListener('mouseenter', () => {
          handleCellHover(rowIndex, colIndex);
        });
        cell.addEventListener('click', () => {
          handleCellClick(rowIndex, colIndex);
        });

        grid.appendChild(cell);
      }
    }

    updateSelection();
  };

  const resetSelection = (): void => {
    gridRows = INITIAL_GRID_SIZE;
    gridCols = INITIAL_GRID_SIZE;
    selectedRows = 0;
    selectedCols = 0;
    renderGrid();
  };

  const close = (): void => {
    popup.hidden = true;
    resetSelection();
  };

  const open = (trigger: HTMLElement): void => {
    resetSelection();
    popup.hidden = false;
    positionPopup(popup, trigger, mount);
  };

  const onDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null;
    if (target && popup.contains(target)) {
      return;
    }

    const trigger = mount.querySelector('[data-command="table"]');
    if (target && trigger?.contains(target as Node)) {
      return;
    }

    close();
  };

  const onDocumentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      close();
    }
  };

  const onGridMouseLeave = (): void => {
    selectedRows = 0;
    selectedCols = 0;
    updateSelection();
  };

  grid.addEventListener('mouseleave', onGridMouseLeave);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  document.addEventListener('keydown', onDocumentKeyDown);

  renderGrid();

  return {
    open,
    close,
    isOpen: () => !popup.hidden,
    destroy() {
      grid.removeEventListener('mouseleave', onGridMouseLeave);
      document.removeEventListener('pointerdown', onDocumentPointerDown);
      document.removeEventListener('keydown', onDocumentKeyDown);
      popup.remove();
    },
  };
}
