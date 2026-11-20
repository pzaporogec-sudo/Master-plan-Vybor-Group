import { db } from '@/lib/db';
import { body,failure,localRequest,user } from '@/lib/auth';
import { demoInput } from '@/lib/domain';
export async function POST(req:Request){try{
 localRequest(req);const actor=await user();if(!actor)throw new Error('UNAUTHORIZED');if(actor.role!=='developer')throw new Error('FORBIDDEN');
 const data=await body(req);if(typeof data.name!=='string'||data.name.trim().length<3||data.name.length>100)throw new Error('INPUT');
 const input=demoInput(data.name.trim(),'yellow');input.g0=input.g0.map(()=>({confirmed:false,source:''}));
 const project=await db.project.create({data:{name:input.name,data:JSON.stringify(input),events:{create:{actorId:actor.id,action:'Создан учебный проект'}}}});
 return Response.json({id:project.id});
 }catch(e){return failure(e);}}
