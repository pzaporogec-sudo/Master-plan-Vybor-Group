import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { body,failure,hash,localRequest } from '@/lib/auth';
export async function POST(req:Request){try{
 localRequest(req);const data=await body(req);
 const jar=await cookies();const old=jar.get('mp_session')?.value;
 if(old)await db.session.deleteMany({where:{id:hash(old)}});
 if(data.logout){jar.delete('mp_session');return Response.json({ok:true});}
 if(!['developer','expert','admin'].includes(data.role))throw new Error('FORBIDDEN');
 const account=await db.user.findUnique({where:{id:data.role}});if(!account)throw new Error('UNAUTHORIZED');
 const token=randomBytes(32).toString('hex');
 await db.session.deleteMany({where:{expiresAt:{lt:new Date()}}});
 await db.session.create({data:{id:hash(token),userId:account.id,expiresAt:new Date(Date.now()+8*3600000)}});
 jar.set('mp_session',token,{httpOnly:true,sameSite:'strict',path:'/',maxAge:8*3600,secure:new URL(req.url).protocol==='https:'});
 return Response.json({ok:true});
 }catch(e){return failure(e);}}
