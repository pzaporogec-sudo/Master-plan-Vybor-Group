import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Мастер-план | Ваш Выбор',description:'Демонстрационный кабинет мастер-планирования территорий',manifest:'/manifest.webmanifest'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ru"><body>{children}</body></html>;}
