import { marked } from 'marked';

// Configure marked with GitHub Flavored Markdown (GFM)
marked.setOptions({
  gfm: true,
  breaks: true,
});

export function markdownToHtml(md: string): string {
  if (!md) return '<p></p>';
  try {
    return marked.parse(md) as string;
  } catch (e) {
    console.error('Error parsing markdown to HTML:', e);
    return `<p>${escapeHtml(md)}</p>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function htmlToMarkdown(html: string): string {
  if (!html) return '';
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function nodeToMd(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(nodeToMd).join('');

    switch (tag) {
      case 'h1':
        return `# ${children.trim()}\n\n`;
      case 'h2':
        return `## ${children.trim()}\n\n`;
      case 'h3':
        return `### ${children.trim()}\n\n`;
      case 'p':
        return `${children.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${children}**`;
      case 'em':
      case 'i':
        return `*${children}*`;
      case 's':
      case 'strike':
      case 'del':
        return `~~${children}~~`;
      case 'mark':
        return `==${children}==`;
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          return children;
        }
        return `\`${children}\``;
      case 'pre':
        return `\`\`\`\n${children.trim()}\n\`\`\`\n\n`;
      case 'blockquote':
        return `> ${children.trim().replace(/\n/g, '\n> ')}\n\n`;
      case 'hr':
        return `---\n\n`;
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'image';
        return `![${alt}](${src})\n\n`;
      }
      case 'a': {
        const href = el.getAttribute('href') || '';
        return `[${children}](${href})`;
      }
      case 'ul': {
        if (el.getAttribute('data-type') === 'taskList') {
          return `${children}\n`;
        }
        return `${children}\n`;
      }
      case 'ol':
        return `${children}\n`;
      case 'li': {
        if (el.parentElement?.getAttribute('data-type') === 'taskList') {
          const checked = el.getAttribute('data-checked') === 'true';
          const text = children.trim();
          return `- [${checked ? 'x' : ' '}] ${text}\n`;
        }
        const isOrdered = el.parentElement?.tagName.toLowerCase() === 'ol';
        if (isOrdered) {
          const idx = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
          return `${idx}. ${children.trim()}\n`;
        }
        return `- ${children.trim()}\n`;
      }
      case 'table': {
        // Simple markdown table serialization
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        let md = '\n';
        rows.forEach((row, i) => {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const cellTexts = cells.map((c) => c.textContent?.trim() || '');
          md += `| ${cellTexts.join(' | ')} |\n`;
          if (i === 0) {
            md += `| ${cells.map(() => '---').join(' | ')} |\n`;
          }
        });
        return md + '\n';
      }
      default:
        return children;
    }
  }

  const raw = Array.from(doc.body.childNodes).map(nodeToMd).join('');
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}
