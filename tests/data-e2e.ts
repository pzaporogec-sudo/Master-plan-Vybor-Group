import assert from 'node:assert/strict';
const base=process.env.TEST_URL??'http://127.0.0.1:3101';
let count=0;let cookie='';
async function request(path:string,body?:unknown,expected=200,auth=true,origin=base){const form=body instanceof FormData;const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{Origin:origin}:{}),...(body&&!form?{'Content-Type':'application/json'}:{}),...(auth?{Cookie:cookie}:{})},body:body?(form?body:JSON.stringify(body)):undefined});assert.equal(r.status,expected,await r.clone().text());count++;return r;}
async function main(){
const login=await request('/api/login',{role:'developer'},200,false);cookie=login.headers.get('set-cookie')!.split(';')[0];
const created=await (await request('/api/territories',{name:'Проверка DATA AI · учебные источники'})).json();const path='/api/territories/'+created.id;
function form(name='territory.txt',text='Учебный источник. Площадь 24 га. Правовой статус не подтверждён.'){const f=new FormData();f.set('file',new File([text],name));f.set('origin','Синтетический тест, не реальная территория');return f;}
await request(path+'/sources',form(),401,false);await request(path+'/sources',form(),403,true,'https://evil.example');
const s=await (await request(path+'/sources',form())).json();await request(path+'/sources',form(),400);await request(path+'/sources',form('bad.exe'),400);
const downloaded=await request(path+'/sources?source='+s.id);assert.match(await downloaded.text(),/Площадь 24 га/);assert.equal(downloaded.headers.get('cache-control'),'no-store');
await request(path+'/sources?source='+s.id,undefined,401,false);
await request(path+'/analyze',{revision:2,sourceIds:[s.id],consent:false},400);
// Never sends a live AI request: invalid consent always fails before provider access.
const page=await request('/data-ai');const html=await page.text();assert.match(html,/Проверка DATA AI/);assert.match(html,/Синтетический тест/);
const expert=await request('/api/login',{role:'expert'},200,false);cookie=expert.headers.get('set-cookie')!.split(';')[0];
await request(path+'/sources',form('expert.txt'),403);await request(path+'/analyze',{revision:2,sourceIds:[s.id],consent:true},403);
await request('/api/territories',{name:'Эксперт не создаёт'},403);
console.log(`PASS: ${count} DATA HTTP checks; synthetic documents only; no paid AI calls.`);

}
main().catch(e=>{console.error(e);process.exitCode=1;});
