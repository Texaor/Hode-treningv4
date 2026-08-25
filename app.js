
const STORAGE="strategiskStateFinal";
const skills=["math","memory","logic","observe","reaction","control","strategy"];
const names={math:"Hoderegning",memory:"Hukommelse",logic:"Logikk",observe:"Observasjon",reaction:"Reaksjon",control:"Selvkontroll",strategy:"Scenarioanalyse"};
const descriptions={math:"Løs en oppgave og tenk metode før fart.",memory:"Fullfør én hukommelsesoppgave.",logic:"Løs én logikkoppgave uten å gjette.",observe:"Fullfør én observasjonsrunde.",reaction:"Gjør én reaksjonsrunde uten forhastet trykk.",control:"Fullfør én selvkontrolløvelse.",strategy:"Løs ett scenario og skill fakta fra antakelser."};
const $=id=>document.getElementById(id),rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a,choice=a=>a[rand(0,a.length-1)];

function fresh(){
 const s={xp:0,sessions:0,total:0,correct:0,streak:0,lastDay:null,history:[],errors:{},mistakes:[],records:{reaction:null,memory:0,math60:0,exam:0,logicStreak:0},settings:{focus:false,explain:false,autoNext:true},levels:{},skill:{},dailySession:null};
 skills.forEach(k=>{s.levels[k]=1;s.skill[k]={c:0,t:0,score:0}});
 return s;
}
let state=(()=>{try{return JSON.parse(localStorage.getItem(STORAGE))||fresh()}catch{return fresh()}})();
skills.forEach(k=>{state.levels[k]??=1;state.skill[k]??={c:0,t:0,score:0}});
state.errors??={};state.mistakes??=[];state.history??=[];state.settings??={focus:false,explain:false,autoNext:true};state.records??=fresh().records;

function save(){localStorage.setItem(STORAGE,JSON.stringify(state));renderStats()}
function dayKey(){return new Date().toISOString().slice(0,10)}
function touchStreak(){const t=dayKey();if(state.lastDay===t)return;if(state.lastDay){const d=Math.round((new Date(t)-new Date(state.lastDay))/86400000);state.streak=d===1?state.streak+1:1}else state.streak=1;state.lastDay=t}
function addError(type){state.errors[type]=(state.errors[type]||0)+1}
function addMistake(item){
 if(!item||!item.q)return;
 const key=(item.skill||"")+"|"+item.q;
 state.mistakes=state.mistakes.filter(x=>(x.skill||"")+"|"+x.q!==key);
 state.mistakes.unshift({...item,when:Date.now(),tries:(item.tries||0)+1});
 state.mistakes=state.mistakes.slice(0,60);
}
function record(skill,ok,xp=10,err=null,mistake=null){
 touchStreak();state.total++;state.skill[skill].t++;
 if(ok){state.correct++;state.skill[skill].c++;state.skill[skill].score+=1;state.xp+=xp}
 else{state.skill[skill].score-=.5;if(err)addError(err);if(mistake)addMistake(mistake)}
 adapt(skill);markDaily(skill);save();
}
function adapt(skill){
 const s=state.skill[skill];if(s.t<6)return;const acc=s.c/s.t;
 if(acc>=.82){state.levels[skill]=Math.min(30,state.levels[skill]+1);s.c=0;s.t=0}
 else if(acc<.5&&state.levels[skill]>1){state.levels[skill]--;s.c=0;s.t=0}
}
function globalLevel(){return Math.max(1,Math.round(skills.reduce((a,k)=>a+state.levels[k],0)/skills.length))}
function skillAccuracy(k){const s=state.skill[k];return s.t?s.c/s.t:null}
function renderStats(){
 $("globalLevel").textContent=globalLevel();$("xpStat").textContent=state.settings.focus?"–":state.xp;$("streakStat").textContent=state.settings.focus?"–":state.streak;
 $("accuracyStat").textContent=(state.total?Math.round(state.correct/state.total*100):0)+"%";$("reviewStat").textContent=state.mistakes.length;
 ["math","memory","logic","observe","strategy"].forEach(k=>{const e=$(k+"Level");if(e)e.textContent=state.levels[k]});
 renderWeakness();
}
function renderWeakness(){
 const ranked=skills.map(k=>{const a=skillAccuracy(k);return{k,need:(a==null?.72:1-a)*3+(5-Math.min(5,state.levels[k]))*.18}}).sort((a,b)=>b.need-a.need);
 const top=ranked.slice(0,3).map(x=>names[x.k]).join(", ");
 $("weaknessCard").innerHTML=`<div class="eyebrow">ADAPTIVT FOKUS</div><b>Prioriter nå:</b> ${top}.<p>${state.mistakes.length?`Du har også ${state.mistakes.length} oppgave${state.mistakes.length===1?"":"r"} i feilbanken.`:"Feilbanken er tom akkurat nå."}</p>`;
}
function openView(id){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0);
 if(id==="logic")newLogic();if(id==="control")newControl();if(id==="strategy")newStrategy();if(id==="progress")renderProgress();if(id==="records")renderRecords();if(id==="review")renderReviewSummary();renderStats();
}
function toggleSettings(){$("settingsPanel").classList.toggle("show")}
function saveSettings(){state.settings.focus=$("focusMode").checked;state.settings.explain=$("explainBeforeAnswer").checked;state.settings.autoNext=$("autoNext").checked;save()}
function loadSettings(){$("focusMode").checked=!!state.settings.focus;$("explainBeforeAnswer").checked=!!state.settings.explain;$("autoNext").checked=state.settings.autoNext!==false}
function showHint(id,html){const e=$(id);e.hidden=false;e.innerHTML=html}
function resetHint(id){const e=$(id);if(e){e.hidden=true;e.innerHTML=""}}

