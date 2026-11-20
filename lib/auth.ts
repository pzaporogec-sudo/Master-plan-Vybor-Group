import { cookies } from 'next/headers';
import { createHash } from 'node:crypto';
import { db } from './db';
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export function localRequest(req:Request){
 const url=new URL(req.url);
 const host=req.headers.get('host')?.split(':')[0];
 if(!['localhost','127.0.0.1'].includes(url.hostname)||!['localhost','127.0.0.1'].includes(host??''))throw new Error('LOCAL_ONLY');
 const expectedOrigin=`${url.protocol}//${req.headers.get('host')}`;
 if(req.method!=='GET'&&req.headers.get('origin')!==expectedOrigin)throw new Error('ORIGIN');
}
export async function user(){
 const token=(await cookies()).get('mp_session')?.value;
 if(!token)return null;
 const session=await db.session.findUnique({where:{id:hash(token)},include:{user:true}});
 return session&&session.expiresAt>new Date()?session.user:null;
}
export async function body(req:Request){
 if(Number(req.headers.get('content-length')??0)>32000)throw new Error('BODY_SIZE');
 const reader=req.body?.getReader();if(!reader)throw new Error('INVALID_JSON');
 let size=0;const chunks:Uint8Array[]=[];
 while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;if(size>32000){await reader.cancel();throw new Error('BODY_SIZE');}chunks.push(part.value);}
 const text=Buffer.concat(chunks).toString('utf8');
 try{return JSON.parse(text);}catch{throw new Error('INVALID_JSON');}
}
export function failure(e:unknown){
 const message=e instanceof Error?e.message:'UNKNOWN';
 const status=message==='UNAUTHORIZED'?401: ['FORBIDDEN','ORIGIN','LOCAL_ONLY'].includes(message)?403:message==='NOT_FOUND'?404:message==='CONFLICT'?409:400;
 const labels:Record<string,string>={UNAUTHORIZED:'Войдите в демонстрационный кабинет',FORBIDDEN:'У этой роли нет прав на действие',ORIGIN:'Запрос из другого источника отклонён',LOCAL_ONLY:'Демонстрационный сервер доступен только локально',NOT_FOUND:'Проект не найден',CONFLICT:'Данные изменились. Обновите проект и повторите действие.',BODY_SIZE:'Слишком большой запрос',INVALID_JSON:'Неверный формат запроса'};
 return Response.json({error:labels[message]??'Действие отклонено: проверьте данные и состояние проекта'},{status});
}
