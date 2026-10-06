import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import handler from './api/index.js';
const root=path.resolve('public');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'};
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(url.pathname==='/api/index'){req.query=Object.fromEntries(url.searchParams);let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>3500000){res.writeHead(413);res.end();return}chunks.push(chunk)}const raw=Buffer.concat(chunks).toString();req.body=raw?JSON.parse(raw):{};res.status=code=>{res.statusCode=code;return res};res.json=body=>res.end(JSON.stringify(body));await handler(req,res);return}const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(404);res.end('Not found')}}).listen(3000,'0.0.0.0',()=>console.log('Our Room: http://localhost:3000/?demo=1'));
