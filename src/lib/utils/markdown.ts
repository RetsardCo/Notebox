import { marked } from 'marked';

// Configure marked with GitHub Flavored Markdown (GFM)
marked.setOptions({
  gfm: true,
  breaks: true,
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function unescapeHtml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

export function markdownToHtml(md: string): string {
  if (!md) return '<p></p>';
  try {
    // 1. Pre-process Wiki-links: [[Note Title]] or [[Note Title|Custom Alias]]
    const withWikiLinks = md.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, title, alias) => {
      const display = (alias || title).trim();
      const target = title.trim();
      return `<a href="#" class="wiki-link" data-note-title="${escapeHtml(target)}">${escapeHtml(display)}</a>`;
    });

    let html = marked.parse(withWikiLinks) as string;

    // 2. Convert standard marked checklist HTML into TipTap TaskList schema
    // Matches <li> or <li class="..."> with checkbox input
    html = html.replace(/<li\b([^>]*)><input([^>]*type=["']checkbox["'][^>]*)>\s*([\s\S]*?)<\/li>/gi, (_, _liAttrs, inputAttrs, text) => {
      const isChecked = /checked/i.test(inputAttrs);
      const cleanText = text.replace(/^<p>([\s\S]*)<\/p>$/i, '$1').trim();
      return `<li data-type="taskItem" data-checked="${isChecked ? 'true' : 'false'}"><label><input type="checkbox"${isChecked ? ' checked' : ''}><span></span></label><div><p>${cleanText}</p></div></li>`;
    });

    // If html contains task items, ensure parent <ul> has data-type="taskList"
    html = html.replace(/<ul([^>]*)>([\s\S]*?)<\/ul>/gi, (match, attrs, content) => {
      if (content.includes('data-type="taskItem"') && !attrs.includes('data-type="taskList"')) {
        return `<ul data-type="taskList"${attrs}>${content}</ul>`;
      }
      return match;
    });

    return html;
  } catch (e) {
    console.error('Error parsing markdown to HTML:', e);
    return `<p>${escapeHtml(md)}</p>`;
  }
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';

  let md = html;

  // 1. Tables
  md = md.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableContent) => {
    const rows: string[][] = [];
    const trMatches = tableContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const cells: string[] = [];
      const cellMatches = tr.match(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi) || [];
      for (const cell of cellMatches) {
        const text = cell.replace(/<[^>]+>/g, '').trim();
        cells.push(text);
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }
    if (rows.length === 0) return '';
    let tableMd = '\n';
    rows.forEach((row, i) => {
      tableMd += `| ${row.join(' | ')} |\n`;
      if (i === 0) {
        tableMd += `| ${row.map(() => '---').join(' | ')} |\n`;
      }
    });
    return tableMd + '\n';
  });

  // 2. Task items (TipTap, Marked, GFM, HTML checkboxes in any attribute order)
  md = md.replace(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi, (fullMatch, attrs, innerContent) => {
    const isTaskItem =
      /data-type=["']taskItem["']/i.test(attrs) ||
      /class=["'][^"']*task-list-item[^"']*["']/i.test(attrs) ||
      /<input[^>]*type=["']checkbox["']/i.test(innerContent);

    if (!isTaskItem) {
      return fullMatch;
    }

    const isChecked =
      /data-checked=["']true["']/i.test(attrs) ||
      /<input[^>]*\bchecked\b/i.test(innerContent);

    const clean = innerContent
      .replace(/<label[^>]*>[\s\S]*?<\/label>/gi, '')
      .replace(/<input[^>]*>/gi, '')
      .replace(/<\/?(p|div|span)[^>]*>/gi, '')
      .trim();

    return `- [${isChecked ? 'x' : ' '}] ${clean}\n`;
  });

  // 3. Wiki links: <a ... class="wiki-link" data-note-title="Title">...</a>
  md = md.replace(/<a[^>]*class=["'][^"']*wiki-link[^"']*["'][^>]*data-note-title=["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi, '[[$1]]');

  // 4. Images: <img src="..." data-src="..." alt="...">
  md = md.replace(/<img[^>]*>/gi, (imgTag) => {
    const dataSrcMatch = imgTag.match(/data-src=["']([^"']+)["']/i);
    const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
    const altMatch = imgTag.match(/alt=["']([^"']+)["']/i);
    const src = dataSrcMatch ? dataSrcMatch[1] : (srcMatch ? srcMatch[1] : '');
    const alt = altMatch ? altMatch[1] : 'image';
    return `![${alt}](${src})\n\n`;
  });

  // 5. Code blocks: <pre><code>...</code></pre>
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const unescaped = unescapeHtml(code);
    return `\`\`\`\n${unescaped.trim()}\n\`\`\`\n\n`;
  });

  // 6. Blockquotes: <blockquote>...</blockquote>
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, quote) => {
    const text = quote.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n').replace(/<[^>]+>/g, '').trim();
    return `> ${text.replace(/\n/g, '\n> ')}\n\n`;
  });

  // 7. Headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, c) => `# ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, c) => `## ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, c) => `### ${c.replace(/<[^>]+>/g, '').trim()}\n\n`);

  // 8. Paragraphs
  md = md.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '$1\n\n');

  // 9. Standard unordered / ordered list items
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, c) => {
    const clean = c.replace(/<\/?(p|div|span)[^>]*>/gi, '').trim();
    return `- ${clean}\n`;
  });

  // 10. Inline formatting
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');
  md = md.replace(/<(s|strike|del)[^>]*>([\s\S]*?)<\/\1>/gi, '~~$2~~');
  md = md.replace(/<u[^>]*>([\s\S]*?)<\/u>/gi, '<u>$1</u>');
  md = md.replace(/<mark[^>]*>([\s\S]*?)<\/mark>/gi, '==$1==');
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  md = md.replace(/<hr[^>]*>/gi, '---\n\n');

  // 11. Links (non-wiki)
  md = md.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // 12. Strip remaining wrapper tags
  md = md.replace(/<\/?(ul|ol|div|span)[^>]*>/gi, '');

  // 13. Strip any residual unhandled HTML tags except <u>
  md = md.replace(/<(?!\/?u\b)[^>]+>/gi, '');

  // 14. Decode HTML entities & normalize newlines
  md = unescapeHtml(md);
  return md.replace(/\n{3,}/g, '\n\n').trim();
}
