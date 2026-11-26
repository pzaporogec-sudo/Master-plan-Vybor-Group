import {redirect} from 'next/navigation';
import {user} from '@/lib/auth';
import {db} from '@/lib/db';
import DataWorkspace from './workspace';
export const dynamic='force-dynamic';
export default async function Page(){
 const actor=await user();if(!actor)redirect('/');
 const territories=await db.territory.findMany({orderBy:{createdAt:'asc'},include:{sources:{select:{id:true,name:true,origin:true,sha256:true,segments:true,uploadedAt:true}},analyses:{orderBy:{createdAt:'desc'},take:10}}});
 return <DataWorkspace territories={JSON.parse(JSON.stringify(territories))} canEdit={actor.role==='developer'} configured={!!process.env.OPENAI_API_KEY}/>;
}
