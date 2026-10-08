async function loadSiteContent() {
    try {
        const response = await fetch('content.txt', { cache: 'no-store' });
        if (!response.ok) {
            throw new Error('Could not load content.txt');
        }

        const text = await response.text();
        const sections = parseContentFile(text);

        document.querySelectorAll('[data-content]').forEach((element) => {
            const key = element.dataset.content;
            if (sections[key] !== undefined) {
                renderTextContent(element, sections[key]);
            }
        });

        buildFaqs(sections);
    } catch (error) {
        console.error(error);
    }
}

function parseContentFile(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const sections = {};
    let currentKey = null;
    let buffer = [];

    function saveCurrentSection() {
        if (!currentKey) return;
        sections[currentKey] = buffer.join('\n').trim();
    }

    for (const line of lines) {
        const match = line.match(/^([^\n:]+):\s*$/);

        if (match) {
            saveCurrentSection();
            currentKey = match[1].trim();
            buffer = [];
        } else if (currentKey) {
            buffer.push(line);
        }
    }

    saveCurrentSection();
    return sections;
}

function renderTextContent(element, value) {
    const paragraphs = value
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    element.replaceChildren();

    paragraphs.forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph.replace(/\n/g, ' ');
        element.appendChild(p);
    });
}

function buildFaqs(sections) {
    const container = document.querySelector('[data-faq-container]');
    if (!container) return;

    container.replaceChildren();

    const faqNumbers = Object.keys(sections)
        .map((key) => {
            const match = key.match(/^FAQ (\d+) Question$/i);
            return match ? Number(match[1]) : null;
        })
        .filter((number) => number !== null)
        .sort((a, b) => a - b);

    faqNumbers.forEach((number) => {
        const question = sections[`FAQ ${number} Question`];
        const answer = sections[`FAQ ${number} Answer`];

        if (!question || !answer) return;

        const details = document.createElement('details');
        details.className = 'faq-item';

        const summary = document.createElement('summary');
        summary.textContent = question;

        const answerWrapper = document.createElement('div');
        answerWrapper.className = 'faq-answer';
        renderTextContent(answerWrapper, answer);

        details.append(summary, answerWrapper);
        container.appendChild(details);
    });
}

document.addEventListener('DOMContentLoaded', loadSiteContent);
