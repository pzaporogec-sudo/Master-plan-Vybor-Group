import {open,mkdir} from 'node:fs/promises';
await mkdir(new URL('../prisma/',import.meta.url),{recursive:true});
const file=await open(new URL('../prisma/dev.db',import.meta.url),'a');await file.close();
