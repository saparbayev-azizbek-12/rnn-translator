function debounce(fn,ms){let t;return function(...a){clearTimeout(t);t=setTimeout(()=>fn.apply(this,a),ms)}}
const sourceArea=document.getElementById('source-text'),targetArea=document.getElementById('target-text'),charCount=document.getElementById('char-count'),loader=document.getElementById('loader');
const doTranslate=async()=>{
    const text=sourceArea.value.trim();
    if(!text){targetArea.value='';return}
    loader.style.display='block';
    try{
        const response=await fetch('/translate/',{
            method:'POST',
            headers:{'Content-Type':'application/x-www-form-urlencoded','X-CSRFToken':document.querySelector('[name=csrfmiddlewaretoken]').value},
            body:new URLSearchParams({'text':text})
        });
        const data=await response.json();
        targetArea.value=data.translation||'';
    }catch(e){targetArea.value='Error connecting to server'}
    finally{loader.style.display='none'}
}
sourceArea.addEventListener('input',debounce(()=>{
    charCount.textContent=`${sourceArea.value.length}/5000`;
    doTranslate();
},800));
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='Enter')doTranslate()});
document.getElementById('clear-btn').onclick=()=>{sourceArea.value='';targetArea.value='';charCount.textContent='0/5000'};
const copyIcon='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
const doneIcon='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
document.getElementById('copy-btn').onclick=function(){
    if(!targetArea.value) return;
    navigator.clipboard.writeText(targetArea.value);
    this.innerHTML=doneIcon;
    this.classList.add('success', 'bounce');
    setTimeout(()=>{
        this.innerHTML=copyIcon;
        this.classList.remove('success', 'bounce');
    }, 1000);
};
