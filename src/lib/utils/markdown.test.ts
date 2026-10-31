import { describe, it, expect } from 'vitest';
import { markdownToHtml } from './markdown';

describe('Markdown Converter', () => {
  it('converts headings and paragraphs to HTML', () => {
    const md = '# NoteFlow Header\n\nThis is a note.';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>NoteFlow Header</h1>');
    expect(html).toContain('<p>This is a note.</p>');
  });

  it('converts bold and italic text', () => {
    const md = '**Bold Text** and *Italic Text*';
    const html = markdownToHtml(md);
    expect(html).toContain('<strong>Bold Text</strong>');
    expect(html).toContain('<em>Italic Text</em>');
  });

  it('converts checklists and task lists', () => {
    const md = '- [x] Completed task\n- [ ] Pending task';
    const html = markdownToHtml(md);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('checked');
  });

  it('converts code blocks', () => {
    const md = '```rust\nfn main() { println!("Hello"); }\n```';
    const html = markdownToHtml(md);
    expect(html).toContain('<pre><code');
    expect(html).toContain('println!');
  });

  it('converts blockquotes', () => {
    const md = '> Apple Notes elegance with Notepad speed.';
    const html = markdownToHtml(md);
    expect(html).toContain('<blockquote>');
    expect(html).toContain('Apple Notes elegance');
  });

  it('converts markdown tables', () => {
    const md = '| Col 1 | Col 2 |\n| --- | --- |\n| A | B |';
    const html = markdownToHtml(md);
    expect(html).toContain('<table>');
    expect(html).toContain('<th>Col 1</th>');
    expect(html).toContain('<td>A</td>');
  });
});
