import { db } from '@/lib/db';
import { body,failure,localRequest,user } from '@/lib/auth';
import { inputSchema,runAnalysis } from '@/lib/domain';
export async function POST(req:Request,context:{params:Promise<{id:string}>}){try{
 localRequest(req);const actor=await user();if(!actor)throw new Error('UNAUTHORIZED');const {id}=await context.params;const data=await body(req);
 const result=await db.$transaction(async tx=>{
 const p=await tx.project.findUnique({where:{id},include:{runs:{orderBy:{createdAt:'desc'},take:1,include:{review:true}}}});if(!p)throw new Error('NOT_FOUND');
 if(data.revision!==p.revision)throw new Error('CONFLICT');
 const last=p.runs[0];let action='';
 if(data.action==='save'){
 if(actor.role!=='developer')throw new Error('FORBIDDEN');const input=inputSchema.parse(data.input);
 await tx.project.update({where:{id},data:{name:input.name,data:JSON.stringify(input),revision:{increment:1},status:'draft'}});action='Изменены исходные данные; требуется новый расчёт и проверка';
 }else if(data.action==='run'){
 if(actor.role!=='developer')throw new Error('FORBIDDEN');
 const analysis=runAnalysis(inputSchema.parse(JSON.parse(p.data)));
 await tx.run.create({data:{projectId:id,revision:p.revision,authorId:actor.id,result:JSON.stringify(analysis)}});
 await tx.project.update({where:{id},data:{status:analysis.assessment.canRun?'calculated':'blocked'}});action='Выполнен демонстрационный расчёт rules-0.1';
 }else if(data.action==='review'){
 if(actor.role!=='expert'||!last||last.authorId===actor.id)throw new Error('FORBIDDEN');
 if(last.revision!==p.revision||last.id!==data.runId||last.review||p.status!=='calculated')throw new Error('CONFLICT');
 if(!['accepted','rejected'].includes(data.decision)||typeof data.comment!=='string'||data.comment.trim().length<10||data.comment.length>1500)throw new Error('INPUT');
 const analysis=JSON.parse(last.result);if(!analysis.assessment.canRun||!analysis.checks.every((c:{passed:boolean})=>c.passed))throw new Error('INPUT');
 await tx.review.create({data:{runId:last.id,reviewerId:actor.id,decision:data.decision,comment:data.comment.trim()}});
 await tx.project.update({where:{id},data:{status:data.decision==='accepted'?'reviewed':'revision'}});action=`Эксперт: ${data.decision==='accepted'?'проверено':'возвращено на доработку'}. ${data.comment.trim()}`;
 }else if(data.action==='approve'){
 if(actor.role!=='developer')throw new Error('FORBIDDEN');if(!last||last.id!==data.runId||last.revision!==p.revision||last.review?.decision!=='accepted'||p.status!=='reviewed')throw new Error('CONFLICT');
 await tx.project.update({where:{id},data:{status:'approved'}});action='Девелопер принял учебный результат для дальнейшей проработки';
 }else throw new Error('INPUT');
 await tx.auditEvent.create({data:{projectId:id,actorId:actor.id,action}});return {ok:true};
 });return Response.json(result);
 }catch(e){return failure(e);}}
export async function GET(req:Request,context:{params:Promise<{id:string}>}){try{
 localRequest(req);if(!await user())throw new Error('UNAUTHORIZED');const {id}=await context.params;
 const p=await db.project.findUnique({where:{id},include:{runs:{orderBy:{createdAt:'desc'},include:{review:true}},events:{orderBy:{createdAt:'asc'}}}});if(!p)throw new Error('NOT_FOUND');
 return Response.json({notice:'ДЕМОНСТРАЦИЯ. Концепция, не проектная документация. Все цены и территории вымышлены.',...p,data:JSON.parse(p.data),runs:p.runs.map(r=>({...r,result:JSON.parse(r.result)}))},{headers:{'Content-Disposition':`attachment; filename="master-plan-${id.replace(/[^a-z0-9-]/gi,'')}.json"`,'Cache-Control':'no-store'}});
 }catch(e){return failure(e);}}
