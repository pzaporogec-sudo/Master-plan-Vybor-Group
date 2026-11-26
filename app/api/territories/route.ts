import {db} from '@/lib/db';
import {body,localRequest,user} from '@/lib/auth';
import {dataFailure} from '@/lib/data-errors';
import {z} from 'zod';
export async function POST(req:Request){try{localRequest(req);const actor=await user();if(!actor)throw Error('UNAUTHORIZED');if(actor.role!=='developer')throw Error('FORBIDDEN');const {name}=z.object({name:z.string().trim().min(3).max(100)}).parse(await body(req));const t=await db.territory.create({data:{name}});return Response.json({id:t.id});}catch(e){return dataFailure(e);}}
