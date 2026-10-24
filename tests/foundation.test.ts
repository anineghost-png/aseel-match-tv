import {test} from 'node:test';import assert from 'node:assert/strict';
import {config} from '../services/api/config.js';import {Store} from '../services/api/store.js';import {buildApp} from '../services/api/app.js';
const cfg=config({ADMIN_TOKEN:'test-only-token-abcdefghijklmnopqrstuvwxyz',DATA_DIR:':memory:'});
test('rejects unsafe config',()=>{assert.throws(()=>config({ADMIN_TOKEN:'short'}));assert.equal(cfg.DEMO_MODE,false);});
test('SQLite persistence and atomic quota reserve',()=>{const s=new Store(':memory:');s.put('x','1',{a:1});assert.equal(s.get('x','1').a,1);for(let i=0;i<8;i++)assert.equal(s.reserve('p',10,20),true);assert.equal(s.reserve('p',10,20),false);s.close();});
test('health, authenticated diagnostics, validated devices',async()=>{const app=await buildApp(cfg);assert.equal((await app.inject('/health')).statusCode,200);assert.equal((await app.inject('/api/admin/diagnostics')).statusCode,401);assert.equal((await app.inject({url:'/api/devices',method:'POST',payload:{capabilities:{hls:'maybe'}}})).statusCode,201);assert.equal((await app.inject({url:'/api/devices',method:'POST',payload:{bad:1}})).statusCode,400);await app.close();});
