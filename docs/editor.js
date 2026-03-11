import { parse } from '../src/parser.ts';
import { renderSVG } from '../src/renderer.ts';

const preview = document.getElementById('preview');
const copyCodeBtn = document.getElementById('copyCode');
const copyPNGBtn = document.getElementById('copyPNG');
const copySVGBtn = document.getElementById('copySVG');

const INITIAL_CODE = `def messageSpacing 20px
def participantSpacing 160px

participant Alice a
participant Bob b

a -> b : "normal"
b -> a : "normal reply"

a ~> b : "corrupted"
b ~> a : "corrupted reply"

a -x b : "dropped"
b -x a : "dropped reply"

a => b : "thick"
b => a : "thick reply"

a @2 < "left label @2"
b @5 > "right label @5"`;

const editor = window.CodeMirror(document.getElementById('editor'), {
    value: INITIAL_CODE,
    mode: 'protocol-ml',
    lineNumbers: true,
    autofocus: true,
    tabSize: 2,
    indentUnit: 2,
    viewportMargin: Infinity
});

let currentSVG = '';

function render() {
    const code = editor.getValue();
    try {
        const diagram = parse(code);
        currentSVG = renderSVG(diagram);
        preview.innerHTML = `<div class="protocol-ml-wrapper">${currentSVG}</div>`;
    } catch (err) {
        preview.innerHTML = `<div class="error">Error: ${err.message}</div>`;
        currentSVG = '';
    }
}

// Debounce rendering for performance
let renderTimeout;
editor.on('change', () => {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(render, 300);
});

copyCodeBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(editor.getValue());
        copyCodeBtn.textContent = 'Copied!';
        copyCodeBtn.classList.add('copied');
        setTimeout(() => {
            copyCodeBtn.textContent = 'Copy Code';
            copyCodeBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
});

copyPNGBtn.addEventListener('click', async () => {
    if (!currentSVG) return;
    try {
        const svgElement = preview.querySelector('svg');
        if (!svgElement) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const svgData = new XMLSerializer().serializeToString(svgElement);

        canvas.width = svgElement.width.baseVal.value;
        canvas.height = svgElement.height.baseVal.value;

        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = async () => {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);

            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    copyPNGBtn.textContent = 'Copied!';
                    copyPNGBtn.classList.add('copied');
                    setTimeout(() => {
                        copyPNGBtn.textContent = 'Copy PNG';
                        copyPNGBtn.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    console.error('Failed to copy PNG:', err);
                    copyPNGBtn.textContent = 'Failed';
                    setTimeout(() => {
                        copyPNGBtn.textContent = 'Copy PNG';
                    }, 2000);
                }
            }, 'image/png');
        };

        img.onerror = () => {
            console.error('Failed to load SVG');
            URL.revokeObjectURL(url);
        };

        img.src = url;
    } catch (err) {
        console.error('Failed to copy PNG:', err);
    }
});

copySVGBtn.addEventListener('click', async () => {
    if (!currentSVG) return;
    try {
        await navigator.clipboard.writeText(currentSVG);
        copySVGBtn.textContent = 'Copied!';
        copySVGBtn.classList.add('copied');
        setTimeout(() => {
            copySVGBtn.textContent = 'Copy SVG';
            copySVGBtn.classList.remove('copied');
        }, 2000);
    } catch (err) {
        console.error('Failed to copy:', err);
    }
});

// Initial render
render();
