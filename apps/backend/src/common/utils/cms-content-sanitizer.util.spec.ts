import { describe, expect, it } from '@jest/globals';
import { sanitizeCmsHtmlContent } from './cms-content-sanitizer.util';

describe('sanitizeCmsHtmlContent', () => {
  it('removes script tags and inline event handlers', () => {
    const input = '<div onclick="alert(1)">Hello</div><script>fetch("/api/users")</script>';
    const result = sanitizeCmsHtmlContent(input);

    expect(result.sanitized).toBe('<div>Hello</div>');
    expect(result.wasModified).toBe(true);
  });

  it('removes dangerous URL protocols', () => {
    const input = '<a href="javascript:alert(1)">Bad</a><img src="data:text/html,foo" />';
    const result = sanitizeCmsHtmlContent(input);

    expect(result.sanitized).toBe('<a>Bad</a><img />');
    expect(result.wasModified).toBe(true);
  });

  it('removes form and input elements', () => {
    const input = '<section><form action="/steal"><input name="x" /></form><p>Safe</p></section>';
    const result = sanitizeCmsHtmlContent(input);

    expect(result.sanitized).toBe('<section><p>Safe</p></section>');
    expect(result.wasModified).toBe(true);
  });

  it('keeps safe markup unchanged', () => {
    const input = '<section><h2>About</h2><p style="color:#111">Clean content</p></section>';
    const result = sanitizeCmsHtmlContent(input);

    expect(result.sanitized).toBe(input);
    expect(result.wasModified).toBe(false);
  });
});
