/**
 * Docuvate - InkScribe Digital Handwriting Engine
 * 100% Client-Side Text to Realistic Handwriting Workstation
 */

const pdfjsLib = window['pdfjs-dist/build/pdf'] || window['pdfjsLib'];
if (pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor-container');
    const paginationBar = document.getElementById('pagination-bar');
    const processingOverlay = document.getElementById('processing-overlay');
    const aiWidget = document.getElementById('ai-writer-widget');
    const aiPrompt = document.getElementById('ai-prompt');
    const aiToggleBtn = document.getElementById('toggle-ai-widget');
    const controls = ['size', 'orientation', 'texture', 'bg-color', 'spacing', 'line-color', 'margin-top', 'margin-left', 'margin-right', 'margin-bottom', 'margin-color', 'margin-style', 'font', 'fs', 'weight', 'color', 'align', 'line-height', 'word-spacing'];
    
    let isFormatting = false;
    let lastActivePage = null;

    function getStyles() {
        const s = {}; 
        controls.forEach(id => {
            const el = document.getElementById(id);
            if(el) s[id] = el.value;
        });
        return s;
    }

    function applyStylesToPage(p, s) {
        let [w, h] = s.size ? s.size.split(',').map(Number) : [210, 297];
        if (s.orientation === 'landscape') { const temp = w; w = h; h = temp; }
        
        p.style.width = w + 'mm'; 
        p.style.height = h + 'mm';
        p.style.setProperty('--page-h', h + 'mm');
        
        p.style.setProperty('--paper-bg', s['bg-color']);
        p.style.setProperty('--margin-left', `${s['margin-left']}mm`);
        p.style.setProperty('--margin-top', `${s['margin-top']}mm`);
        p.style.setProperty('--margin-color', s['margin-color']);
        p.style.setProperty('--margin-style', s['margin-style']);
        p.style.setProperty('--margin-width', s['margin-style'] === 'double' ? '3px' : '1px');

        p.style.paddingTop = `${Number(s['margin-top']) + 2}mm`;
        p.style.paddingLeft = `${Number(s['margin-left']) + 2}mm`;
        p.style.paddingRight = `${s['margin-right']}mm`;
        p.style.paddingBottom = `${s['margin-bottom']}mm`;
        
        let contentDiv = p.querySelector('.page-content');
        if (contentDiv) {
            contentDiv.style.fontFamily = s.font;
            contentDiv.style.fontWeight = s.weight;
            contentDiv.style.fontSize = s.fs + 'px';
            contentDiv.style.color = s.color;
            contentDiv.style.textAlign = s.align;
            contentDiv.style.lineHeight = s['line-height'];
            contentDiv.style.wordSpacing = s['word-spacing'] + 'px';
        }
        
        if (s.texture === 'ruled') {
            p.style.backgroundImage = `linear-gradient(${s['bg-color']}, ${s['bg-color']}), linear-gradient(${s['line-color']} 1px, transparent 1px)`;
            p.style.backgroundSize = `100% ${s['margin-top']}mm, 100% ${s.spacing}mm`;
            p.style.backgroundPosition = `0 0, 0 ${s['margin-top']}mm`;
            p.style.backgroundRepeat = `no-repeat, repeat`;
        } else if (s.texture === 'graph') {
            p.style.backgroundImage = `linear-gradient(${s['bg-color']}, ${s['bg-color']}), linear-gradient(${s['line-color']} 1px, transparent 1px), linear-gradient(90deg, ${s['line-color']} 1px, transparent 1px)`;
            p.style.backgroundSize = `100% ${s['margin-top']}mm, ${s.spacing}mm ${s.spacing}mm, ${s.spacing}mm ${s.spacing}mm`;
            p.style.backgroundPosition = `0 0, 0 ${s['margin-top']}mm, 0 0`;
            p.style.backgroundRepeat = `no-repeat, repeat, repeat`;
        } else {
            p.style.backgroundImage = 'none';
        }
    }

    function updatePagination() {
        if (!paginationBar) return;
        paginationBar.innerHTML = '';
        const pages = document.querySelectorAll('.page');
        pages.forEach((p, idx) => {
            const btn = document.createElement('button');
            btn.className = 'page-btn';
            btn.innerText = `Page ${idx + 1}`;
            btn.onclick = () => {
                p.scrollIntoView({ behavior: 'smooth', block: 'start' });
                document.querySelectorAll('.page-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
            if(idx === pages.length - 1) btn.classList.add('active'); 
            paginationBar.appendChild(btn);

            let watermark = p.querySelector('.page-number-watermark');
            if(!watermark) {
                watermark = document.createElement('div');
                watermark.className = 'page-number-watermark';
                p.appendChild(watermark);
            }
            watermark.innerText = `Page ${idx + 1}`;
        });
    }

    function updateAllPages() {
        const s = getStyles();
        document.querySelectorAll('.page').forEach(p => applyStylesToPage(p, s));
    }

    function createPage() {
        if (!editor) return null;
        const container = document.createElement('div');
        container.className = 'page-container';

        const p = document.createElement('div');
        p.className = 'page';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';
        contentDiv.contentEditable = true;
        p.appendChild(contentDiv);

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-page-btn';
        deleteBtn.innerText = 'Delete Page';
        deleteBtn.onclick = () => {
            if (document.querySelectorAll('.page').length > 1) {
                container.remove();
                updatePagination();
            } else {
                alert('You must have at least one page!');
            }
        };

        contentDiv.addEventListener('focus', () => lastActivePage = contentDiv);
        
        container.appendChild(p);
        container.appendChild(deleteBtn);
        editor.appendChild(container);

        applyStylesToPage(p, getStyles());
        updatePagination();
        return contentDiv;
    }

    let overflowTimeout;
    if (editor) {
        editor.addEventListener('input', (e) => {
            if (isFormatting) return;
            clearTimeout(overflowTimeout);
            overflowTimeout = setTimeout(() => {
                const target = e.target;
                if (target.classList.contains('page-content')) {
                    if (target.scrollHeight > target.offsetHeight) {
                        const newPageContent = createPage();
                        if (newPageContent) newPageContent.focus();
                    }
                }
            }, 100);
        });
    }

    async function paginateText(text) {
        if (!editor) return;
        editor.innerHTML = '';
        isFormatting = true;
        let currentPageContent = createPage();
        const words = text.split(/\s+/);
        
        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            if (!word) continue;
            const textNode = document.createTextNode(word + ' ');
            currentPageContent.appendChild(textNode);
            
            if (currentPageContent.scrollHeight > currentPageContent.clientHeight) {
                currentPageContent.removeChild(textNode);
                currentPageContent = createPage();
                currentPageContent.appendChild(textNode);
            }
        }
        isFormatting = false;
        updatePagination();
    }

    const fileUpload = document.getElementById('file-upload');
    if (fileUpload) {
        fileUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (processingOverlay) processingOverlay.style.display = 'flex';
            let text = '';
            try {
                const isDocx = file.name.toLowerCase().endsWith('.docx') || 
                               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                if (file.type === 'application/pdf') {
                    const arrayBuffer = await file.arrayBuffer();
                    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const content = await (await pdf.getPage(i)).getTextContent();
                        text += content.items.map(item => item.str).join(' ');
                    }
                } else if (isDocx && window.mammoth) {
                    const arrayBuffer = await file.arrayBuffer();
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    text = result.value;
                } else { 
                    text = await file.text(); 
                }
                if (!text.trim()) { 
                    alert('No text found in file.'); 
                    if (processingOverlay) processingOverlay.style.display = 'none'; 
                    return; 
                }
                await paginateText(text);
            } catch (err) { 
                alert('Parsing failed: ' + err.message); 
            } finally { 
                if (processingOverlay) processingOverlay.style.display = 'none'; 
            }
        });
    }

    controls.forEach(id => {
        const el = document.getElementById(id);
        if(el) el.addEventListener('input', updateAllPages);
    });
    
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { 
            if (editor) editor.innerHTML = ''; 
            const newPage = createPage(); 
            if (newPage) newPage.focus(); 
        });
    }
    
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async () => {
            if (!window.jspdf || !window.html2canvas) {
                alert('PDF generation libraries are loading, please wait...');
                return;
            }
            const { jsPDF } = window.jspdf;
            const s = getStyles();
            let [w, h] = s.size.split(',').map(Number);
            if (s.orientation === 'landscape') { const t = w; w = h; h = t; }
            const pages = document.querySelectorAll('.page');
            pages.forEach(p => p.style.transform = 'none');
            document.querySelectorAll('.page-number-watermark').forEach(wm => wm.style.display = 'none');
            document.querySelectorAll('.delete-page-btn').forEach(btn => btn.style.display = 'none');
            const pdf = new jsPDF(s.orientation === 'landscape' ? 'l' : 'p', 'mm', [w, h]);
            for (let i = 0; i < pages.length; i++) {
                const canvas = await html2canvas(pages[i], { scale: 2 });
                if (i > 0) pdf.addPage([w, h]);
                pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, w, h);
            }
            pages.forEach(p => p.style.transform = '');
            document.querySelectorAll('.page-number-watermark').forEach(wm => wm.style.display = '');
            document.querySelectorAll('.delete-page-btn').forEach(btn => btn.style.display = '');
            pdf.save('InkScribe-Document.pdf');
        });
    }

    // AI Writer Logic
    if (aiToggleBtn && aiWidget) {
        aiToggleBtn.onclick = () => aiWidget.style.display = aiWidget.style.display === 'none' ? 'flex' : 'none';
        const closeAi = document.getElementById('close-ai');
        if (closeAi) closeAi.onclick = () => aiWidget.style.display = 'none';
    }

    function parseMarkdown(text) {
        return text
            .replace(/^### (.*$)/gim, '<b><span style="font-size: 1.1em">$1</span></b>')
            .replace(/^## (.*$)/gim, '<b><span style="font-size: 1.25em">$1</span></b>')
            .replace(/^# (.*$)/gim, '<b><span style="font-size: 1.5em">$1</span></b>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/\n/g, '<br>');
    }

    const askAiBtn = document.getElementById('ask-ai-btn');
    if (askAiBtn) {
        askAiBtn.onclick = async () => {
            const prompt = aiPrompt ? aiPrompt.value.trim() : '';
            if (!prompt) return alert('Please enter a prompt!');

            if (processingOverlay) processingOverlay.style.display = 'flex';
            if (aiWidget) aiWidget.style.display = 'none';

            try {
                const systemContext = `You are InkScribe AI Writer, an AI assistant built for Docuvate's InkScribe Studio (https://itsrkmahapatra.github.io/Docuvate/inkscribe.html). 
                Task: ${prompt}. 
                Instructions: Provide the content requested accurately and concisely. Use basic markdown (**bold**, *italic*) for formatting. Respond ONLY with the requested content.`;
                
                if (!window.puter) throw new Error("Puter.js library not loaded.");
                const puterResponse = await puter.ai.chat(systemContext);
                let text = "";
                if (puterResponse) {
                    if (typeof puterResponse === 'string') {
                        text = puterResponse;
                    } else if (puterResponse.message) {
                        const content = puterResponse.message.content;
                        if (typeof content === 'string') {
                            text = content;
                        } else if (Array.isArray(content)) {
                            text = content.map(item => {
                                if (typeof item === 'string') return item;
                                if (item && typeof item.text === 'string') return item.text;
                                return '';
                            }).join('');
                        } else if (content) {
                            text = String(content);
                        }
                    } else if (typeof puterResponse.text === 'function') {
                        try {
                            text = await puterResponse.text();
                        } catch (e) {
                            text = String(puterResponse);
                        }
                    } else {
                        text = String(puterResponse);
                    }
                }
                if (typeof text !== 'string') text = String(text);
                let rawText = text.trim();
                
                const htmlContent = parseMarkdown(rawText.trim());
                if (processingOverlay) processingOverlay.style.display = 'none';
                await typeWriter(htmlContent);
            } catch (err) {
                alert('AI writing failed: ' + err.message);
                if (processingOverlay) processingOverlay.style.display = 'none';
            }
        };
    }

    async function typeWriter(html) {
        let target = lastActivePage || document.querySelector('.page-content');
        if (!target) target = createPage();
        if (!target) return;
        target.focus();

        const temp = document.createElement('div');
        temp.innerHTML = html;
        const nodes = Array.from(temp.childNodes);
        
        for (let node of nodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const words = node.textContent.split(' ');
                for (let word of words) {
                    if (!word && words.length > 1) continue;
                    const span = document.createElement('span');
                    span.innerText = word + ' ';
                    target.appendChild(span);
                    
                    if (target.scrollHeight > target.offsetHeight) {
                        target.removeChild(span);
                        target = createPage();
                        if (target) target.appendChild(span);
                    }
                    await new Promise(r => setTimeout(r, 25));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const clone = node.cloneNode(true);
                target.appendChild(clone);
                
                if (target.scrollHeight > target.offsetHeight) {
                    target.removeChild(clone);
                    target = createPage();
                    if (target) target.appendChild(clone);
                }
                await new Promise(r => setTimeout(r, 70));
            }
        }
    }

    // Context Menu Logic
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        document.addEventListener('contextmenu', (e) => {
            if (e.target.closest('.page-content')) {
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.toString().length > 0) {
                    contextMenu.style.display = 'flex';
                    contextMenu.style.visibility = 'hidden';
                    const menuWidth = contextMenu.offsetWidth;
                    const menuHeight = contextMenu.offsetHeight;
                    let posX = e.clientX;
                    let posY = e.clientY;
                    if (posX + menuWidth > window.innerWidth) posX = window.innerWidth - menuWidth - 10;
                    if (posY + menuHeight > window.innerHeight) posY = window.innerHeight - menuHeight - 10;
                    contextMenu.style.left = `${posX + window.scrollX}px`;
                    contextMenu.style.top = `${posY + window.scrollY}px`;
                    contextMenu.style.visibility = 'visible';
                } else { 
                    contextMenu.style.display = 'none'; 
                }
            } else { 
                contextMenu.style.display = 'none'; 
            }
        });

        document.addEventListener('click', (e) => { 
            if (!contextMenu.contains(e.target)) contextMenu.style.display = 'none'; 
        });

        document.querySelectorAll('.cmd-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const cmd = btn.getAttribute('data-cmd');
                const val = btn.getAttribute('data-val');
                document.execCommand(cmd, false, val || null);
                contextMenu.style.display = 'none';
            });
        });

        const ctxSize = document.getElementById('ctx-size');
        if (ctxSize) {
            ctxSize.addEventListener('change', (e) => {
                document.execCommand('fontSize', false, e.target.value);
                contextMenu.style.display = 'none';
            });
        }

        const ctxColor = document.getElementById('ctx-color');
        if (ctxColor) {
            ctxColor.addEventListener('input', (e) => {
                document.execCommand('foreColor', false, e.target.value);
            });
        }
    }

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const savedTheme = localStorage.getItem('inkscribe-theme');
        if (savedTheme === 'light') { 
            document.body.classList.add('light-mode'); 
            themeToggle.innerText = '🌞'; 
        }
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('inkscribe-theme', isLight ? 'light' : 'dark');
            themeToggle.innerText = isLight ? '🌞' : '🌓';
        });
    }

    // Initialize first page
    createPage();
});
