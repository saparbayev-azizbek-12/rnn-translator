function debounce(fn, ms) {
    let t;
    return function (...a) {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, a), ms);
    };
}

const sourceArea = document.getElementById('source-text');
const targetArea = document.getElementById('target-text');
const charCount = document.getElementById('char-count');
const loader = document.getElementById('loader');
const checkAltBtn = document.getElementById('check-alt-btn');
const alternativeBox = document.getElementById('alternative-box');
const altText = document.getElementById('alt-text');
const swapBtn = document.getElementById('swap-btn');
const srcTabs = document.getElementById('src-tabs');
const tgtTabs = document.getElementById('tgt-tabs');
const srcIndicator = document.getElementById('src-indicator');
const tgtIndicator = document.getElementById('tgt-indicator');

let currentSrcLang = 'fra';
let currentTgtLang = 'eng';
const languages = ['eng', 'rus', 'fra'];

const updateIndicator = (side) => {
    const parent = document.getElementById(`${side}-tabs`);
    const activeTab = parent.querySelector('.lang-tab.active');
    const indicator = side === 'src' ? srcIndicator : tgtIndicator;
    if (activeTab && indicator) {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
    }
};

const modelSelector = document.getElementById('model-selector');

const updateTabUI = () => {
    // Update Source Tabs
    Array.from(srcTabs.querySelectorAll('.lang-tab')).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === currentSrcLang);
    });
    // Update Target Tabs
    Array.from(tgtTabs.querySelectorAll('.lang-tab')).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === currentTgtLang);
    });
    
    // Update active model selector
    const currentModel = getModelId();
    modelSelector.value = currentModel;

    // Update indicators
    updateIndicator('src');
    updateIndicator('tgt');
    
    // Clear results when switching
    targetArea.value = '';
    alternativeBox.style.display = 'none';
};

// Handle model selector change
modelSelector.addEventListener('change', () => {
    const [src, tgt] = modelSelector.value.split('-');
    currentSrcLang = src;
    currentTgtLang = tgt;
    updateTabUI();
    doTranslate();
});

const getModelId = () => `${currentSrcLang}-${currentTgtLang}`;

const handleTabClick = (side, lang) => {
    if (side === 'src') {
        if (lang === currentTgtLang) {
            // Collision! Move target to next language
            const idx = languages.indexOf(lang);
            currentTgtLang = languages[(idx + 1) % languages.length];
        }
        currentSrcLang = lang;
    } else {
        if (lang === currentSrcLang) {
            // Collision! Move source to next language
            const idx = languages.indexOf(lang);
            currentSrcLang = languages[(idx + 1) % languages.length];
        }
        currentTgtLang = lang;
    }
    updateTabUI();
    doTranslate();
};

// Add event listeners to tabs
Array.from(srcTabs.children).forEach(tab => {
    tab.addEventListener('click', () => handleTabClick('src', tab.dataset.lang));
});
Array.from(tgtTabs.children).forEach(tab => {
    tab.addEventListener('click', () => handleTabClick('tgt', tab.dataset.lang));
});

const doTranslate = async () => {
    const text = sourceArea.value.trim();
    if (!text) {
        targetArea.value = '';
        alternativeBox.style.display = 'none';
        return;
    }

    loader.style.display = 'block';
    alternativeBox.style.display = 'none';

    try {
        const formData = new URLSearchParams();
        formData.append('text', text);
        formData.append('model', getModelId());

        const response = await fetch('/translate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: formData
        });

        const data = await response.json();
        targetArea.value = data.translation || '';
    } catch (e) {
        targetArea.value = 'Error connecting to server';
    } finally {
        loader.style.display = 'none';
    }
};

const fetchAlternative = async () => {
    const text = sourceArea.value.trim();
    if (!text) return;

    checkAltBtn.textContent = 'Checking...';
    checkAltBtn.disabled = true;

    try {
        const formData = new URLSearchParams();
        formData.append('text', text);
        formData.append('model', getModelId());

        const res = await fetch('/alternative-translate/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: formData
        });
        
        const data = await res.json();
        altText.textContent = data.translation || 'No alternative available';
        alternativeBox.style.display = 'block';
    } catch (e) {
        altText.textContent = 'Error fetching alternative: ' + e.message;
        alternativeBox.style.display = 'block';
    } finally {
        checkAltBtn.textContent = 'Check Alternative';
        checkAltBtn.disabled = false;
    }
};

sourceArea.addEventListener('input', debounce(() => {
    charCount.textContent = `${sourceArea.value.length}/5000`;
    doTranslate();
}, 800));

swapBtn.addEventListener('click', () => {
    const temp = currentSrcLang;
    currentSrcLang = currentTgtLang;
    currentTgtLang = temp;
    
    // Swap text content
    const sText = sourceArea.value;
    const tText = targetArea.value;
    sourceArea.value = tText;
    targetArea.value = sText;
    
    updateTabUI();
    doTranslate();
});

checkAltBtn.addEventListener('click', fetchAlternative);

document.getElementById('clear-btn').onclick = () => {
    sourceArea.value = '';
    targetArea.value = '';
    charCount.textContent = '0/5000';
    alternativeBox.style.display = 'none';
};

const copyBtn = document.getElementById('copy-btn');
const originalCopyIcon = copyBtn.innerHTML;
const doneIcon = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#1a73e8" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;

copyBtn.onclick = () => {
    if (!targetArea.value) return;
    navigator.clipboard.writeText(targetArea.value).then(() => {
        copyBtn.innerHTML = doneIcon;
        copyBtn.classList.add('bounce');
        setTimeout(() => {
            copyBtn.innerHTML = originalCopyIcon;
            copyBtn.classList.remove('bounce');
        }, 2000);
    });
};

// Initial state
window.addEventListener('load', updateTabUI);
window.addEventListener('resize', () => {
    updateIndicator('src');
    updateIndicator('tgt');
});
