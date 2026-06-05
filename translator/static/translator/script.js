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
const modelSelector = document.getElementById('model-selector');

const langSearchOverlay = document.getElementById('lang-search-overlay');
const langSearchInput = document.getElementById('lang-search-input');
const closeOverlay = document.getElementById('close-overlay');
const allLangsList = document.getElementById('all-langs-list');

const srcCompactBtn = document.getElementById('src-compact-btn');
const tgtCompactBtn = document.getElementById('tgt-compact-btn');

let currentSrcLang = 'fra';
let currentTgtLang = 'eng';
let activeOverlaySide = null;

const langData = {
    'eng': 'English',
    'rus': 'Russian',
    'fra': 'French'
};

const languages = Object.keys(langData);

const updateIndicator = (side) => {
    const parent = document.getElementById(`${side}-tabs`);
    const activeTab = parent.querySelector('.lang-tab.active');
    const indicator = side === 'src' ? srcIndicator : tgtIndicator;
    if (activeTab && indicator && activeTab.offsetParent !== null) {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
    }
};

const updateTabUI = () => {
    // Update Desktop Tabs
    Array.from(srcTabs.querySelectorAll('.lang-tab')).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === currentSrcLang);
    });
    Array.from(tgtTabs.querySelectorAll('.lang-tab')).forEach(tab => {
        tab.classList.toggle('active', tab.dataset.lang === currentTgtLang);
    });
    
    // Update Compact Selectors
    if (srcCompactBtn) srcCompactBtn.querySelector('.current-lang-name').textContent = langData[currentSrcLang];
    if (tgtCompactBtn) tgtCompactBtn.querySelector('.current-lang-name').textContent = langData[currentTgtLang];

    // Update active model selector
    modelSelector.value = getModelId();

    // Update indicators
    updateIndicator('src');
    updateIndicator('tgt');
    
    targetArea.value = '';
    alternativeBox.style.display = 'none';
};

const getModelId = () => `${currentSrcLang}-${currentTgtLang}`;

const handleLangSelect = (lang) => {
    if (activeOverlaySide === 'src') {
        if (lang === currentTgtLang) {
            currentTgtLang = languages.find(l => l !== lang);
        }
        currentSrcLang = lang;
    } else {
        if (lang === currentSrcLang) {
            currentSrcLang = languages.find(l => l !== lang);
        }
        currentTgtLang = lang;
    }
    closeLangSearch();
    updateTabUI();
    doTranslate();
};

const openLangSearch = (side) => {
    activeOverlaySide = side;
    langSearchOverlay.style.display = 'flex';
    langSearchInput.value = '';
    renderLangList();
    langSearchInput.focus();
};

const closeLangSearch = () => {
    langSearchOverlay.style.display = 'none';
    activeOverlaySide = null;
};

const renderLangList = (filter = '') => {
    allLangsList.innerHTML = '';
    const currentActive = activeOverlaySide === 'src' ? currentSrcLang : currentTgtLang;

    languages
        .filter(l => langData[l].toLowerCase().includes(filter.toLowerCase()))
        .forEach(langCode => {
            const item = document.createElement('div');
            item.className = `lang-item ${langCode === currentActive ? 'selected' : ''}`;
            item.innerHTML = `
                <span>${langData[langCode]}</span>
                ${langCode === currentActive ? '<svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' : ''}
            `;
            item.addEventListener('click', () => handleLangSelect(langCode));
            allLangsList.appendChild(item);
    });
};

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

const handleTabClick = (side, lang) => {
    if (side === 'src') {
        if (lang === currentTgtLang) {
            const idx = languages.indexOf(lang);
            currentTgtLang = languages[(idx + 1) % languages.length];
        }
        currentSrcLang = lang;
    } else {
        if (lang === currentSrcLang) {
            const idx = languages.indexOf(lang);
            currentSrcLang = languages[(idx + 1) % languages.length];
        }
        currentTgtLang = lang;
    }
    updateTabUI();
    doTranslate();
};

// Listeners
Array.from(srcTabs.querySelectorAll('.lang-tab')).forEach(tab => {
    tab.addEventListener('click', () => handleTabClick('src', tab.dataset.lang));
});
Array.from(tgtTabs.querySelectorAll('.lang-tab')).forEach(tab => {
    tab.addEventListener('click', () => handleTabClick('tgt', tab.dataset.lang));
});

srcCompactBtn.addEventListener('click', () => openLangSearch('src'));
tgtCompactBtn.addEventListener('click', () => openLangSearch('tgt'));
closeOverlay.addEventListener('click', closeLangSearch);
langSearchInput.addEventListener('input', (e) => renderLangList(e.target.value));

modelSelector.addEventListener('change', () => {
    const [src, tgt] = modelSelector.value.split('-');
    currentSrcLang = src;
    currentTgtLang = tgt;
    updateTabUI();
    doTranslate();
});

sourceArea.addEventListener('input', debounce(() => {
    charCount.textContent = `${sourceArea.value.length}/5000`;
    doTranslate();
}, 800));

swapBtn.addEventListener('click', () => {
    const temp = currentSrcLang;
    currentSrcLang = currentTgtLang;
    currentTgtLang = temp;
    const sText = sourceArea.value;
    sourceArea.value = targetArea.value;
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
copyBtn.onclick = () => {
    if (!targetArea.value) return;
    navigator.clipboard.writeText(targetArea.value).then(() => {
        copyBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24"><path fill="#1a73e8" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>`;
        copyBtn.classList.add('bounce');
        setTimeout(() => {
            copyBtn.innerHTML = originalCopyIcon;
            copyBtn.classList.remove('bounce');
        }, 2000);
    });
};

window.addEventListener('load', updateTabUI);
window.addEventListener('resize', () => {
    updateIndicator('src');
    updateIndicator('tgt');
});
