import { PrismaClient } from '@prisma/client';
import { demoInput } from '../lib/domain';
const db=new PrismaClient();
async function main(){
 for(const [id,name,role] of [['developer','Девелопер · демо','developer'],['expert','Независимый эксперт · демо','expert'],['admin','Администратор · демо','admin']])await db.user.upsert({where:{id},update:{},create:{id,name,role}});
 for(const [id,name,route] of [['demo-green','Демо · Лесной квартал','green'],['demo-yellow','Демо · Береговой парк','yellow'],['demo-red','Демо · Южная территория','red']] as const){const data=demoInput(name,route);await db.project.upsert({where:{id},update:{},create:{id,name,data:JSON.stringify(data)}});}
 console.log('Готово: 3 учебные территории и 3 демо-роли. Существующие проекты сохранены.');
}
main().finally(()=>db.$disconnect());
