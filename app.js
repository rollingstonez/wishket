import {databaseStatus,isCloudStorage,currentUser,signIn,signOut,loadGallery,saveGallery,restoreDemoData,initialData,imageSet} from './storage.js';

const $=(selector,root=document)=>root.querySelector(selector);
const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
const safe=(value='')=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let data;

function formatDate(start,end){
  if(!start)return '';
  const a=new Date(`${start}T00:00:00`),b=end?new Date(`${end}T00:00:00`):null;
  const fmt=d=>`${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}`;
  return b?`${fmt(a)} — ${String(b.getMonth()+1).padStart(2,'0')}. ${String(b.getDate()).padStart(2,'0')}`:fmt(a);
}
function imageStyle(url,fallback){return `style="background-image:url('${safe(url||fallback)}')"`;}

function renderHome(){
  const live=data.exhibitions.filter(item=>item.published);
  const artists=data.artists.filter(item=>item.published);
  const works=data.artworks.filter(item=>item.published);
  const hero=live[0];
  if(hero){
    const heroPhoto=$('.hero-photo');
    if(heroPhoto)heroPhoto.style.backgroundImage=`linear-gradient(90deg,rgba(20,22,19,.08),rgba(20,22,19,0)),url('${hero.image}')`;
    const copy=$('.hero-copy');
    if(copy)copy.innerHTML=`<p class="eyebrow">CURRENT EXHIBITION　/　SEOUL</p><h1>${safe(hero.title).replace(/, /g,',<br>')}</h1><p class="hero-sub">${safe(hero.artist)}</p><p class="hero-date">${safe(formatDate(hero.start,hero.end))}</p><a class="text-link" href="#exhibitions">전시 둘러보기 <span>↗</span></a>`;
  }
  const exGrid=$('.exhibition-grid');
  if(exGrid)exGrid.innerHTML=live.map((item,index)=>`<article class="ex-card"><a class="art-image" ${imageStyle(item.image,imageSet[index%imageSet.length])} href="#about"><span class="image-index">${String(index+1).padStart(2,'0')}</span></a><div class="card-meta"><span>${index===0?'현재 전시':'전시 프로그램'}</span><span>${safe(formatDate(item.start,item.end))}</span></div><h3>${safe(item.title)}</h3><p>${safe(item.artist)}</p></article>`).join('')||'<p>현재 소개 중인 전시가 없습니다.</p>';
  const artistGrid=$('.artist-cards');
  if(artistGrid)artistGrid.innerHTML=artists.map((artist,index)=>`<a class="artist-card" href="#archive"><div class="artist-portrait" ${imageStyle(artist.image,imageSet[index%imageSet.length])}></div><h3>${safe(artist.name)}</h3><p>${safe(artist.field)}　/　${safe(artist.birth)}</p><p class="artist-bio">${safe(artist.bio)}</p></a>`).join('')||'<p>공개된 작가가 없습니다.</p>';
  const filters=$('.archive-filter');
  if(filters)filters.innerHTML=`<button class="active" data-artist-filter="all">전체</button>${artists.map(artist=>`<button data-artist-filter="${safe(artist.name)}">${safe(artist.name)}</button>`).join('')}`;
  const archive=$('.archive-grid');
  if(archive)archive.innerHTML=works.map((work,index)=>`<article class="archive-item" data-artist="${safe(work.artist)}"><a class="art-image" ${imageStyle(work.image,imageSet[index%imageSet.length])} href="#archive"><span class="image-index">${safe(work.year)}</span></a><h3>${safe(work.title)}</h3><p>${safe(work.artist)}</p><div class="archive-meta"><span>${safe(work.medium)}</span><span>${safe(work.size)}</span></div></article>`).join('')||'<p>공개된 작품이 없습니다.</p>';
  filters?.addEventListener('click',event=>{
    const button=event.target.closest('[data-artist-filter]');if(!button)return;
    $$('.archive-filter button').forEach(item=>item.classList.toggle('active',item===button));
    $$('.archive-item').forEach(item=>item.hidden=button.dataset.artistFilter!=='all'&&item.dataset.artist!==button.dataset.artistFilter);
  });
  $('.menu-toggle')?.addEventListener('click',()=>$('.main-nav')?.classList.toggle('open'));
}

