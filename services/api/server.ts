import {config} from './config.js';
import {buildApp} from './app.js';
const cfg=config();const app=await buildApp(cfg);await app.listen({port:cfg.PORT,host:cfg.HOST});
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>{void app.close().then(()=>process.exit(0));});
