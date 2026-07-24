import { describe, expect, it } from 'vitest';
import { ContentService } from '../services/content-service.js';

describe('ContentService', () => {
  it('stores and returns markdown', () => {
    const service = new ContentService({ initialValue: '# Hello' });

    expect(service.getMarkdown()).toBe('# Hello');

    service.setMarkdown('## Updated');
    expect(service.getMarkdown()).toBe('## Updated');
  });

  it('incrementally edits markdown through toastmark', () => {
    const service = new ContentService({ initialValue: '# Hello' });
    const results = service.editMarkdown([1, 8], [1, 8], ' world');

    expect(service.getMarkdown()).toBe('# Hello world');
    expect(results[0]?.nodes.length).toBeGreaterThan(0);
  });
});
