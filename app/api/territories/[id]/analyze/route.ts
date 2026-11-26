import {z} from 'zod';
import {db} from '@/lib/db';
import {body,localRequest,user} from '@/lib/auth';
import {dataFailure} from '@/lib/data-errors';
import {analyzeSources,modelName,closeDataSession} from '@/lib/data-ai';
export const runtime='nodejs';export const maxDuration=240;
export async function POST(req:Request,ctx:{params:Promise<{id:string}>}){let runId:string|undefined;try{
 localRequest(req);const actor=await user();if(!actor)throw Error('UNAUTHORIZED');if(actor.role!=='developer')throw Error('FORBIDDEN');
 const {id}=await ctx.params;const raw=await body(req);
 if(raw.action==='cleanup'){
  const a=await db.dataAnalysis.findFirst({where:{id:typeof raw.runId==='string'?raw.runId:'',territoryId:id}});if(!a)throw Error('NOT_FOUND');
  if(a.sessionId)await closeDataSession(a.sessionId);
  else if(a.status==='running')throw Error('AI_BUSY');
  await db.dataAnalysis.update({where:{id:a.id},data:{cleanup:'deleted',...(a.status==='running'?{status:'failed',error:'CANCELLED'}:{})}});return Response.json({ok:true});
 }
 const data=z.object({revision:z.number().int(),sourceIds:z.array(z.string()).min(1).max(20),consent:z.literal(true)}).safeParse(raw);if(!data.success)throw Error('CONSENT');
 if(!process.env.OPENAI_API_KEY)throw Error('KEY_MISSING');
 const snapshot=await db.$transaction(async tx=>{
  const t=await tx.territory.findUnique({where:{id},include:{sources:true}});if(!t)throw Error('NOT_FOUND');if(t.revision!==data.data.revision)throw Error('CONFLICT');
  if(await tx.dataAnalysis.count({where:{territoryId:id,OR:[{status:'running'},{cleanup:'pending'}]}}))throw Error('AI_BUSY');
  const sources=t.sources.filter(s=>data.data.sourceIds.includes(s.id));if(sources.length!==new Set(data.data.sourceIds).size)throw Error('INPUT');
  const evidence=sources.map(s=>({id:s.id,name:s.name,origin:s.origin,segments:JSON.parse(s.segments)}));
  if(evidence.reduce((n,s)=>n+s.segments.reduce((a:number,p:{text:string})=>a+p.text.length,0),0)>100000)throw Error('TEXT_LIMIT');
  const run=await tx.dataAnalysis.create({data:{territoryId:id,revision:t.revision,sourceIds:JSON.stringify(sources.map(s=>s.id)),actorId:actor.id,model:modelName()}});return {run,evidence};
 });runId=snapshot.run.id;
 const result=await analyzeSources(snapshot.evidence,async fields=>{await db.dataAnalysis.update({where:{id:runId},data:fields});});
 await db.dataAnalysis.update({where:{id:runId},data:{status:'completed',result:JSON.stringify(result)}});return Response.json({id:runId});
}catch(e){if(runId)await db.dataAnalysis.update({where:{id:runId},data:{status:'failed',error:e instanceof Error?e.message:'AI_FAILED'}});return dataFailure(e);}}
