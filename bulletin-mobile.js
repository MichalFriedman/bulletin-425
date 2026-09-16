(() => {
  const root=document.documentElement, $=id=>document.getElementById(id);
  const storage={get(k){try{return localStorage.getItem(k)}catch{return null}},set(k,v){try{localStorage.setItem(k,v)}catch{}}};
  const he=$('sec-he'),en=$('sec-en'),drawer=$('drawer'),scrim=$('scrim'),toc=$('tocbtn');
  const sizes=[14,16,18,20,22];let size=Number(storage.get('bul425-size-v2')??1);if(!Number.isInteger(size)||size<0||size>4)size=1;
  const applySize=()=>{root.style.setProperty('--base',sizes[size]+'px');$('smaller').disabled=size===0;$('bigger').disabled=size===4;storage.set('bul425-size-v2',size)};
  $('smaller').onclick=()=>{size=Math.max(0,size-1);applySize()};$('bigger').onclick=()=>{size=Math.min(4,size+1);applySize()};applySize();
  let lastFocus=null;
  function closeDrawer(restore=true){const wasOpen=drawer.classList.contains('open');drawer.classList.remove('open');scrim.classList.remove('open');drawer.inert=true;toc.setAttribute('aria-expanded','false');document.body.style.overflow='';if(wasOpen&&restore)(lastFocus||toc).focus()}
  function openDrawer(){lastFocus=document.activeElement;drawer.inert=false;drawer.classList.add('open');scrim.classList.add('open');toc.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';$('drawerclose').focus()}
  drawer.inert=true;toc.onclick=()=>drawer.classList.contains('open')?closeDrawer():openDrawer();scrim.onclick=()=>closeDrawer();$('drawerclose').onclick=()=>closeDrawer();
  drawer.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const f=[...drawer.querySelectorAll('button,a[href]')].filter(x=>x.getClientRects().length);if(e.shiftKey&&document.activeElement===f[0]){e.preventDefault();f.at(-1).focus()}else if(!e.shiftKey&&document.activeElement===f.at(-1)){e.preventDefault();f[0].focus()}});
  function language(l,scroll=false){const english=l==='en';root.lang=l;root.dir=english?'ltr':'rtl';he.hidden=english;en.hidden=!english;$('drawer-he').hidden=english;$('drawer-en').hidden=!english;$('langbtn').textContent=english?'עברית':'English';$('langbtn').setAttribute('aria-pressed',String(english));$('tocbtn-label').textContent=english?'Contents':'תוכן';drawer.setAttribute('aria-label',english?'Contents':'תוכן העניינים');document.querySelector('.skip-link').href='#sec-'+l;$('smaller').textContent=english?'A':'א';$('bigger').textContent=english?'A':'א';storage.set('bul425-lang',l);if(scroll){history.replaceState(null,'',location.pathname+location.search);window.scrollTo({top:0,behavior:'instant'})}}
  const hashLang=location.hash.match(/^#(he|en)-/)?.[1];language(hashLang||(storage.get('bul425-lang')==='en'?'en':'he'));
  $('langbtn').onclick=()=>{closeDrawer(false);language(root.lang==='he'?'en':'he',true)};
  // Keep the complete scholarship roll readable one recipient at a time.
  document.querySelectorAll('.names p').forEach(p=>{const source=p.querySelector('.src');const content=[...p.childNodes].filter(n=>n!==source).map(n=>n.textContent).join('').trim();if(!content)return;const group=document.createElement('div');group.className='award-group';const heading=document.createElement('h4');heading.className='src';heading.textContent=source?.textContent||'';const list=document.createElement('ul');list.className='awardees';content.split(' · ').forEach(name=>{const li=document.createElement('li'),cut=name.indexOf(', ');if(cut>0){const b=document.createElement('b');b.textContent=name.slice(0,cut);li.append(b,name.slice(cut))}else li.textContent=name;list.append(li)});if(source)group.append(heading);group.append(list);p.replaceWith(group)});
  // The contents list follows the printed page 2: hand-set titles, some articles left out.
  const crossRef={he:{page:'28',title:'הבולטין באנגלית',href:'#en-chairman'},en:{page:'27',title:'The Hebrew Bulletin',href:'#he-chairman'}};
  const tocEntry=(ul,page,text,sub,href,article)=>{const li=document.createElement('li'),link=document.createElement('a'),num=document.createElement('span'),title=document.createElement('span');link.href=href;num.className='n';num.textContent=page;title.className='t';title.textContent=text;if(sub){const d=document.createElement('span');d.className='d';d.textContent=sub;title.append(d)}link.append(num,title);li.append(link);ul.append(li);link.onclick=()=>{closeDrawer(false);if(article){article.tabIndex=-1;article.focus({preventScroll:true})}}};
  [he,en].forEach(sec=>{const l=sec.lang;const entries=[...sec.querySelectorAll('article[id]')];for(const suffix of ['', '-top']){const ul=$('toc-'+l+suffix);if(!ul)continue;entries.forEach(a=>{if(a.dataset.toc==='skip')return;const h=a.querySelector('h2');const text=a.dataset.tocTitle||(h?h.firstChild.textContent.trim():'');if(!text)return;tocEntry(ul,a.dataset.page,text,a.dataset.tocSub,'#'+a.id,a)});const x=crossRef[l];if(x)tocEntry(ul,x.page,x.title,'',x.href,null)}
    entries.forEach(a=>{const b=document.createElement('button');b.type='button';b.className='source-open';b.textContent=l==='he'?'צפייה בעמוד המקורי · '+a.dataset.page:'View original page · '+a.dataset.page;b.dataset.original=a.dataset.source||(l==='he'?a.dataset.page:49-Number(a.dataset.page));a.append(b)})
  });
  // Never leave a single word alone on a line. Paragraph-like blocks tie their last two words (and any trailing mark
  // such as ■) with no-break spaces unless that would overflow the column; headings that still strand a word are
  // eased down in size until no line holds a lone word. Re-run whenever widths can change.
  const WORD=/[\p{L}\p{N}]/u,untied=new Map(),resized=new Set();
  const segments=el=>{const segs=[[]];const walk=n=>{for(const c of n.childNodes){if(c.nodeType===3)segs.at(-1).push(c);else if(c.nodeType===1){if(c.tagName==='BR'||getComputedStyle(c).display!=='inline'){segs.push([]);walk(c);segs.push([])}else walk(c)}}};walk(el);return segs};
  const lonelyLines=el=>{let lonely=0;for(const seg of segments(el)){const mids=[];for(const node of seg){const re=/[^\s ]+/g;let m;while(m=re.exec(node.data)){if(!WORD.test(m[0]))continue;const r=document.createRange();r.setStart(node,m.index);r.setEnd(node,m.index+m[0].length);for(const q of r.getClientRects())if(q.width)mids.push(q.top+q.height/2)}}
    if(mids.length<2)continue;const lines=[];for(const t of mids){const line=lines.find(x=>Math.abs(x.t-t)<5);line?line.n++:lines.push({t,n:1})}if(lines.length>1)lonely+=lines.filter(x=>x.n===1).length}return lonely};
  const setText=(node,data,touched)=>{if(!untied.has(node))untied.set(node,node.data);touched.push([node,node.data]);node.data=data};
  const tie=el=>{const touched=[];
    el.querySelectorAll('.who').forEach(w=>{const n=w.firstChild;if(n?.nodeType===3&&/^\/\s+/.test(n.data))setText(n,n.data.replace(/^\/\s+/,'/ '),touched)});
    for(const seg of segments(el)){let token='';outer:for(let k=seg.length-1;k>=0;k--){const node=seg[k];let t=node.data;for(let i=t.length-1;i>=0;i--){if(!/\s/.test(t[i])||t[i]===' '&&!token){token=t[i]+token;continue}if(!token)continue;let j=i;while(j>0&&/\s/.test(t[j-1]))j--;t=t.slice(0,j)+' '+t.slice(i+1);setText(node,t,touched);i=j;if(WORD.test(token))break outer;token=''}}}
    return touched};
  const undo=touched=>{for(const [node,data] of [...touched].reverse())node.data=data};
  const overflows=el=>el.scrollWidth>el.clientWidth+1;
  const tieBlock=el=>{let touched=tie(el);if(touched.length&&overflows(el)){undo(touched);touched=[]}
    if(!el.matches('h2,h3,h4,td,.std-award,.notice-lead,.notice-over,.notice-thanks,.mem-name,.note'))return;
    if(touched.length&&lonelyLines(el)){const tiedCount=lonelyLines(el),tied=touched.map(([node])=>[node,node.data]);undo(touched);if(lonelyLines(el)>=tiedCount)tied.forEach(([node,data])=>node.data=data);else touched=[]}
    if(!lonelyLines(el))return;const base=parseFloat(getComputedStyle(el).fontSize);resized.add(el);
    for(let f=.96;f>=.6&&lonelyLines(el);f-=.04){el.style.setProperty('font-size',(base*f).toFixed(1)+'px','important');if(!touched.length){touched=tie(el);if(touched.length&&overflows(el)){undo(touched);touched=[]}}}};
  const retie=()=>{untied.forEach((data,node)=>node.data=data);untied.clear();resized.forEach(el=>el.style.removeProperty('font-size'));resized.clear();const l=root.lang==='en'?'en':'he';document.querySelectorAll(`#sec-${l} :is(p,li,figcaption,h2,h3,h4,td):not(.sr,.lbl),#drawer-${l} li`).forEach(tieBlock)};
  let lastWidth=innerWidth,resizeTimer;retie();document.fonts?.ready.then(retie);
  new MutationObserver(retie).observe(root,{attributes:true,attributeFilter:['lang']});
  ['smaller','bigger'].forEach(id=>$(id).addEventListener('click',retie));
  window.addEventListener('resize',()=>{if(innerWidth===lastWidth)return;lastWidth=innerWidth;clearTimeout(resizeTimer);resizeTimer=setTimeout(retie,150)});
  const reader=$('original-reader'),pageImg=$('original-page'),select=$('page-select');let page=1;
  for(let i=1;i<=48;i++){const o=document.createElement('option');o.value=i;o.textContent=i;select.append(o)}
  function showPage(n){page=Math.min(48,Math.max(1,n));select.value=page;pageImg.src='assets/pages/page-'+String(page).padStart(2,'0')+'.webp';pageImg.alt=(root.lang==='en'?'Original issue, page ':'הגיליון המקורי, עמוד ')+page;$('page-prev').disabled=page===1;$('page-next').disabled=page===48;document.querySelector('.reader-canvas').scrollTo(0,0)}
  document.addEventListener('click',e=>{const b=e.target.closest('[data-original]');if(!b)return;$('reader-title').textContent=root.lang==='en'?'The original issue':'הגיליון המקורי';$('reader-close').textContent=root.lang==='en'?'Close ✕':'סגירה ✕';$('page-label').textContent=root.lang==='en'?'Page':'עמוד';$('page-prev').setAttribute('aria-label',root.lang==='en'?'Previous page':'עמוד קודם');$('page-next').setAttribute('aria-label',root.lang==='en'?'Next page':'עמוד הבא');$('page-zoom').setAttribute('aria-label',root.lang==='en'?'Zoom original page':'הגדלת העמוד המקורי');showPage(Number(b.dataset.original));reader.showModal();document.body.style.overflow='hidden'});
  $('reader-close').onclick=()=>reader.close();reader.addEventListener('close',()=>{document.body.style.overflow='';document.querySelector('.reader-canvas').classList.remove('zoomed');$('page-zoom').setAttribute('aria-pressed','false')});
  $('page-prev').onclick=()=>showPage(page-1);$('page-next').onclick=()=>showPage(page+1);select.onchange=()=>showPage(Number(select.value));$('page-zoom').onclick=()=>{const on=document.querySelector('.reader-canvas').classList.toggle('zoomed');$('page-zoom').setAttribute('aria-pressed',String(on))};
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();if(reader.open&&e.target.tagName!=='SELECT'){if(e.key==='ArrowRight')showPage(page+1);if(e.key==='ArrowLeft')showPage(page-1)}});
  window.addEventListener('hashchange',()=>{const l=location.hash.match(/^#(he|en)-/)?.[1];if(l&&l!==root.lang){language(l);document.querySelector(location.hash)?.scrollIntoView()}});
  $('totop').onclick=()=>window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  let scheduled=false;window.addEventListener('scroll',()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{$('totop').classList.toggle('show',scrollY>900);const height=document.documentElement.scrollHeight-innerHeight;document.querySelector('.reading-progress span').style.width=(height>0?100*scrollY/height:0)+'%';scheduled=false})},{passive:true});
})();
