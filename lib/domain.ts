import { z } from 'zod';
export const g0Labels = ['Расположение и границы','Кадастровые номера / правовой статус','Цель собственника','Полномочия заказчика','Известные ограничения','Бюджетные рамки','Гипотеза продукта','Уполномоченный согласующий','Подписанное задание','Условия оплаты'];
export const agents = [
 ['DATA','Исходные данные','Полнота, источники и актуальность'],['LEGAL','Право и ограничения','Полномочия, доступ, стоп-факторы'],['GEO','Геометрия территории','Баланс площади и границы'],['PLAN','Планировочные варианты','Участки, улицы и общественные зоны'],['ENGINEERING','Инженерная подготовка','Изыскания и условия подключения'],['ECONOMY','Экономика проекта','Затраты, выручка и денежный поток'],['ECO','Зелёный каркас','Доля озеленения и общественная среда'],['AUDIT','Независимый контроль','Проверки модели; заключение специалиста отдельно']
] as const;
export const inputSchema = z.object({
 name:z.string().trim().min(3).max(100), width:z.number().min(100).max(2000), height:z.number().min(100).max(2000),
 landCost:z.number().min(0).max(1e10), infrastructure:z.number().min(0).max(1e10), pricePerM2:z.number().min(1).max(1e7),
 overheadPct:z.number().min(0).max(50), reservePct:z.number().min(0).max(50), salesQuarters:z.number().int().min(2).max(24),
 g0:z.array(z.object({confirmed:z.boolean(),source:z.string().max(300)})).length(10),
 surveys:z.object({topography:z.boolean(),geology:z.boolean(),hydrology:z.boolean(),utilities:z.boolean()}),
 blockers:z.object({boundary:z.boolean(),authority:z.boolean(),access:z.boolean(),restriction:z.boolean()}),
 evidenceNote:z.string().max(1200), demo:z.literal(true)
});
export type ProjectInput=z.infer<typeof inputSchema>;
export type Rect={x:number;y:number;w:number;h:number;kind:'plot'|'road'|'green'|'social';label:string};
export function assess(d:ProjectInput){
 const missing=g0Labels.filter((_,i)=>!d.g0[i].confirmed||!d.g0[i].source.trim());
 const blocked=Object.entries(d.blockers).filter(([,v])=>v).map(([k])=>({boundary:'Границы не идентифицированы',authority:'Спорные полномочия',access:'Доступ не подтверждён',restriction:'Ограничение исключает продукт'}[k]!));
 const unknown=Object.entries(d.surveys).filter(([,v])=>!v).map(([k])=>({topography:'Топография',geology:'Геология',hydrology:'Гидрогеология',utilities:'Условия подключения'}[k]!));
 const route=blocked.length?'red':missing.length?'pending':unknown.length?'yellow':'green';
 return {route,missing,blocked,unknown,canRun:route==='green'||route==='yellow',sla:route==='green'};
}
export function plan(d:ProjectInput, index:number){
 const greenRatio=[.16,.25,.33][index], socialRatio=.05;
 const width=d.width, height=d.height, area=width*height;
 const greenH=height*greenRatio, socialH=height*socialRatio;
 const roadWidth=12, mainX=width/2-roadWidth/2, bodyH=height-greenH-socialH;
 const rows=[6,5,4][index], cols=[6,5,4][index];
 const rowH=(bodyH-(rows-1)*roadWidth)/rows, sideW=(width-roadWidth)/2;
 const rects:Rect[]=[{x:0,y:0,w:width,h:greenH,kind:'green',label:'Зелёный каркас'}, {x:0,y:height-socialH,w:width,h:socialH,kind:'social',label:'Общественная зона'}, {x:mainX,y:greenH,w:roadWidth,h:bodyH,kind:'road',label:'Главная улица'}];
 if(rowH<=0) throw new Error('Недостаточно площади для выбранной схемы');
 let n=0;
 for(let r=0;r<rows;r++){
 const y=greenH+r*(rowH+roadWidth);
 if(r>0){rects.push({x:0,y:y-roadWidth,w:sideW,h:roadWidth,kind:'road',label:'Улица'});rects.push({x:mainX+roadWidth,y:y-roadWidth,w:sideW,h:roadWidth,kind:'road',label:'Улица'});}
 for(let side=0;side<2;side++)for(let c=0;c<cols;c++)rects.push({x:side===0?c*sideW/cols:mainX+roadWidth+c*sideW/cols,y,w:sideW/cols,h:rowH,kind:'plot',label:String(++n)});
 }
 const saleArea=n*sideW/cols*rowH;
 const greenArea=area*greenRatio, socialArea=area*socialRatio, roadArea=area-saleArea-greenArea-socialArea;
 const infrastructure=d.infrastructure*(roadArea/area/.20);
 const base=d.landCost+infrastructure;
 const reserve=base*d.reservePct/100;
 const overhead=base*d.overheadPct/100;
 const cost=base+reserve+overhead;
 const revenue=saleArea*d.pricePerM2;
 const profit=revenue-cost;
 // Two preparation quarters, then uniform sales; all costs conservatively paid upfront.
 let cumulative=-cost;
 const cashFlow=[{quarter:0,inflow:0,outflow:cost,net:-cost,cumulative}];
 for(let q=1;q<=d.salesQuarters+2;q++){
 const inflow=q>2?revenue/d.salesQuarters:0;cumulative+=inflow;
 cashFlow.push({quarter:q,inflow,outflow:0,net:inflow,cumulative});
 }
 const paybackQuarter=cashFlow.find(x=>x.cumulative>=0)?.quarter??null;
 return {id:['A','B','C'][index],name:['Компактный','Сбалансированный','Парковый'][index],rects,area,saleArea,greenArea,socialArea,roadArea,plots:n,plotArea:saleArea/n,infrastructure,reserve,overhead,cost,revenue,profit,margin:profit/revenue*100,paybackQuarter,cashFlow,stressProfit:revenue*.85-cost*1.15};
}
export function runAnalysis(d:ProjectInput){
 const assessment=assess(d);
 const variants=assessment.canRun?[0,1,2].map(i=>plan(d,i)):[];
 const checks=variants.flatMap(v=>[
 {label:`${v.id}: баланс площади`,passed:Math.abs(v.saleArea+v.roadArea+v.greenArea+v.socialArea-v.area)<.01},
 {label:`${v.id}: положительная площадь участков`,passed:v.plotArea>0},
 {label:`${v.id}: денежный поток совпадает с прибылью`,passed:Math.abs(v.cashFlow.at(-1)!.cumulative-v.profit)<.01},
 {label:`${v.id}: прямоугольники внутри границ`,passed:v.rects.every(r=>r.x>=0&&r.y>=0&&r.x+r.w<=d.width+.001&&r.y+r.h<=d.height+.001)}
 ]);
 const best=[...variants].sort((a,b)=>b.profit-a.profit)[0];
 const recommendation=assessment.route==='red'?'Сначала устранить блокирующие ограничения':assessment.route==='pending'?'Завершить проверку G0':assessment.route==='yellow'?'Сначала подтвердить изыскания и условия подключения':best&&best.profit<=0?'Пересмотреть продукт и экономику: все варианты убыточны':`Вариант ${best?.id} лидирует по модельной прибыли; выбор требует экспертной оценки`;
 const reports=agents.map(([id,title])=>({id,title,mode:'Демонстрационный расчёт по правилам',findings:id==='DATA'?[`G0: ${10-assessment.missing.length}/10`,...assessment.missing]:id==='LEGAL'?(assessment.blocked.length?assessment.blocked:['В демонстрационных вводных блокеры не отмечены; правовая проверка не выполнена']):id==='GEO'?[`Площадь прямоугольной модели: ${(d.width*d.height/10000).toFixed(2)} га`,'Локальные метры; привязка к кадастру отсутствует']:id==='PLAN'?[`${variants.length} условных схем`,`Ширина улиц 12 м — допущение, не норматив`]:id==='ENGINEERING'?(assessment.unknown.length?assessment.unknown:['Вводные отмечены предоставленными; расчёты мощностей требуют инженера']):id==='ECONOMY'?[recommendation,'Цены и затраты учебные. Налоги, кредит, НДС и инфляция не включены']:id==='ECO'?['Озеленение 16 / 25 / 33% — продуктовые допущения, не нормативы']:checks.map(c=>`${c.passed?'Пройдено':'Ошибка'}: ${c.label}`)}));
 return {assessment,variants,checks,recommendation,reports,generatedAt:new Date().toISOString(),engineVersion:'rules-0.1'};
}
export type Analysis=ReturnType<typeof runAnalysis>;
export function demoInput(name:string,route:'green'|'yellow'|'red'):ProjectInput{
 return {name,width:600,height:400,landCost:35000000,infrastructure:55000000,pricePerM2:1800,overheadPct:8,reservePct:15,salesQuarters:8,g0:g0Labels.map((_,i)=>({confirmed:true,source:`ДЕМО · учебное основание ${i+1}; не реальный документ`})),surveys:{topography:true,geology:route==='green',hydrology:route==='green',utilities:route==='green'},blockers:{boundary:false,authority:false,access:route==='red',restriction:false},evidenceNote:'Все исходные данные вымышлены для проверки приложения. Не использовать для инвестиционных решений.',demo:true};
}
