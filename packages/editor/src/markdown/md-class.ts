export function mdClass(...names: string[]): string {
  return names.map((name) => `toastwrite-editor-md-${name}`).join(' ');
}
