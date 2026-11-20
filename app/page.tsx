import { db } from '@/lib/db';
import { user } from '@/lib/auth';
import Workspace from './workspace';
export const dynamic='force-dynamic';
export default async function Page(){
 const actor=await user();
 const projects=actor?await db.project.findMany({orderBy:{createdAt:'asc'},include:{runs:{orderBy:{createdAt:'desc'},take:1,include:{review:true}},events:{orderBy:{createdAt:'desc'},take:30}}}):[];
 return <Workspace actor={actor?{id:actor.id,name:actor.name,role:actor.role}:null} projects={JSON.parse(JSON.stringify(projects))}/>;
}
