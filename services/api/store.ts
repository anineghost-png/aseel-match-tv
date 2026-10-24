import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
export class Store {
 db:DatabaseSync;
 constructor(dir:string){if(dir!==':memory:')mkdirSync(dir,{recursive:true,mode:0o700});this.db=new DatabaseSync(dir===':memory:'?dir:join(dir,'aseel.sqlite'));this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS records(kind TEXT NOT NULL,id TEXT NOT NULL,value TEXT NOT NULL,updated INTEGER NOT NULL,PRIMARY KEY(kind,id)); CREATE TABLE IF NOT EXISTS quota(provider TEXT NOT NULL,day TEXT NOT NULL,used INTEGER NOT NULL,PRIMARY KEY(provider,day)); PRAGMA user_version=1;`);}
 get<T=any>(kind:string,id:string):T|undefined{const r=this.db.prepare('SELECT value FROM records WHERE kind=? AND id=?').get(kind,id) as any;return r?JSON.parse(r.value):undefined;}
 put(kind:string,id:string,value:unknown){this.db.prepare('INSERT INTO records VALUES(?,?,?,?) ON CONFLICT(kind,id) DO UPDATE SET value=excluded.value,updated=excluded.updated').run(kind,id,JSON.stringify(value),Date.now());}
 all<T=any>(kind:string):T[]{return (this.db.prepare('SELECT value FROM records WHERE kind=? ORDER BY updated DESC LIMIT 2000').all(kind) as any[]).map(r=>JSON.parse(r.value));}
 remove(kind:string,id:string){this.db.prepare('DELETE FROM records WHERE kind=? AND id=?').run(kind,id);}
 reserve(provider:string,limit:number,reserve:number,now=Date.now()){const day=new Date(now).toISOString().slice(0,10),max=Math.floor(limit*(1-reserve/100));this.db.exec('BEGIN IMMEDIATE');try{this.db.prepare('INSERT OR IGNORE INTO quota VALUES(?,?,0)').run(provider,day);const r=this.db.prepare('UPDATE quota SET used=used+1 WHERE provider=? AND day=? AND used<?').run(provider,day,max);this.db.exec('COMMIT');return r.changes===1;}catch(e){this.db.exec('ROLLBACK');throw e;}}
 quotas(){return this.db.prepare('SELECT * FROM quota ORDER BY day DESC LIMIT 60').all();}
 cleanup(){this.db.prepare("DELETE FROM records WHERE kind IN ('telemetry','health','session') AND updated<?").run(Date.now()-7*86400000);}
 close(){this.db.close();}
}
