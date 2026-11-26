import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'AI Мастер-план Эксперт VG',description:'Мастер-планирование территорий: исходные данные, DATA AI и учебные сценарии',manifest:'/manifest.webmanifest'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>;}
