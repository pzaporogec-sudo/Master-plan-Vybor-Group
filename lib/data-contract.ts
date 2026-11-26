import { z } from 'zod';
export const segmentSchema=z.object({location:z.string().max(100),text:z.string().min(1).max(12000)});
export type Segment=z.infer<typeof segmentSchema>;
const evidence=z.object({sourceId:z.string(),location:z.string(),quote:z.string().min(1).max(1500)});
export const reportSchema=z.object({
 summary:z.string().max(3000),
 facts:z.array(z.object({statement:z.string().max(1500),evidence:z.array(evidence).min(1).max(5)})).max(40),
 assumptions:z.array(z.string().max(1000)).max(20),
 gaps:z.array(z.string().max(1000)).max(30),
 contradictions:z.array(z.object({description:z.string().max(1500),evidence:z.array(evidence).min(2).max(5)})).max(15),
 nextSteps:z.array(z.string().max(1000)).max(20),
});
export type DataReport=z.infer<typeof reportSchema>;
export type EvidenceSource={id:string;name:string;origin:string;segments:Segment[]};
export function validateReport(value:unknown,sources:EvidenceSource[]){
 const report=reportSchema.parse(value);
 for(const entry of [...report.facts,...report.contradictions])for(const e of entry.evidence){
  const source=sources.find(s=>s.id===e.sourceId);
  if(!source?.segments.some(s=>s.location===e.location&&s.text.includes(e.quote)))throw new Error('INVALID_CITATION');
 }
 return report;
}
export function textSegments(text:string):Segment[]{
 if(text.length>100000)throw new Error('TEXT_LIMIT');
 if(!text.trim()||text.includes('\u0000'))throw new Error('NO_TEXT');
 return Array.from({length:Math.ceil(text.length/6000)},(_,i)=>({location:`Фрагмент ${i+1}`,text:text.slice(i*6000,(i+1)*6000)}));
}