const fields={
  artist:[['name','작가명','text',true],['english','영문 표기','text',false],['field','분야','text',true],['birth','출생 연도','text',false],['image','대표 이미지 URL','url',true],['bio','작가 소개','textarea',true]],
  artwork:[['title','작품명','text',true],['artist','작가','text',true],['year','제작 연도','text',true],['medium','재료 및 기법','text',true],['size','작품 크기','text',true],['image','작품 이미지 URL','url',true]],
  exhibition:[['title','전시명','text',true],['artist','작가 또는 기획','text',true],['start','시작일','date',true],['end','종료일','date',true],['image','전시 이미지 URL','url',true]]
};
const kinds={artist:'artists',artwork:'artworks',exhibition:'exhibitions'};
const labels={artist:'작가',artwork:'작품',exhibition:'전시'};
let editContext=null;
function toast(message){const element=$('#toast');if(!element)return;element.textContent=message;element.classList.add('visible');clearTimeout(toast.timer);toast.timer=setTimeout(()=>element.classList.remove('visible'),2600);}

function renderAdmin(){
  const artworks=data.artworks,artists=data.artists,exhibitions=data.exhibitions;
  $('#stat-exhibitions').textContent=exhibitions.filter(x=>x.published).length;
  $('#stat-artists').textContent=artists.filter(x=>x.published).length;
  $('#stat-artworks').textContent=artworks.filter(x=>x.published).length;
  $('#stat-hidden').textContent=[...artworks,...artists,...exhibitions].filter(x=>!x.published).length;
  const query=($('#artwork-search')?.value||'').trim().toLowerCase();
  const status=$('#artwork-status')?.value||'all';
  const visible=artworks.filter(item=>(!query||`${item.title} ${item.artist}`.toLowerCase().includes(query))&&(status==='all'||(status==='published')===item.published));
  $('#artwork-count').textContent=`${visible.length}개`;
  $('#artwork-empty').hidden=visible.length>0;
  $('#artwork-rows').innerHTML=visible.map(item=>`<tr><td><div class="show-cell"><span class="mini-art" ${imageStyle(item.image,imageSet[0])}></span><strong>${safe(item.title)}</strong></div></td><td>${safe(item.artist)}</td><td>${safe(item.year)}</td><td>${safe(item.medium)}</td><td>${safe(item.size)}</td><td><button class="visibility-toggle ${item.published?'is-live':''}" data-action="toggle" data-kind="artwork" data-id="${safe(item.id)}">${item.published?'공개':'비공개'}</button></td><td><div class="row-actions"><button data-action="edit" data-kind="artwork" data-id="${safe(item.id)}">수정</button><button class="danger-link" data-action="delete" data-kind="artwork" data-id="${safe(item.id)}">삭제</button></div></td></tr>`).join('');
  $('#artist-rows').innerHTML=artists.map(item=>`<article class="artist-row"><img src="${safe(item.image)}" alt=""><div class="artist-row-copy"><strong>${safe(item.name)} <small>${safe(item.english)}</small></strong><small>${safe(item.field)}${item.birth?` · ${safe(item.birth)}`:''}</small><p>${safe(item.bio)}</p></div><button class="visibility-toggle ${item.published?'is-live':''}" data-action="toggle" data-kind="artist" data-id="${safe(item.id)}">${item.published?'공개':'비공개'}</button><div class="row-actions"><button data-action="edit" data-kind="artist" data-id="${safe(item.id)}">수정</button><button class="danger-link" data-action="delete" data-kind="artist" data-id="${safe(item.id)}">삭제</button></div></article>`).join('')||'<p class="empty-state">등록된 작가가 없습니다.</p>';
  $('#exhibition-rows').innerHTML=exhibitions.map(item=>`<article class="exhibition-row"><span class="mini-art" ${imageStyle(item.image,imageSet[0])}></span><div><strong>${safe(item.title)}</strong><small>${safe(item.artist)} · ${safe(formatDate(item.start,item.end))}</small></div><button class="visibility-toggle ${item.published?'is-live':''}" data-action="toggle" data-kind="exhibition" data-id="${safe(item.id)}">${item.published?'공개':'비공개'}</button><div class="row-actions"><button data-action="edit" data-kind="exhibition" data-id="${safe(item.id)}">수정</button><button class="danger-link" data-action="delete" data-kind="exhibition" data-id="${safe(item.id)}">삭제</button></div></article>`).join('')||'<p class="empty-state">등록된 전시가 없습니다.</p>';
}

