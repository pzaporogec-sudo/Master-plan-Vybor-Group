import {spawn} from 'node:child_process';
import path from 'node:path';
import {z} from 'zod';
import {segmentSchema,textSegments,type Segment} from './data-contract';
export async function extractDocument(name:string,buffer:Buffer):Promise<Segment[]>{
 const ext=path.extname(name).toLowerCase();
 if(['.txt','.md','.csv','.json','.geojson'].includes(ext)){
  const text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);
  if(['.json','.geojson'].includes(ext))JSON.parse(text);
  return textSegments(text);
 }
 if(!['.pdf','.docx'].includes(ext))throw new Error('FILE_TYPE');
 return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--max-old-space-size=256',path.join(process.cwd(),'scripts/extract-document.mjs'),ext.slice(1)],{stdio:['pipe','pipe','ignore'],env:{PATH:process.env.PATH,NODE_ENV:"production"}});
  const chunks:Buffer[]=[];let size=0;
  const timer=setTimeout(()=>child.kill('SIGKILL'),20000);
  child.on('error',()=>{clearTimeout(timer);reject(new Error('EXTRACTION'));});
  child.stdout.on('data',(b:Buffer)=>{size+=b.length;if(size>700000)child.kill('SIGKILL');else chunks.push(b);});
  child.stdin.on('error',()=>{});child.stdin.end(buffer);
  child.on('close',code=>{clearTimeout(timer);try{if(code!==0)throw Error();resolve(z.array(segmentSchema).min(1).max(100).parse(JSON.parse(Buffer.concat(chunks).toString())));}catch{reject(new Error('EXTRACTION'));}});
 });
}
export async function boundedForm(req:Request){
 const max=6*1024*1024;if(Number(req.headers.get('content-length')??0)>max)throw new Error('BODY_SIZE');
 const reader=req.body?.getReader();if(!reader)throw new Error('BODY_SIZE');const chunks:Uint8Array[]=[];let size=0;
 while(true){const p=await reader.read();if(p.done)break;size+=p.value.byteLength;if(size>max){await reader.cancel();throw new Error('BODY_SIZE');}chunks.push(p.value);}
 return new Response(Buffer.concat(chunks),{headers:{'Content-Type':req.headers.get('content-type')??''}}).formData();
}
