import {createHash} from 'node:crypto';
import {db} from '@/lib/db';
import {localRequest,user} from '@/lib/auth';
import {dataFailure} from '@/lib/data-errors';
import {boundedForm,extractDocument} from '@/lib/documents';
export const runtime='nodejs';
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){try{
 localRequest(req);const actor=await user();if(!actor)throw Error('UNAUTHORIZED');if(actor.role!=='developer')throw Error('FORBIDDEN');
 const {id}=await ctx.params;const territory=await db.territory.findUnique({where:{id}});if(!territory)throw Error('NOT_FOUND');
 const form=await boundedForm(req);const file=form.get('file');const origin=form.get('origin');
 if(!(file instanceof File)||file.size===0||file.size>5*1024*1024||typeof origin!=='string'||origin.trim().length<3||origin.length>500)throw Error('INPUT');
 const name=file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,200);const content=Buffer.from(await file.arrayBuffer());const sha256=createHash('sha256').update(content).digest('hex');
 const segments=await extractDocument(name,content);
 const source=await db.$transaction(async tx=>{
  if(await tx.sourceDocument.count({where:{territoryId:id}})>=20)throw Error('SOURCE_LIMIT');
  if(await tx.sourceDocument.findUnique({where:{territoryId_sha256:{territoryId:id,sha256}}}))throw Error('DUPLICATE');
  const s=await tx.sourceDocument.create({data:{territoryId:id,name,origin:origin.trim(),sha256,content,segments:JSON.stringify(segments)}});
  await tx.territory.update({where:{id},data:{revision:{increment:1}}});return s;
 });return Response.json({id:source.id});
}catch(e){return dataFailure(e);}}
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){try{
 localRequest(req);if(!await user())throw Error('UNAUTHORIZED');const {id}=await ctx.params;const sourceId=new URL(req.url).searchParams.get('source');
 if(!sourceId)throw Error('INPUT');const s=await db.sourceDocument.findFirst({where:{id:sourceId,territoryId:id}});if(!s)throw Error('NOT_FOUND');
 return new Response(s.content,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':`attachment; filename="document"; filename*=UTF-8''${encodeURIComponent(s.name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}catch(e){return dataFailure(e);}}
