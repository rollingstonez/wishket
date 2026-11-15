const STORAGE_KEY = 'atelier-seoul-curator-v1';
const SESSION_KEY = 'atelier-curator-session';
const env = window.ATELIER_CONFIG || {};
const supabaseUrl = (env.supabaseUrl || '').replace(/\/$/, '');
const supabaseKey = env.supabaseAnonKey || '';
const cloudEnabled = Boolean(supabaseUrl && supabaseKey);

export const imageSet = [
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1000&q=85',
  'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?auto=format&fit=crop&w=1000&q=85'
];

export const initialData = {
  artists: [
    {id:'a1',name:'김서윤',english:'SEO YUN KIM',field:'회화 · 설치',birth:'1988',bio:'일상의 빛과 기억이 겹쳐지는 순간을 회화와 설치로 기록합니다.',image:imageSet[0],published:true},
    {id:'a2',name:'한도현',english:'HAN DOHYUN',field:'회화',birth:'1991',bio:'색의 깊이와 풍경 사이에서 새로운 감각을 탐구합니다.',image:imageSet[1],published:true},
    {id:'a3',name:'이은결',english:'LEE EUNGYEOL',field:'조각 · 설치',birth:'1985',bio:'물성과 여백이 만드는 관계를 조각으로 표현합니다.',image:imageSet[2],published:true},
    {id:'a4',name:'정하린',english:'JUNG HARIN',field:'사진',birth:'1993',bio:'기억 속 풍경과 천천히 사라지는 장면을 수집합니다.',image:imageSet[3],published:true}
  ],
  artworks: [
    {id:'w1',title:'빛의 가장자리',artist:'김서윤',year:'2026',medium:'캔버스에 유채',size:'80 × 100 cm',image:imageSet[0],published:true},
    {id:'w2',title:'고요의 표면 03',artist:'한도현',year:'2025',medium:'캔버스에 아크릴',size:'60 × 80 cm',image:imageSet[1],published:true},
    {id:'w3',title:'사이의 형태',artist:'이은결',year:'2025',medium:'석고, 안료',size:'가변 크기',image:imageSet[2],published:true},
    {id:'w4',title:'오후의 기록',artist:'정하린',year:'2024',medium:'아카이벌 피그먼트 프린트',size:'40 × 60 cm',image:imageSet[3],published:true},
    {id:'w5',title:'겹쳐진 시간',artist:'김서윤',year:'2024',medium:'캔버스에 혼합 재료',size:'72 × 91 cm',image:imageSet[4],published:true},
    {id:'w6',title:'먼 곳의 정원',artist:'한도현',year:'2023',medium:'캔버스에 유채',size:'50 × 70 cm',image:imageSet[5],published:false}
  ],
  exhibitions: [
    {id:'e1',title:'색의 가장자리, 머무는 빛',artist:'김서윤 개인전',start:'2026-11-05',end:'2026-12-19',image:imageSet[0],published:true},
    {id:'e2',title:'조용한 표면들',artist:'한도현 개인전',start:'2027-01-14',end:'2027-02-28',image:imageSet[1],published:true},
    {id:'e3',title:'감각의 기록',artist:'기획전',start:'2026-08-21',end:'2026-10-10',image:imageSet[2],published:false}
  ]
};

const tableNames = {artists:'gallery_artists',artworks:'gallery_artworks',exhibitions:'gallery_exhibitions'};
const localClone = value => JSON.parse(JSON.stringify(value));
const readSession = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
let session = readSession();

const toRemote = (kind, item, sort_order) => {
  const common={published:Boolean(item.published),sort_order:Number(item.sort_order ?? sort_order)};
  if(item.id&&!/^(a|w|e)\d+$/.test(item.id))common.id=item.id;
  if(kind==='artists')return {...common,name:item.name,english:item.english||'',field:item.field||'',birth:item.birth||'',bio:item.bio||'',image:item.image||''};
  if(kind==='artworks')return {...common,title:item.title,artist:item.artist,year:String(item.year),medium:item.medium,size:item.size,image:item.image};
  return {...common,title:item.title,artist:item.artist,start_date:item.start,end_date:item.end,image:item.image};
};
const fromRemote = (kind,row) => {
  const common={id:row.id,published:Boolean(row.published),sort_order:row.sort_order||0};
  if(kind==='artists')return {...common,name:row.name,english:row.english||'',field:row.field||'',birth:row.birth||'',bio:row.bio||'',image:row.image||''};
  if(kind==='artworks')return {...common,title:row.title,artist:row.artist,year:String(row.year),medium:row.medium,size:row.size,image:row.image};
  return {...common,title:row.title,artist:row.artist,start:row.start_date,end:row.end_date,image:row.image};
};

