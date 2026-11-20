import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {Layers} from 'lucide-react';
import sharp from 'sharp';
const svg=renderToStaticMarkup(React.createElement(Layers,{size:512,color:'#155eef',strokeWidth:1.4}));
for(const size of [192,512])await sharp(Buffer.from(svg)).resize(size,size).flatten({background:'#ffffff'}).png().toFile(`public/icon-${size}.png`);
