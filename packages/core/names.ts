export function normalize(s:string){return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/[^a-z0-9\u0621-\u064a]+/g,' ').trim().replace(/\s+/g,' ');}
export const teams:Record<string,{ar:string;aliases:string[]}>={barcelona:{ar:'برشلونة',aliases:['FC Barcelona','Barcelona','Barca','برشلونة','برشلونه','BAR']},real:{ar:'ريال مدريد',aliases:['Real Madrid','ريال مدريد','RMA']},atletico:{ar:'أتلتيكو مدريد',aliases:['Atletico Madrid','Atlético de Madrid','Atletico','اتلتيكو مدريد','أتلتيكو','ATM']}};
export function canonical(name:string){const n=normalize(name);return Object.keys(teams).find(k=>teams[k].aliases.some(a=>normalize(a)===n))||n;}
export function arabic(name:string){return teams[canonical(name)]?.ar||name;}
export function mentions(text:string,name:string){const n=' '+normalize(text)+' ';const aliases=teams[canonical(name)]?.aliases||[name];return aliases.some(a=>n.includes(' '+normalize(a)+' '));}
export const competitions:Record<string,string>={PD:'الدوري الإسباني',CL:'دوري أبطال أوروبا',PL:'الدوري الإنجليزي',SA:'الدوري الإيطالي',BL1:'الدوري الألماني',FL1:'الدوري الفرنسي'};
export function baghdadDate(now=Date.now()){return new Date(now+10800000).toISOString().slice(0,10);}
