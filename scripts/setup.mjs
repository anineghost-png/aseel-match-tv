import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
if(existsSync('.env')){console.log('Existing .env preserved.');}else{writeFileSync('.env',readFileSync('.env.example','utf8').replace('replace-with-at-least-32-random-characters',randomBytes(32).toString('hex')),{mode:0o600});console.log('.env created with private random admin token. Read it locally; never commit it.');}
