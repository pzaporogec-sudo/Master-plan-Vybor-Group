import assert from 'node:assert/strict';
import {demoInput} from '../lib/domain';
const origin=process.env.TEST_URL??'http://127.0.0.1:3100';
type Actor='developer'|'expert'|'admin';
const cookies:Partial<Record<Actor,string>>={};
let count=0;
async function call(path:string,data?:unknown,actor?:Actor,expected=200,otherOrigin?:string){const res=await fetch(origin+path,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json','Origin':otherOrigin??origin}:{}),...(actor?{Cookie:cookies[actor]??''}:{})},body:data?JSON.stringify(data):undefined});const result=await res.json();assert.equal(res.status,expected,`${path}: ${JSON.stringify(result)}`);count++;return result;}
async function login(role:Actor){const res=await fetch(origin+'/api/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({role})});assert.equal(res.status,200);cookies[role]=res.headers.get('set-cookie')!.split(';')[0];}
async function scenario(route:'green'|'yellow'|'red'){
 const created=await call('/api/projects',{name:`E2E · ${route} · ${Date.now()}`},'developer');const path='/api/projects/'+created.id;
 const data=demoInput(`E2E · ${route}`,route);await call(path,{action:'save',revision:1,input:data},'developer');
 await call(path,{action:'run',revision:2},'developer');const p=await call(path,undefined,'developer');const run=p.runs[0];
 assert.equal(run.result.assessment.route,route);
 if(route==='red'){assert.equal(run.result.variants.length,0);await call(path,{action:'approve',revision:2,runId:run.id},'developer',409);return;}
 assert.equal(run.result.variants.length,3);assert.ok(run.result.checks.every((c:{passed:boolean})=>c.passed));
 await call(path,{action:'approve',revision:2,runId:run.id},'developer',409);
 await call(path,{action:'review',revision:2,runId:run.id,decision:'accepted',comment:'Проверка модели выполнена в E2E'},'developer',403);
 await call(path,{action:'save',revision:2,input:data},'expert',403);
 await call(path,{action:'review',revision:2,runId:run.id,decision:'accepted',comment:'Проверены модель, денежный поток и ограничения демо'},'expert');
 await call(path,{action:'approve',revision:2,runId:run.id},'developer');assert.equal((await call(path,undefined,'admin')).status,'approved');
 await call(path,{action:'save',revision:2,input:{...data,width:650}},'developer');
 await call(path,{action:'approve',revision:3,runId:run.id},'developer',409);
 await call(path,{action:'save',revision:2,input:data},'developer',409);
 const changed=await call(path,undefined,'admin');assert.equal(changed.status,'draft');assert.equal(changed.revision,3);assert.ok(changed.events.length>=5);
}
async function main(){
 await call('/api/projects/demo-green',undefined,undefined,401);
 for(const role of ['developer','expert','admin'] as const)await login(role);
 await call('/api/projects',{name:'Запрещено'},'admin',403);
 await call('/api/projects',{name:'x'.repeat(33000)},'developer',400);
 await call('/api/projects/demo-green',{action:'save',revision:1,input:{width:-1}},'developer',400);
 await call('/api/projects',{name:'CSRF тест'},'developer',403,'https://untrusted.example');
 for(const route of ['green','yellow','red'] as const)await scenario(route);
 // Rejection and rerun must require a new independent decision.
 const created=await call('/api/projects',{name:'E2E · rejection'},'developer');const path='/api/projects/'+created.id;
 await call(path,{action:'save',revision:1,input:demoInput('E2E · rejection','green')},'developer');await call(path,{action:'run',revision:2},'developer');
 let p=await call(path,undefined,'developer');await call(path,{action:'review',revision:2,runId:p.runs[0].id,decision:'rejected',comment:'Нужно уточнить исходные предположения'},'expert');
 assert.equal((await call(path,undefined,'admin')).status,'revision');await call(path,{action:'approve',revision:2,runId:p.runs[0].id},'developer',409);
 await call(path,{action:'run',revision:2},'developer');p=await call(path,undefined,'admin');assert.equal(p.runs[0].review,null);assert.equal(p.status,'calculated');
 await call('/api/login',{logout:true},'developer');await call('/api/projects/demo-green',undefined,'developer',401);
 console.log(`PASS: ${count} HTTP assertions. Green/yellow/red, developer/expert/admin, rejection, stale review, CSRF, authorization and logout.`);
 console.log('E2E projects are retained in the local demo database as audit evidence.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