function openEditor(kind,item){
  editContext={kind,item};
  $('#form-eyebrow').textContent=labels[kind].toUpperCase();
  $('#form-title').textContent=`${item?'수정':'등록'} ${labels[kind]}`;
  const html=fields[kind].map(([key,label,type,required])=>`<label class="form-field ${type==='textarea'?'full-field':''}"><span>${label}${required?' <em>*</em>':''}</span>${type==='textarea'?`<textarea name="${key}" rows="5" ${required?'required':''}>${safe(item?.[key]||'')}</textarea>`:`<input name="${key}" type="${type}" value="${safe(item?.[key]||'')}" ${required?'required':''} ${key==='image'?'placeholder="https://…"':''}>`}</label>`).join('');
  $('#form-fields').innerHTML=`<div class="form-grid">${html}</div><label class="publish-check"><input type="checkbox" name="published" ${item?.published?'checked':''}> 홈페이지에 공개</label>`;
  $('#content-dialog').showModal();
}
function closeEditor(){$('#content-dialog').close();editContext=null;}
async function persist(message){try{const saved=await saveGallery(data);if(saved)data=saved;renderAdmin();toast(message);}catch(error){toast(`저장 실패: ${error.message}`);}}

async function initAdmin(){
  const note=$('.prototype-note');
  if(note){
    note.innerHTML=`<strong>${isCloudStorage()?'원격 저장소':'브라우저 저장'}</strong><span>${isCloudStorage()?'홈페이지와 관리자 콘텐츠가 Supabase에 저장됩니다.':'현재 이 브라우저에만 저장됩니다. 원격 저장소 연결은 설정이 필요합니다.'}</span><span class="storage-state">${safe(databaseStatus())}</span><button id="reset-demo" type="button">예시 데이터 복원</button>`;
    if(isCloudStorage()){
      const user=currentUser();
      const login=document.createElement('form');login.className='admin-login';login.innerHTML=user?`<span>${safe(user.email||'큐레이터')} 로그인</span><button type="button" id="logout-button">로그아웃</button>`:`<input name="email" type="email" placeholder="큐레이터 이메일" required><input name="password" type="password" placeholder="비밀번호" required><button type="submit">로그인</button>`;
      note.after(login);
      login.addEventListener('submit',async event=>{event.preventDefault();const form=new FormData(login);try{await signIn(form.get('email'),form.get('password'));location.reload();}catch(error){toast(`로그인 실패: ${error.message}`);}});
      $('#logout-button')?.addEventListener('click',()=>{signOut();location.reload();});
    }
  }
  $('#reset-demo').onclick=async()=>{if(!confirm('현재 콘텐츠를 예시 데이터로 바꿀까요?'))return;try{data=await restoreDemoData();renderAdmin();toast('예시 데이터를 복원했습니다.');}catch(error){toast(`복원 실패: ${error.message}`);}};
  $('#new-artwork').onclick=$('#new-artwork-top').onclick=$('#new-artwork-empty').onclick=()=>openEditor('artwork');
  $('#new-artist').onclick=()=>openEditor('artist');$('#new-exhibition').onclick=()=>openEditor('exhibition');
  $('#artwork-search').oninput=renderAdmin;$('#artwork-status').onchange=renderAdmin;
  $('#content-form').onsubmit=async event=>{
    event.preventDefault();if(!editContext)return;
    const context=editContext,form=new FormData(event.currentTarget),kind=context.kind,key=kinds[kind];
    const item=Object.fromEntries(fields[kind].map(([field])=>[field,form.get(field)]));
    item.published=form.has('published');
    if(context.item){item.id=context.item.id;item.sort_order=context.item.sort_order||0;data[key]=data[key].map(old=>old.id===item.id?item:old);}
    else{item.id=`${kind==='artist'?'a':kind==='artwork'?'w':'e'}${Date.now()}`;item.sort_order=data[key].length;data[key].push(item);}
    closeEditor();await persist(`${labels[kind]} 정보를 저장했습니다.`);
  };
  $('#close-dialog').onclick=$('#cancel-dialog').onclick=closeEditor;
  $('#content-dialog').addEventListener('click',event=>{if(event.target===$('#content-dialog'))closeEditor();});
  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');if(!button)return;
    const kind=button.dataset.kind,key=kinds[kind],item=data[key].find(row=>row.id===button.dataset.id);if(!item)return;
    if(button.dataset.action==='edit'){openEditor(kind,item);return;}
    if(button.dataset.action==='delete'){
      if(!confirm(`${labels[kind]} “${item.title||item.name}”을(를) 삭제할까요?`))return;
      data[key]=data[key].filter(row=>row.id!==item.id);
    }else item.published=!item.published;
    await persist(button.dataset.action==='delete'?'삭제했습니다.':item.published?'홈페이지에 공개했습니다.':'비공개로 변경했습니다.');
  });
  renderAdmin();
}

async function init(){
  try{data=await loadGallery({admin:location.pathname.endsWith('admin.html')});}
  catch(error){data=JSON.parse(JSON.stringify(initialData));toast(`저장소 연결 오류: ${error.message}`);}
  if(location.pathname.endsWith('admin.html'))await initAdmin();else renderHome();
}
init();
