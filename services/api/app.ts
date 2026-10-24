import Fastify from 'fastify';
import statics from '@fastify/static';
import rateLimit from '@fastify/rate-limit';
import {resolve} from 'node:path';
import {timingSafeEqual,randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {Config} from './config.js';
import {Store} from './store.js';
export async function buildApp(cfg:Config,store=new Store(cfg.DATA_DIR)){
 const app=Fastify({logger:{redact:['req.headers.authorization','req.headers.cookie']},bodyLimit:2*1024*1024});
 await app.register(rateLimit,{max:100,timeWindow:'1 minute'});
 app.decorate('store',store);
 app.addHook('onRequest',async(req,reply)=>{reply.header('X-Content-Type-Options','nosniff').header('Referrer-Policy','no-referrer').header('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; worker-src blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'none'");if(req.url.startsWith('/api/admin')){const token=req.headers.authorization?.replace(/^Bearer /,'')||'';if(token.length!==cfg.ADMIN_TOKEN.length||!timingSafeEqual(Buffer.from(token),Buffer.from(cfg.ADMIN_TOKEN)))return reply.code(401).send({error:'UNAUTHORIZED'});if(req.headers.origin && req.headers.origin!==`${req.protocol}://${req.headers.host}`)return reply.code(403).send({error:'ORIGIN'});}});
 app.setErrorHandler((err,req,reply)=>{const status=(err as any).statusCode;reply.code(status&&status<500?status:400).send({error:'REQUEST_FAILED'});});
 await app.register(statics,{root:resolve('apps/tv'),prefix:'/'});
 app.get('/health',async()=>({ok:true,demo:cfg.DEMO_MODE,ps4Verified:false}));
 app.get('/compat',(_,reply)=>reply.sendFile('compat.html'));
 app.get('/controller',(_,reply)=>reply.sendFile('controller.html'));
 app.get('/api/fixtures',async()=>({fixtures:[],demo:cfg.DEMO_MODE,updatedAt:null}));
 const device=z.object({capabilities:z.record(z.string(),z.union([z.boolean(),z.string().max(300),z.number().finite()]))});
 app.post('/api/devices',async(req,reply)=>{const body=device.parse(req.body),id=randomUUID();store.put('device',id,{id,capabilities:body.capabilities,userAgent:(req.headers['user-agent']||'').slice(0,300),ps4:/PlayStation 4/i.test(req.headers['user-agent']||''),verified:{nativeHls:false,mse:false},lastSeenAt:new Date().toISOString()});return reply.code(201).send({id,verified:false});});
 app.get('/api/admin/diagnostics',async()=>({devices:store.all('device'),quotas:store.quotas(),ps4Acceptance:'PENDING'}));
 app.addHook('onClose',async()=>store.close());
 return app;
}