/* MATH */
let currentMath=null,mathHints=0,mathRun={active:false,hard:false,sixty:false,score:0,end:0,timer:null};
function startMathMode(){clearInterval(mathRun.timer);mathRun={active:true,hard:$("mathChallenge").value==="hard",sixty:$("mathChallenge").value==="sixty",score:0,end:Date.now()+60000,timer:null};if(mathRun.sixty){mathRun.timer=setInterval(()=>{const left=Math.max(0,Math.ceil((mathRun.end-Date.now())/1000));$("mathTimer").textContent=left+"s";if(left<=0){clearInterval(mathRun.timer);mathRun.active=false;$("mathFeedback").innerHTML=`Tiden er ute. Score: <b>${mathRun.score}</b>`;state.records.math60=Math.max(state.records.math60||0,mathRun.score);save()}},250)}else $("mathTimer").textContent="∞";newMath()}
function newMath(){
 let lvl=state.levels.math,mode=$("mathMode").value;if(mode==="mixed")mode=choice(["add","sub","mul","div",...(lvl>=3?["percent"]:[]),...(lvl>=5?["fraction","estimate","chain"]:[])]);
 let q,ans,method,h1,h2,tol=.001;
 if(mode==="add"){const m=25+lvl*45,a=rand(-Math.floor(lvl/3)*20,m),b=rand(5,m);q=`${a} + ${b}`;ans=a+b;h1="Se etter et rundt tall du kan lage først.";h2=`Du kan for eksempel flytte litt fra ett tall til det andre for å gjøre ${a} eller ${b} rundere.`;method="Kompensasjon eller oppdeling gjør ofte addisjon raskere."}
 if(mode==="sub"){const m=30+lvl*50,a=rand(10,m),b=rand(-Math.floor(lvl/4)*20,a);q=`${a} − ${b}`;ans=a-b;h1="Trekk fra et rundt tall først, og korriger etterpå.";h2=`Hvis ${b} er nær et rundt tall, bruk det som mellomsteg.`;method="Rund av subtrahenden og korriger differansen."}
 if(mode==="mul"){const m=Math.min(60,6+lvl*3),a=rand(2,m),b=rand(2,m);q=`${a} × ${b}`;ans=a*b;h1="Del ett av tallene i en enkel del.";h2=`Prøv ${a} × (${Math.floor(b/10)*10} + ${b%10}) hvis det hjelper.`;method="Distribusjon: del opp ett tall og legg delproduktene sammen."}
 if(mode==="div"){const b=rand(2,Math.min(20,4+lvl)),x=rand(2,Math.min(50,8+lvl*2)),a=b*x;q=`${a} ÷ ${b}`;ans=x;h1=`Tenk: hvilket tall ganger ${b} blir ${a}?`;h2="Bruk multiplikasjon baklengs i stedet for lang divisjon.";method="Divisjon kan ofte løses som en manglende faktor."}
 if(mode==="percent"){const p=choice([5,10,12.5,15,20,25,30,40,50,75]),base=rand(2,30)*10;q=`${p}% av ${base}`;ans=p*base/100;h1="Start med 10 %, 50 % eller 25 %.";h2=`10 % av ${base} er ${base/10}. Bygg derfra.`;method="Bryt prosenttallet ned i enkle deler og summer."}
 if(mode==="fraction"){const den=choice([2,3,4,5,6,8,10]),num=rand(1,den-1),base=den*rand(2,20);q=`${num}/${den} av ${base}`;ans=num*base/den;h1=`Finn først 1/${den} av ${base}.`;h2=`Del ${base} på ${den}, og gang resultatet med ${num}.`;method="Finn én del først, deretter antall deler."}
 if(mode==="estimate"){const a=rand(120,990),b=rand(120,990);q=`Estimer ${a} + ${b} til nærmeste 100`;ans=Math.round((a+b)/100)*100;tol=50;h1="Rund begge tallene til nærmeste hundre.";h2=`Rund ${a} og ${b} hver for seg før du legger sammen.`;method="Estimering handler om riktig størrelsesorden, ikke eksakt svar."}
 if(mode==="chain"){const a=rand(5,30),b=rand(2,15),c=rand(2,12);q=`(${a} + ${b}) × ${c}`;ans=(a+b)*c;h1="Regn parentesen først.";h2=`Finn ${a}+${b}, og multipliser så med ${c}.`;method="Følg regnerekkefølgen: parentes før multiplikasjon."}
 currentMath={q,ans,tol,mode,method,hints:[h1,h2]};mathHints=0;resetHint("mathHintBox");$("mathQuestion").textContent=q;$("mathAnswer").value="";$("mathReason").value="";$("mathFeedback").textContent="";$("mathLevel").textContent=lvl;$("mathAnswer").focus()
}
function mathHint(){
 if(!currentMath)return;mathHints++;
 if(mathHints===1)showHint("mathHintBox",`<strong>Hint 1:</strong> ${currentMath.hints[0]}`);
 else if(mathHints===2)showHint("mathHintBox",`<strong>Hint 2:</strong> ${currentMath.hints[1]}`);
 else{showHint("mathHintBox",`<strong>Fasit:</strong> ${currentMath.ans}<br>${currentMath.method}`);addMistake({skill:"math",q:currentMath.q,answer:String(currentMath.ans),hint:currentMath.hints[0],explain:currentMath.method,type:currentMath.mode});save()}
}
function checkMath(){
 if(!currentMath||!mathRun.active)return;
 const v=Number($("mathAnswer").value.replace(",","."));if(!Number.isFinite(v)){ $("mathFeedback").textContent="Skriv inn et tall først.";return}
 const ok=Math.abs(v-currentMath.ans)<=currentMath.tol;
 if(ok){mathRun.score++;$("mathFeedback").innerHTML=`<span class="good">Riktig ✓</span> ${currentMath.method}`;record("math",true,mathHints?8:12);if(state.settings.autoNext)setTimeout(newMath,650)}
 else{$("mathFeedback").innerHTML=`<span class="bad">Ikke riktig ennå.</span> Prøv igjen eller bruk hint.`;record("math",false,0,"matte: "+currentMath.mode,{skill:"math",q:currentMath.q,answer:String(currentMath.ans),hint:currentMath.hints[0],explain:currentMath.method,type:currentMath.mode});if(mathRun.hard){mathRun.active=false;clearInterval(mathRun.timer);$("mathFeedback").innerHTML+=`<br>Hard mode avsluttet. Score: ${mathRun.score}`}}
}
$("mathAnswer").addEventListener("keydown",e=>{if(e.key==="Enter")checkMath()});

