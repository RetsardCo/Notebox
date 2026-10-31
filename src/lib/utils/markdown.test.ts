import { describe, it, expect } from 'vitest';
import { markdownToHtml, htmlToMarkdown } from './markdown';

describe('Markdown Converter', () => {
  it('converts headings and paragraphs to HTML', () => {
    const md = '# Notebox Header\n\nThis is a note.';
    const html = markdownToHtml(md);
    expect(html).toContain('<h1>Notebox Header</h1>');
    expect(html).toContain('<p>This is a note.</p>');
  });

  it('converts bold and italic text', () => {
    const md = '**Bold Text** and *Italic Text*';
    const html = markdownToHtml(md);
    expect(html).toContain('<strong>Bold Text</strong>');
    expect(html).toContain('<em>Italic Text</em>');
  });

  it('converts and roundtrips underline text', () => {
    const md = 'This is <u>Underlined Text</u> in note.';
    const html = markdownToHtml(md);
    expect(html).toContain('<u>Underlined Text</u>');
    const roundtrip = htmlToMarkdown(html);
    expect(roundtrip).toContain('<u>Underlined Text</u>');
  });

  it('converts checklists and task lists into TipTap schema', () => {
    const md = '- [x] Completed task\n- [ ] Pending task';
    const html = markdownToHtml(md);
    expect(html).toContain('data-type="taskList"');
    expect(html).toContain('data-type="taskItem"');
    expect(html).toContain('data-checked="true"');
    expect(html).toContain('data-checked="false"');
  });

  it('round-trips checklists from Markdown to HTML and back to Markdown', () => {
    const md = '- [x] Completed task\n- [ ] Pending task';
    const html = markdownToHtml(md);
    const resultMd = htmlToMarkdown(html);
    expect(resultMd).toContain('- [x] Completed task');
    expect(resultMd).toContain('- [ ] Pending task');
  });

  it('converts wiki-links [[Note Title]] and roundtrips', () => {
    const md = 'Check out [[Project Roadmap]] and [[Meeting Notes|notes]].';
    const html = markdownToHtml(md);
    expect(html).toContain('class="wiki-link"');
    expect(html).toContain('data-note-title="Project Roadmap"');

    const resultMd = htmlToMarkdown(html);
    expect(resultMd).toContain('[[Project Roadmap]]');
  });

  it('serializes image data-src to prevent base64 bloat', () => {
    const html = '<p><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA" data-src=".assets/images/note-1/pic.png" alt="My Photo"></p>';
    const md = htmlToMarkdown(html);
    expect(md).toContain('![My Photo](.assets/images/note-1/pic.png)');
    expect(md).not.toContain('data:image/png;base64');
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

    const roundtrip = htmlToMarkdown(html);
    expect(roundtrip).toContain('| Col 1 | Col 2 |');
    expect(roundtrip).toContain('| A | B |');
  });
});
