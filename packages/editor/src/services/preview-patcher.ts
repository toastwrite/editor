import type { EditResult, MdNode } from '@toastwrite/parser';

type RemovedNodeRange = NonNullable<EditResult['removedNodeRange']>;

export function patchPreviewRange(
  previewEl: HTMLElement,
  removedNodeRange: RemovedNodeRange,
  newHtml: string
): boolean {
  const [startNodeId, endNodeId] = removedNodeRange.id;
  const startEl = previewEl.querySelector(`[data-nodeid="${startNodeId}"]`);
  const endEl = previewEl.querySelector(`[data-nodeid="${endNodeId}"]`);

  if (!startEl || !endEl) {
    return false;
  }

  startEl.insertAdjacentHTML('beforebegin', newHtml);

  let el: Element = startEl;
  while (el !== endEl) {
    const nextEl = el.nextElementSibling;
    if (!nextEl) {
      return false;
    }
    el.remove();
    el = nextEl;
  }

  el.remove();
  return true;
}

export function patchPreviewDom(
  previewEl: HTMLElement,
  editResults: EditResult[],
  renderNodeHtml: (node: MdNode) => string
): boolean {
  if (editResults.length === 0) {
    return true;
  }

  for (const { nodes, removedNodeRange } of editResults) {
    const newHtml = nodes.map((node) => renderNodeHtml(node)).join('');

    if (!removedNodeRange) {
      if (nodes.length === 0) {
        return false;
      }

      previewEl.insertAdjacentHTML('afterbegin', newHtml);
      continue;
    }

    const patched = patchPreviewRange(previewEl, removedNodeRange, newHtml);
    if (!patched) {
      return false;
    }
  }

  return true;
}
