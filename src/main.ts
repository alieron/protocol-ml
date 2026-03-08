import { parse } from './parser';
import { renderSVG } from './renderer';

/**
 * Render all <pre class="euler-ml"> elements on the page,
 * replacing them with inline SVG diagrams.
 */
export function renderAll(root: Document | Element = document): void {
  const blocks = root.querySelectorAll('pre.protocol-ml');
  blocks.forEach(block => {
    try {
      const src = block.textContent ?? '';
      const diagram = parse(src);
      const svg = renderSVG(diagram);

      const wrapper = document.createElement('div');
      wrapper.className = 'protocol-ml-wrapper';
      wrapper.style.cssText = 'max-width: 100%;';
      wrapper.innerHTML = svg;

      block.replaceWith(wrapper);
    } catch (err) {
      console.error('[protocol-ml] Failed to render diagram:', err);
    }
  });
}

// render on DOMContentLoaded if running in browser
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => renderAll());
  } else {
    renderAll();
  }
}