/* MEMORY */
let memory={phase:"idle",mode:"sequence",seq:[],work:null,nback:null},memoryHintUsed=false;
function startMemory(){
 memory.mode=$("memoryMode").value;memory.phase="show";memoryHintUsed=false;resetHint("memoryHintBox");$("memoryFeedback").textContent="";$("memoryAnswer").value="";$("memoryWork").innerHTML="";const lvl=state.levels.memory;
 if(memory.mode==="sequence"){const n=Math.min(14,4+Math.floor(lvl/2)),pool="ABCDEFGHJKLMNPQRSTUVWXYZ23456789".split("");memory.seq=Array.from({length:n},()=>choice(pool));$("memoryPrompt").textContent=memory.seq.join("  ");setTimeout(()=>{$("memoryPrompt").textContent="••••••";memory.phase="answer";$("memoryAnswer").placeholder="Sekvens";$("memoryAnswer").focus()},Math.max(1200,4200-lvl*120))}
 if(memory.mode==="working"){const n=Math.min(8,3+Math.floor(lvl/3));memory.seq=Array.from({length:n},()=>rand(1,9));const add=rand(1,9);memory.work={add};$("memoryPrompt").textContent=memory.seq.join("  ");$("memoryWork").innerHTML=`<p>Husk tallene. Etterpå: legg <b>${add}</b> til hvert tall.</p>`;setTimeout(()=>{$("memoryPrompt").textContent="Skjult";memory.phase="answer";$("memoryAnswer").focus()},Math.max(1500,4500-lvl*100))}
 if(memory.mode==="nback"){const n=Math.min(3,1+Math.floor(lvl/5)),len=8+Math.floor(lvl/2),pool=["A","B","C","D","E","F"],seq=Array.from({length:len},()=>choice(pool)),idx=rand(n,len-1);seq[idx]=seq[idx-n];memory.nback={n,seq,idx};$("memoryPrompt").textContent=seq.join("  ");$("memoryWork").innerHTML=`<p>Hvilken posisjon (1-${len}) gjentar symbolet fra <b>${n}</b> steg tidligere?</p>`;memory.phase="answer"}
}
function memoryHint(){
 memoryHintUsed=true;
 const text=memory.mode==="sequence"?"Gruppér symbolene i blokker på 2–3 i stedet for å huske hvert symbol alene.":memory.mode==="working"?"Ikke prøv å huske både original og nytt svar samtidig. Hold originalsekvensen, og transformer ett tall om gangen.":"Sammenlign hvert symbol med symbolet n plasser tidligere. Ikke let etter vanlige gjentakelser.";
 showHint("memoryHintBox",`<strong>Strategitips:</strong> ${text}`);
}
function memoryAction(){
 if(memory.phase!=="answer")return;let ok=false,answer="",explain="";
 if(memory.mode==="sequence"){answer=memory.seq.join("");ok=$("memoryAnswer").value.toUpperCase().replace(/\s/g,"")===answer;explain="Chunking gjør lange sekvenser lettere å holde aktive."}
 if(memory.mode==="working"){answer=memory.seq.map(x=>x+memory.work.add).join(" ");ok=$("memoryAnswer").value.replace(/\D/g,"")===answer.replace(/\D/g,"");explain="Hold originalsekvensen stabil og transformer ett element om gangen."}
 if(memory.mode==="nback"){answer=String(memory.nback.idx+1);ok=Number($("memoryAnswer").value)===memory.nback.idx+1;explain="N-back krever at du sammenligner med en fast avstand bakover."}
 $("memoryFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span> ${explain}`:`<span class="bad">Ikke helt.</span> Riktig svar var <b>${answer}</b>. ${explain}`;
 if(ok&&memory.mode==="sequence")state.records.memory=Math.max(state.records.memory||0,memory.seq.length);
 record("memory",ok,ok?(memoryHintUsed?10:15):0,ok?null:"hukommelse: "+memory.mode,ok?null:{skill:"memory",q:`${memory.mode}: ${memory.mode==="nback"?memory.nback.seq.join(" "):"sekvensoppgave"}`,answer,hint:"Bruk chunking eller systematisk sammenligning.",explain,type:memory.mode});memory.phase="idle";save()
}

/* LOGIC */
let currentLogic=null,logicHints=0;
function makeLogic(){
 const lvl=state.levels.logic,type=choice(["seq","odd","relation","truth","matrix","insufficient","alternating","difference"]);
 if(type==="seq"){const a=rand(1,15),d=rand(2,7+Math.floor(lvl/3)),seq=[a,a+d,a+2*d,a+3*d],ans=a+4*d;return{q:`Hva kommer neste? ${seq.join(", ")}, ?`,ans:String(ans),opts:[ans,ans+d,ans-d,ans+1].sort(()=>Math.random()-.5).map(String),h1:"Se på forskjellen mellom hvert nabotall.",h2:`Forskjellen er den samme hver gang: +${d}.`,why:`Rekken øker med ${d} hver gang.`,err:"tallrekke"}}
 if(type==="odd"){const base=rand(2,9),good=[base*2,base*3,base*4],odd=base*5+1,opts=[...good,odd].sort(()=>Math.random()-.5);return{q:`Hvilket tall bryter mønsteret? ${opts.join(", ")}`,ans:String(odd),opts:opts.map(String),h1:"Se etter en egenskap tre av tallene deler.",h2:`Sjekk hvilke tall som er multipler av ${base}.`,why:`De andre er multipler av ${base}.`,err:"mønster"}}
 if(type==="relation"){return{q:"Ada er eldre enn Birk. Cato er yngre enn Birk. Hvem er eldst?",ans:"Ada",opts:["Ada","Birk","Cato","Kan ikke avgjøres"],h1:"Skriv relasjonene som > eller <.",h2:"Ada > Birk og Birk > Cato.",why:"Dermed er Ada eldst.",err:"relasjon"}}
 if(type==="truth"){return{q:"Én av to personer lyver alltid. A sier: «B lyver». B sier: «Vi lyver begge». Hvem kan være sannferdig?",ans:"A",opts:["A","B","Begge","Ingen"],h1:"Test først hva som skjer hvis B snakker sant.",h2:"Hvis B snakker sant når B sier at begge lyver, motsier B seg selv.",why:"B kan ikke være sannferdig i denne oppgaven, derfor er A sannferdig.",err:"sannhet/løgn"}}
 if(type==="matrix"){const a=rand(2,8),b=rand(2,8);return{q:`En regel sier at nederst høyre er produktet av ${a} og ${b}. Hva blir tallet?`,ans:String(a*b),opts:[a*b,a+b,a*b+1,a+b+2].map(String).sort(()=>Math.random()-.5),h1:"Ikke let etter en skjult regel når regelen allerede er oppgitt.",h2:`Produkt betyr ${a} × ${b}.`,why:`${a} × ${b} = ${a*b}.`,err:"regelbruk"}}
 if(type==="alternating"){const a=rand(2,6),seq=[a,a+2,(a+2)*2,(a+2)*2+2,((a+2)*2+2)*2],ans=((a+2)*2+2)*2+2;return{q:`Hva kommer neste? ${seq.join(", ")}, ?`,ans:String(ans),opts:[ans,ans+2,ans*2,ans-2].map(String).sort(()=>Math.random()-.5),h1:"Det er ikke samme operasjon hver gang.",h2:"Operasjonene veksler mellom +2 og ×2.",why:"Regelen veksler +2, ×2, +2, ×2, +2.",err:"vekslende mønster"}}
 if(type==="difference"){const a=rand(1,5),seq=[a,a+1,a+3,a+6,a+10],ans=a+15;return{q:`Hva kommer neste? ${seq.join(", ")}, ?`,ans:String(ans),opts:[ans,ans+1,ans-1,ans+5].map(String).sort(()=>Math.random()-.5),h1:"Se på forskjellene mellom tallene, ikke bare tallene.",h2:"Forskjellene er +1, +2, +3, +4 …",why:"Neste forskjell er +5.",err:"andre differanse"}}
 return{q:"En person kommer sent tre dager på rad. Kan du sikkert konkludere med at personen er lat?",ans:"Nei, for lite informasjon",opts:["Ja","Nei, for lite informasjon","Ja, hvis det er samme tidspunkt","Bare hvis andre er enige"],h1:"Skill observasjon fra årsaksforklaring.",h2:"Du vet at personen kom sent, men ikke hvorfor.",why:"Årsaken er ukjent. Konklusjonen går lenger enn informasjonen.",err:"overkonklusjon"}
}
function newLogic(){currentLogic=makeLogic();logicHints=0;resetHint("logicHintBox");$("logicQuestion").textContent=currentLogic.q;$("logicReason").value="";$("logicFeedback").textContent="";$("logicOptions").innerHTML=currentLogic.opts.map(o=>`<button onclick='answerLogic(${JSON.stringify(o)})'>${o}</button>`).join("")}
function logicHint(){if(!currentLogic)return;logicHints++;if(logicHints===1)showHint("logicHintBox",`<strong>Hint 1:</strong> ${currentLogic.h1}`);else if(logicHints===2)showHint("logicHintBox",`<strong>Hint 2:</strong> ${currentLogic.h2}`);else{showHint("logicHintBox",`<strong>Svar:</strong> ${currentLogic.ans}<br>${currentLogic.why}`);addMistake({skill:"logic",q:currentLogic.q,answer:currentLogic.ans,options:currentLogic.opts,hint:currentLogic.h1,explain:currentLogic.why,type:currentLogic.err});save()}}
function answerLogic(v){
 if(state.settings.explain&&!$("logicReason").value.trim()){$("logicFeedback").textContent="Skriv en kort begrunnelse først.";return}
 const ok=v===currentLogic.ans;$("logicFeedback").innerHTML=(ok?`<span class="good">Riktig ✓</span> `:`<span class="bad">Ikke riktig.</span> `)+currentLogic.why;
 if(ok){state.records.logicStreak=(state.records.logicStreak||0)+1}else state.records.logicStreak=0;
 record("logic",ok,ok?(logicHints?9:14):0,ok?null:"logikk: "+currentLogic.err,ok?null:{skill:"logic",q:currentLogic.q,answer:currentLogic.ans,options:currentLogic.opts,hint:currentLogic.h1,explain:currentLogic.why,type:currentLogic.err});
 if(ok&&state.settings.autoNext)setTimeout(newLogic,900)
}

/* REACTION */
let reaction={phase:"idle",timer:null,start:0,target:true};
function startReaction(){clearTimeout(reaction.timer);const mode=$("reactionMode").value;reaction.phase="waiting";$("reactionBox").className="reaction-box";$("reactionBox").textContent="Vent…";$("reactionFeedback").textContent="";reaction.timer=setTimeout(()=>{reaction.target=mode==="simple"?true:Math.random()>.35;reaction.phase="ready";reaction.start=performance.now();$("reactionBox").className="reaction-box "+(reaction.target?"ready":"nogo");$("reactionBox").textContent=reaction.target?"TRYKK":"IKKE TRYKK";if(!reaction.target)setTimeout(()=>{if(reaction.phase==="ready"){reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="good">Bra kontroll ✓</span>`;record("reaction",true,12);$("reactionBox").className="reaction-box";$("reactionBox").textContent="Start igjen"}},900)},rand(1200,3500))}
function reactionClick(){if(reaction.phase==="waiting"){clearTimeout(reaction.timer);reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="bad">For tidlig.</span> Vent på signalet.`;record("reaction",false,0,"reaksjon: for tidlig");return}if(reaction.phase==="ready"){if(!reaction.target){reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="bad">No-Go bom.</span> Her skulle du latt være å trykke.`;record("reaction",false,0,"reaksjon: inhibisjon");return}const ms=Math.round(performance.now()-reaction.start);reaction.phase="idle";if(state.records.reaction===null||ms<state.records.reaction)state.records.reaction=ms;$("reactionFeedback").innerHTML=`<span class="good">${ms} ms</span>`;record("reaction",ms<650,10,ms<650?null:"reaksjon: treg");save()}}

/* OBSERVATION */
const obsItems=["🔑 nøkkel","📕 rød bok","☕ kopp","🕶️ solbriller","🎧 hodetelefoner","⌚ klokke","✏️ blyant","🪙 mynt","📱 mobil","🧤 hanske","🎲 terning","🍎 eple","🧩 puslespillbit","📎 binders","🧃 juice"];
let observe={scene:null,changed:null};
function startObserve(){const mode=$("observeMode").value,lvl=state.levels.observe,count=Math.min(10,4+Math.floor(lvl/2)),scene=[...obsItems].sort(()=>Math.random()-.5).slice(0,count);observe.scene=scene;$("observeQuestions").innerHTML="";$("observeFeedback").textContent="";$("observeScene").textContent=scene.join("   •   ");
 if(mode==="recall")setTimeout(()=>{$("observeScene").textContent="Skjult.";renderRecallQuestions()},Math.max(1800,5000-lvl*120));
 else setTimeout(()=>{const changed=[...scene],i=rand(0,changed.length-1),replacement=choice(obsItems.filter(x=>!scene.includes(x)));observe.changed={i,old:changed[i],new:replacement};changed[i]=replacement;$("observeScene").textContent=changed.join("   •   ");$("observeQuestions").innerHTML=`<div class="question-block"><label>Hva ble byttet ut? Skriv den gamle tingen.</label><input id="obsChange"></div><button class="primary" onclick="checkObserveChange()">Svar</button>`},Math.max(1800,5000-lvl*120))}
function renderRecallQuestions(){$("observeQuestions").innerHTML=`<div class="question-block"><label>Hvor mange ting var det?</label><input id="oq0"></div><div class="question-block"><label>Skriv to ting du husker, separert med komma.</label><input id="oq1"></div><button class="primary" onclick="checkObserveRecall()">Svar</button>`}
function checkObserveRecall(){const n=$("oq0").value.trim(),items=$("oq1").value.toLowerCase().split(",").map(x=>x.trim()).filter(Boolean),countOk=n===String(observe.scene.length),hits=items.filter(i=>observe.scene.some(x=>x.toLowerCase().includes(i)&&i.length>1)).length,ok=countOk&&hits>=2;$("observeFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Ikke helt.</span> Det var: ${observe.scene.join(", ")}`;record("observe",ok,15,ok?null:"observasjon: gjenkalling")}
function checkObserveChange(){const v=$("obsChange").value.toLowerCase(),ok=observe.changed.old.toLowerCase().includes(v)&&v.length>1;$("observeFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Det var ${observe.changed.old} som ble erstattet.</span>`;record("observe",ok,15,ok?null:"observasjon: endring")}

/* CONTROL */
const controlExercises=[
["2-sekundersregelen","I tre samtaler: vent omtrent 2 sekunder før du svarer på noe som overrasker eller irriterer deg."],
["Nøytralt kamera","Film deg selv i 2 minutter mens du løser hoderegning. Hold ansikt og skuldre avslappet."],
["Ingen fyllord","I én samtale: ikke fyll stillhet automatisk med «eh», nervøs latter eller unødvendige ord."],
["Fakta vs tolkning","Legg merke til tre ting noen gjør. Skill mentalt hva du faktisk så fra hva du tror det betyr."],
["Rolig kropp","I fem minutter: sitt eller stå rolig uten unødvendig fikling. Pust normalt."],
["Kontrollert overraskelse","Be noen lese deg fem tilfeldige ord eller spørsmål. Svar rolig uten å skynde deg."],
["Pokerfjes + matte","Film 3 minutter. Løs hoderegning mens du holder et avslappet, naturlig uttrykk."],
["Ubehagelig stillhet","La en naturlig stillhet vare litt lenger enn vanlig uten å fylle den automatisk."],
["Nøytral gjenfortelling","Fortell om noe som irriterte deg, men bruk kun observerbare fakta først. Legg tolkningen til slutt."],
["Responsvalg","Når du får lyst til å svare umiddelbart på noe, finn mentalt to mulige svar før du velger ett."]
];
function newControl(){const x=choice(controlExercises);$("controlTitle").textContent=x[0];$("controlText").textContent=x[1];$("controlFeedback").textContent=""}
function completeControl(){$("controlFeedback").innerHTML=`<span class="good">Registrert ✓</span>`;record("control",true,8)}

/* STRATEGY */
const strategies=[
{q:"Du får en melding: «Kan vi snakke senere?» Hva er beste første konklusjon?",a:"Ikke konkluder ennå",o:["De er sinte","Noe alvorlig har skjedd","Ikke konkluder ennå","De vil avslutte kontakten"],h1:"Hvor mye vet du egentlig fra én setning?",h2:"Velg alternativet som krever færrest antakelser.",why:"Meldingen er tvetydig. Mer informasjon er nødvendig."},
{q:"Du har to oppgaver: A haster i dag og tar 15 min. B er viktigere, frist om tre dager og tar 2 timer. Hva er mest robust plan?",a:"Gjør A først, planlegg blokk til B",o:["Bare B","Bare A","Gjør A først, planlegg blokk til B","Utsett begge"],h1:"Skill mellom akutt risiko og langsiktig viktighet.",h2:"Kan du fjerne den akutte risikoen uten å ofre B?",why:"Du fjerner dagens risiko raskt og reserverer tid til den viktige oppgaven."},
{q:"En venn virker kort i svarene. Hvilket neste steg gir mest informasjon med minst risiko?",a:"Spør normalt om alt er greit",o:["Konfronter dem","Ignorer dem i en uke","Spør normalt om alt er greit","Anta at de er sure på deg"],h1:"Ikke velg en løsning som bygger på tankelesing.",h2:"Lavdramatisk avklaring gir mer informasjon.",why:"Direkte, rolig avklaring er bedre enn å gjette motivet."},
{q:"Et valg har stor gevinst, men kan koste deg alt. Et annet har moderat gevinst og liten nedside. Hva bør vurderes først?",a:"Hvor stor nedside du faktisk tåler",o:["Hvilket som virker kulest","Hvor stor nedside du faktisk tåler","Hva andre ville valgt","Bare maksimal gevinst"],h1:"Strategi handler ikke bare om oppside.",h2:"Spør hva som skjer hvis du tar feil.",why:"Risiko må vurderes opp mot hva du faktisk tåler å tape."},
{q:"Tre personer gir ulike forklaringer på samme hendelse. Hva bør du gjøre først?",a:"Finn hvilke fakta de faktisk er enige om",o:["Velg den mest selvsikre","Finn hvilke fakta de faktisk er enige om","Anta at to samarbeider","Tro den du liker best"],h1:"Start med informasjon som er minst omstridt.",h2:"Selvsikkerhet er ikke det samme som sannhet.",why:"Felles fakta er et bedre startpunkt enn personlighet eller tone."},
{q:"Du har 60 % sjanse for gevinst på 100 og 40 % sjanse for tap på 100. Forventet verdi?",a:"+20",o:["+20","0","-20","+60"],h1:"Gang hvert utfall med sannsynligheten.",h2:"0,6×100 + 0,4×(-100).",why:"60 - 40 = +20."},
{q:"Du får et rykte fra én person om at en annen har gjort noe. Hva er mest rasjonelt før du handler på det?",a:"Sjekk uavhengig informasjon først",o:["Tro det fordi de virker sikre","Sjekk uavhengig informasjon først","Konfronter personen offentlig","Fortell det videre for å se reaksjonen"],h1:"Hva er kostnaden ved å handle på feil informasjon?",h2:"Se etter en kilde som ikke bare gjentar samme påstand.",why:"Uavhengig verifisering reduserer risikoen for å handle på et rykte."},
{q:"Du merker at du allerede har brukt mye tid på en dårlig plan. Hva bør påvirke neste valg mest?",a:"Hva som gir best resultat fra nå av",o:["Hvor mye tid du allerede har brukt","Hva som gir best resultat fra nå av","At du må fullføre for å bevise noe","Hva som var planen opprinnelig"],h1:"Tid som allerede er brukt kan ikke hentes tilbake.",h2:"Unngå sunk-cost-fellen.",why:"Tidligere kostnad bør ikke styre et valg når den ikke kan reverseres."}
];
let currentStrategy=null,strategyHints=0;
function newStrategy(){currentStrategy=choice(strategies);strategyHints=0;resetHint("strategyHintBox");$("strategyLevel").textContent=state.levels.strategy;$("strategyQuestion").textContent=currentStrategy.q;$("strategyReason").value="";$("strategyFeedback").textContent="";$("strategyOptions").innerHTML=currentStrategy.o.map(o=>`<button onclick='answerStrategy(${JSON.stringify(o)})'>${o}</button>`).join("")}
function strategyHint(){if(!currentStrategy)return;strategyHints++;if(strategyHints===1)showHint("strategyHintBox",`<strong>Hint 1:</strong> ${currentStrategy.h1}`);else if(strategyHints===2)showHint("strategyHintBox",`<strong>Hint 2:</strong> ${currentStrategy.h2}`);else{showHint("strategyHintBox",`<strong>Svar:</strong> ${currentStrategy.a}<br>${currentStrategy.why}`);addMistake({skill:"strategy",q:currentStrategy.q,answer:currentStrategy.a,options:currentStrategy.o,hint:currentStrategy.h1,explain:currentStrategy.why,type:"beslutning"});save()}}
function answerStrategy(v){if(state.settings.explain&&!$("strategyReason").value.trim()){$("strategyFeedback").textContent="Skriv en kort begrunnelse først.";return}const ok=v===currentStrategy.a;$("strategyFeedback").innerHTML=(ok?`<span class="good">Godt valg ✓</span> `:`<span class="bad">Ikke beste valg.</span> `)+currentStrategy.why;record("strategy",ok,ok?(strategyHints?9:14):0,ok?null:"scenario: beslutning",ok?null:{skill:"strategy",q:currentStrategy.q,answer:currentStrategy.a,options:currentStrategy.o,hint:currentStrategy.h1,explain:currentStrategy.why,type:"beslutning"});if(ok&&state.settings.autoNext)setTimeout(newStrategy,1000)}

/* REVIEW */
let reviewQueue=[],reviewIndex=0,reviewCurrent=null,reviewHintCount=0;
function renderReviewSummary(){const groups={};state.mistakes.forEach(m=>groups[m.skill]=(groups[m.skill]||0)+1);$("reviewSummary").innerHTML=state.mistakes.length?`<h3>${state.mistakes.length} oppgaver å repetere</h3>${Object.entries(groups).map(([k,v])=>`<p><b>${names[k]||k}</b>: ${v}</p>`).join("")}`:"<h3>Feilbanken er tom 🎯</h3><p>Når du svarer feil, lagres nyttige oppgaver her automatisk.</p>"}
function startReview(){if(!state.mistakes.length){renderReviewSummary();return}reviewQueue=[...state.mistakes].sort(()=>Math.random()-.5).slice(0,12);reviewIndex=0;$("reviewExercise").hidden=false;nextReview()}
function nextReview(){if(reviewIndex>=reviewQueue.length){$("reviewQuestion").innerHTML="<h2>Repetisjon fullført ✓</h2>";$("reviewOptions").innerHTML="";$("reviewAnswer").style.display="none";$("reviewCounter").textContent="";return}reviewCurrent=reviewQueue[reviewIndex];reviewHintCount=0;resetHint("reviewHintBox");$("reviewCounter").textContent=`${reviewIndex+1}/${reviewQueue.length}`;$("reviewQuestion").textContent=reviewCurrent.q;$("reviewFeedback").textContent="";$("reviewAnswer").value="";if(reviewCurrent.options?.length){$("reviewAnswer").style.display="none";$("reviewOptions").innerHTML=reviewCurrent.options.map(o=>`<button onclick='selectReview(${JSON.stringify(o)})'>${o}</button>`).join("");reviewCurrent.selected=null}else{$("reviewAnswer").style.display="block";$("reviewOptions").innerHTML=""}}
function selectReview(v){reviewCurrent.selected=v;document.querySelectorAll("#reviewOptions button").forEach(b=>b.style.outline="");const b=[...document.querySelectorAll("#reviewOptions button")].find(x=>x.textContent===String(v));if(b)b.style.outline="2px solid #8fb3ff"}
function reviewHint(){if(!reviewCurrent)return;reviewHintCount++;showHint("reviewHintBox",reviewHintCount===1?`<strong>Hint:</strong> ${reviewCurrent.hint||"Tenk gjennom informasjonen steg for steg."}`:`<strong>Svar:</strong> ${reviewCurrent.answer}<br>${reviewCurrent.explain||""}`)}
function submitReview(){if(!reviewCurrent)return;const v=reviewCurrent.options?.length?reviewCurrent.selected:$("reviewAnswer").value.trim();if(v==null||v==="")return;const numeric=Number(v),targetNum=Number(reviewCurrent.answer),ok=(Number.isFinite(numeric)&&Number.isFinite(targetNum))?Math.abs(numeric-targetNum)<.001:String(v)===String(reviewCurrent.answer);$("reviewFeedback").innerHTML=ok?`<span class="good">Riktig nå ✓</span> ${reviewCurrent.explain||""}`:`<span class="bad">Ikke ennå.</span> ${reviewCurrent.hint||"Prøv å bryte opp problemet."}`;if(ok){const key=(reviewCurrent.skill||"")+"|"+reviewCurrent.q;state.mistakes=state.mistakes.filter(x=>(x.skill||"")+"|"+x.q!==key);state.xp+=6;save();reviewIndex++;setTimeout(nextReview,800)}}
function clearReview(){if(confirm("Tømme hele feilbanken?")){state.mistakes=[];save();renderReviewSummary();$("reviewExercise").hidden=true}}

/* DAILY */
function buildDailyQueue(){
 const ranked=skills.map(k=>{const a=skillAccuracy(k);const need=(a==null?.35:1-a)*3+(5-Math.min(5,state.levels[k]))*.15+(state.mistakes.some(m=>m.skill===k)?.5:0)+Math.random()*.15;return{k,need}}).sort((a,b)=>b.need-a.need);
 const first=ranked.slice(0,3).map(x=>x.k),rest=skills.filter(k=>!first.includes(k)).sort(()=>Math.random()-.5);return [...first,...rest].slice(0,6)
}
function startDaily(){state.sessions++;touchStreak();state.dailySession={active:true,queue:buildDailyQueue(),index:0,startXp:state.xp,completed:[]};save();openView("daily");renderDaily()}
function renderDaily(){const d=state.dailySession;if(!d||!d.active){$("dailyTaskTitle").textContent="Ingen aktiv økt";$("dailyTaskText").textContent="Start en ny økt fra forsiden.";return}if(d.index>=d.queue.length){const gained=state.xp-d.startXp;$("dailySkillLabel").textContent="FERDIG";$("dailyTaskTitle").textContent="Dagens økt er fullført ✓";$("dailyTaskText").textContent=`Du tjente ${gained} XP i økten.`;$("dailyProgressText").textContent=`${d.queue.length} / ${d.queue.length}`;$("dailyProgressBar").style.width="100%";$("dailyXpText").textContent=`+${gained} XP`;$("dailyDone").textContent="";d.active=false;state.xp+=20;save();return}const k=d.queue[d.index],gained=state.xp-d.startXp;$("dailySkillLabel").textContent=names[k].toUpperCase();$("dailyTaskTitle").textContent=names[k];$("dailyTaskText").textContent=descriptions[k];$("dailyProgressText").textContent=`${d.index} / ${d.queue.length}`;$("dailyProgressBar").style.width=`${d.index/d.queue.length*100}%`;$("dailyXpText").textContent=`+${gained} XP`;$("dailyPlan").innerHTML=d.queue.map((x,i)=>`<div class="daily-step ${i<d.index?"done":i===d.index?"current":""}"><span>${names[x]}</span><span class="tag">${i<d.index?"Ferdig":i===d.index?"Nå":"Senere"}</span></div>`).join("")}
function openDailyModule(){const d=state.dailySession;if(!d?.active)return;openView(d.queue[d.index])}
function skipDailyStep(){const d=state.dailySession;if(!d?.active)return;const k=d.queue.splice(d.index,1)[0];d.queue.push(k);save();renderDaily()}
function markDaily(skill){const d=state.dailySession;if(!d?.active||d.queue[d.index]!==skill)return;d.completed.push(skill);d.index++;save();if($("daily").classList.contains("active"))renderDaily()}
function quickPractice(){const ranked=skills.map(k=>({k,a:skillAccuracy(k)??.65,l:state.levels[k],mist:state.mistakes.filter(m=>m.skill===k).length})).sort((x,y)=>(x.a-y.a)||(y.mist-x.mist)||(x.l-y.l));openView(ranked[0].k)}

/* EXAM */
let exam={idx:0,score:0,q:null,total:14,selected:null};
function makeExamQ(){const type=choice(["math","logic","strategy"]);if(type==="math"){const a=rand(10,99),b=rand(10,99),op=choice(["+","×"]);return{q:`${a} ${op} ${b}`,ans:String(op==="+"?a+b:a*b),opts:null}}if(type==="logic"){const q=makeLogic();return{q:q.q,ans:q.ans,opts:q.opts}}const s=choice(strategies);return{q:s.q,ans:s.a,opts:s.o}}
function startExam(){exam={idx:0,score:0,q:null,total:14,selected:null};openView("exam");nextExam()}
function nextExam(){if(exam.idx>=exam.total){const pct=Math.round(exam.score/exam.total*100);state.records.exam=Math.max(state.records.exam||0,pct);state.history.push({date:dayKey(),score:pct});state.history=state.history.slice(-30);save();$("examQuestion").innerHTML=`<h2>Ferdig: ${pct}%</h2>`;$("examOptions").innerHTML="";$("examAnswer").style.display="none";$("examMeta").textContent="Eksamen fullført";return}exam.q=makeExamQ();exam.selected=null;$("examMeta").textContent=`Oppgave ${exam.idx+1}/${exam.total}`;$("examQuestion").textContent=exam.q.q;$("examFeedback").textContent="";$("examAnswer").value="";$("examAnswer").style.display=exam.q.opts?"none":"block";$("examOptions").innerHTML=exam.q.opts?exam.q.opts.map(o=>`<button onclick='selectExam(${JSON.stringify(o)})'>${o}</button>`).join(""):""}
function selectExam(v){exam.selected=v;document.querySelectorAll("#examOptions button").forEach(b=>b.style.outline="");const b=[...document.querySelectorAll("#examOptions button")].find(x=>x.textContent===String(v));if(b)b.style.outline="2px solid #8fb3ff"}
function submitExam(){const v=exam.q.opts?exam.selected:$("examAnswer").value.trim();if(v==null||v==="")return;const ok=String(v)===String(exam.q.ans);if(ok)exam.score++;$("examFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Feil. Riktig: ${exam.q.ans}</span>`;exam.idx++;setTimeout(nextExam,650)}

/* PROGRESS */
function renderProgress(){$("progressCards").innerHTML=skills.map(k=>{const s=state.skill[k],acc=s.t?Math.round(s.c/s.t*100):0;return `<div class="card"><div class="progress-line"><b>${names[k]}</b><span>Nivå ${state.levels[k]}</span></div><p>${s.t?acc+" % på nåværende nivå":"Ingen ferske forsøk"}</p><div class="bar"><div style="width:${Math.min(100,state.levels[k]/30*100)}%"></div></div></div>`}).join("");const errs=Object.entries(state.errors).sort((a,b)=>b[1]-a[1]).slice(0,10);$("errorSummary").innerHTML=errs.length?errs.map(([k,v])=>`<p><b>${k}</b>: ${v}</p>`).join(""):"<p>Ingen registrerte feiltyper ennå.</p>";drawHistory()}
function drawHistory(){const c=$("historyChart"),ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle="#26334d";ctx.lineWidth=1;for(let y=40;y<h;y+=50){ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(w-15,y);ctx.stroke()}const data=state.history.slice(-14);if(!data.length){ctx.fillStyle="#9aa7bd";ctx.font="20px sans-serif";ctx.fillText("Ingen eksamenshistorikk ennå.",40,80);return}ctx.strokeStyle="#8fb3ff";ctx.lineWidth=4;ctx.beginPath();data.forEach((d,i)=>{const x=40+i*((w-70)/Math.max(1,data.length-1)),y=h-30-(d.score/100)*(h-60);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
function renderRecords(){const r=state.records;$("recordCards").innerHTML=`<div class="card"><b>Beste reaksjon</b><h2>${r.reaction??"–"}${r.reaction?" ms":""}</h2></div><div class="card"><b>Lengste minnesekvens</b><h2>${r.memory||"–"}</h2></div><div class="card"><b>60 sek matte</b><h2>${r.math60||"–"}</h2></div><div class="card"><b>Beste eksamen</b><h2>${r.exam||"–"}${r.exam?"%":""}</h2></div>`;const ach=[["Første steg",state.total>=1,"Fullfør én oppgave"],["100 forsøk",state.total>=100,"Gjør 100 forsøk"],["Streak 7",state.streak>=7,"Tren 7 dager på rad"],["Matte 10",state.levels.math>=10,"Nå nivå 10 i matte"],["Minne 8",r.memory>=8,"Husk 8 symboler"],["Under 300",r.reaction&&r.reaction<300,"Reaksjon under 300 ms"],["Eksamen 90",r.exam>=90,"Få minst 90 %"],["Allrounder",skills.every(k=>state.levels[k]>=3),"Nivå 3 i alle områder"],["Ren feilbank",state.total>=20&&state.mistakes.length===0,"Få feilbanken ned til 0"]];$("achievements").innerHTML=ach.map(a=>`<div class="card achievement ${a[1]?"unlocked":""}"><h3>${a[1]?"🏆":"🔒"} ${a[0]}</h3><p>${a[2]}</p></div>`).join("")}

/* BACKUP */
function exportProgress(){const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="strategisk-trening-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importProgressFile(e){const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data||typeof data!=="object"||!data.levels)throw new Error();state=data;skills.forEach(k=>{state.levels[k]??=1;state.skill[k]??={c:0,t:0,score:0}});state.mistakes??=[];state.errors??={};state.settings??={focus:false,explain:false,autoNext:true};save();loadSettings();renderProgress();alert("Backup importert.")}catch{alert("Kunne ikke lese backup-filen.")}};r.readAsText(f)}
function resetProgress(){if(confirm("Nullstille all progresjon?")){state=fresh();save();loadSettings();renderProgress()}}

loadSettings();renderStats();newLogic();newControl();newStrategy();
if("serviceWorker" in navigator&&location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=7").catch(()=>{}))}
