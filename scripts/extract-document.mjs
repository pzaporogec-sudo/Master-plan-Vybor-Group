// Isolated parser: parent enforces input/output size, memory and wall time.
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';
const chunks=[];for await(const c of process.stdin)chunks.push(c);
try{
 const buffer=Buffer.concat(chunks);let parts;
 if(process.argv[2]==='pdf'){
  if(buffer.subarray(0,5).toString()!=='%PDF-')throw Error();
  const parser=new PDFParse({data:new Uint8Array(buffer)});
  try{const info=await parser.getInfo();if(info.total>100)throw Error();const result=await parser.getText();parts=result.pages.filter(p=>p.text.trim()).map(p=>({location:`Страница ${p.num}`,text:p.text}));}finally{await parser.destroy();}
 }else if(process.argv[2]==='docx'){
  const result=await mammoth.extractRawText({buffer});const text=result.value;
  parts=Array.from({length:Math.ceil(text.length/6000)},(_,i)=>({location:`Фрагмент ${i+1}`,text:text.slice(i*6000,(i+1)*6000)}));
 }else throw Error();
 if(!parts.length||parts.reduce((n,p)=>n+p.text.length,0)>100000||parts.some(p=>p.text.length>12000))throw Error();
 process.stdout.write(JSON.stringify(parts));
}catch{process.exitCode=1;}