async function refreshSession() {
  if(!cloudEnabled || !session?.refresh_token) return;
  if(session.expires_at && session.expires_at * 1000 > Date.now() + 60000) return;
  const response=await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{apikey:supabaseKey,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:session.refresh_token})});
  const next=await response.json();
  if(!response.ok){signOut();return;}
  session={...session,...next,expires_at:next.expires_at || Math.floor(Date.now()/1000)+(next.expires_in||3600)};
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
}
async function request(path, {method='GET',body,prefer}={}) {
  await refreshSession();
  const response=await fetch(`${supabaseUrl}/rest/v1/${path}`,{method,headers:{apikey:supabaseKey,Authorization:`Bearer ${session?.access_token||supabaseKey}`,...(body?{'Content-Type':'application/json'}:{}),...(prefer?{Prefer:prefer}:{})},body:body?JSON.stringify(body):undefined});
  if(!response.ok){const error=await response.json().catch(()=>({message:'저장소 요청에 실패했습니다.'}));throw new Error(error.message||error.hint||`Supabase 오류 (${response.status})`);}
  if(response.status===204)return null;
  return response.json();
}

export const databaseStatus = () => cloudEnabled ? '원격 데이터베이스 설정됨' : '이 브라우저에 저장';
export const isCloudStorage = () => cloudEnabled;
export function currentUser(){return session?.user||null;}
export async function signIn(email,password){
  if(!cloudEnabled)throw new Error('Supabase URL과 공개 키 설정이 필요합니다.');
  const response=await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:supabaseKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const next=await response.json();
  if(!response.ok)throw new Error(next.msg||next.message||'로그인에 실패했습니다.');
  session={...next,expires_at:next.expires_at || Math.floor(Date.now()/1000)+(next.expires_in||3600)};
  sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));
  return session.user;
}
export function signOut(){session=null;sessionStorage.removeItem(SESSION_KEY);}

export async function loadGallery({admin=false}={}){
  if(!cloudEnabled){try{const saved=localStorage.getItem(STORAGE_KEY);return saved?JSON.parse(saved):localClone(initialData);}catch{return localClone(initialData);}}
  const kinds=['artists','artworks','exhibitions'];
  const rows=await Promise.all(kinds.map(async kind=>{
    const query=admin?'select=*&order=sort_order.asc,created_at.desc':'select=*&published=eq.true&order=sort_order.asc,created_at.desc';
    const response=await request(`${tableNames[kind]}?${query}`);
    return [kind,response.map(row=>fromRemote(kind,row))];
  }));
  return Object.fromEntries(rows);
}

export async function saveGallery(data){
  if(!cloudEnabled){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data;}
  if(!currentUser())throw new Error('저장하려면 큐레이터 계정으로 로그인하세요.');
  const saved={artists:[],artworks:[],exhibitions:[]};
  for(const kind of ['artists','artworks','exhibitions']){
    const table=tableNames[kind];
    const existing=await request(`${table}?select=id`);
    const next=data[kind].map((item,index)=>toRemote(kind,item,index));
    const keep=new Set(next.map(item=>item.id).filter(Boolean));
    const removed=existing.map(row=>row.id).filter(id=>!keep.has(id));
    if(removed.length)await request(`${table}?id=in.(${removed.join(',')})`,{method:'DELETE'});
    if(next.length){
      const result=await request(`${table}?on_conflict=id`,{method:'POST',body:next,prefer:'resolution=merge-duplicates,return=representation'});
      saved[kind]=result.map(row=>fromRemote(kind,row));
    }
  }
  return saved;
}

export async function restoreDemoData(){
  const data=localClone(initialData);
  if(!cloudEnabled){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return data;}
  return saveGallery(data);
}
