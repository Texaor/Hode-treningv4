
const defaultState={
 xp:0,sessions:0,total:0,correct:0,streak:0,lastDay:null,records:{reaction:null,memory:0,math60:0,exam:0},history:[],
 settings:{focus:false,explain:false,soundOff:true},
 levels:{math:1,memory:1,logic:1,chess:1,observe:1,reaction:1,control:1,strategy:1},
 skill:{},errors:{}
};
const skills=["math","memory","logic","chess","observe","reaction","control","strategy"];
function fresh(){let s=structuredClone(defaultState);skills.forEach(k=>s.skill[k]={c:0,t:0,score:0});return s}
let state=JSON.parse(localStorage.getItem("strategiskStateV2")||"null")||fresh();
skills.forEach(k=>{if(!state.skill[k])state.skill[k]={c:0,t:0,score:0};if(!state.levels[k])state.levels[k]=1});
state.errors ||= {}; state.history ||= []; state.records ||= fresh().records; state.settings ||= fresh().settings;
const $=id=>document.getElementById(id), rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a, choice=a=>a[rand(0,a.length-1)];
let currentMath=null,mathRun={active:false,hard:false,sixty:false,score:0,end:0,timer:null};
let memory={phase:"idle",mode:"sequence",seq:[],work:null,nback:null};
let currentLogic=null, reaction={phase:"idle",timer:null,start:0,target:true}, observe={phase:"idle",scene:null,changed:null}, chess={idx:0,from:null,to:null,candidates:[]}, currentStrategy=null, exam={idx:0,score:0,q:null,total:12};

function save(){localStorage.setItem("strategiskStateV2",JSON.stringify(state));renderStats()}
function dayKey(){return new Date().toISOString().slice(0,10)}
function touchStreak(){let t=dayKey();if(state.lastDay===t)return;if(state.lastDay){let d=Math.round((new Date(t)-new Date(state.lastDay))/86400000);state.streak=d===1?state.streak+1:1}else state.streak=1;state.lastDay=t}
function addError(type){state.errors[type]=(state.errors[type]||0)+1}
function record(skill,ok,xp=10,err=null){
 touchStreak();state.total++;state.skill[skill].t++;if(ok){state.correct++;state.skill[skill].c++;state.skill[skill].score+=1;state.xp+=xp}else{state.skill[skill].score-=.5;if(err)addError(err)}
 adapt(skill); save();
}
function adapt(skill){
 const s=state.skill[skill]; if(s.t<6)return; let acc=s.c/s.t;
 if(acc>=.82){state.levels[skill]=Math.min(30,state.levels[skill]+1);s.c=0;s.t=0}
 else if(acc<.5&&state.levels[skill]>1){state.levels[skill]--;s.c=0;s.t=0}
}
function globalLevel(){return Math.max(1,Math.round(Object.values(state.levels).reduce((a,b)=>a+b,0)/skills.length))}
function renderStats(){
 $("globalLevel").textContent=globalLevel();$("xpStat").textContent=state.settings.focus?"–":state.xp;$("streakStat").textContent=state.settings.focus?"–":state.streak;
 $("accuracyStat").textContent=(state.total?Math.round(state.correct/state.total*100):0)+"%";$("recordStat").textContent=Object.values(state.records).filter(v=>v!==null&&v!==0).length;
 ["math","memory","logic","observe"].forEach(k=>{let e=$(k+"Level");if(e)e.textContent=state.levels[k]});
 renderWeakness();
}
function renderWeakness(){
 let ranked=skills.map(k=>({k,score:state.skill[k].t?state.skill[k].c/state.skill[k].t:1,lvl:state.levels[k]})).sort((a,b)=>a.score-b.score||a.lvl-b.lvl);
 const names={math:"hoderegning",memory:"hukommelse",logic:"logikk",chess:"sjakk",observe:"observasjon",reaction:"reaksjon",control:"selvkontroll",strategy:"scenarioanalyse"};
 let w=ranked.slice(0,3).map(x=>names[x.k]).join(", ");$("weaknessCard").innerHTML=`<div class="eyebrow">ADAPTIVT FOKUS</div><b>Prioriter nå:</b> ${w}. <p>Dette endres automatisk etter hvert som du trener.</p>`;
}
function openView(id){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));$(id).classList.add("active");window.scrollTo(0,0);
 if(id==="logic")newLogic();if(id==="chess")newChess();if(id==="control")newControl();if(id==="strategy")newStrategy();if(id==="progress")renderProgress();if(id==="records")renderRecords();renderStats()}
function toggleSettings(){$("settingsPanel").classList.toggle("show")}
function saveSettings(){state.settings.focus=$("focusMode").checked;state.settings.explain=$("explainBeforeAnswer").checked;state.settings.soundOff=$("soundOff").checked;save()}
function loadSettings(){$("focusMode").checked=state.settings.focus;$("explainBeforeAnswer").checked=state.settings.explain;$("soundOff").checked=state.settings.soundOff}

/* MATH */
function startMathMode(){clearInterval(mathRun.timer);mathRun={active:true,hard:$("mathChallenge").value==="hard",sixty:$("mathChallenge").value==="sixty",score:0,end:Date.now()+60000,timer:null};if(mathRun.sixty){mathRun.timer=setInterval(()=>{let left=Math.max(0,Math.ceil((mathRun.end-Date.now())/1000));$("mathTimer").textContent=left+"s";if(left<=0){clearInterval(mathRun.timer);mathRun.active=false;$("mathFeedback").innerHTML=`Tiden er ute. Score: <b>${mathRun.score}</b>`;if(mathRun.score>state.records.math60)state.records.math60=mathRun.score;save()}},250)}else $("mathTimer").textContent="∞";newMath()}
function newMath(){
 let lvl=state.levels.math,mode=$("mathMode").value;if(mode==="mixed")mode=choice(["add","sub","mul","div",...(lvl>=3?["percent"]:[]),...(lvl>=5?["fraction","estimate","chain"]:[])]);
 let q,ans,tip="",tol=.001,err=mode;
 if(mode==="add"){let m=25+lvl*45,a=rand(-Math.floor(lvl/3)*20,m),b=rand(5,m);q=`${a} + ${b}`;ans=a+b}
 if(mode==="sub"){let m=30+lvl*50,a=rand(10,m),b=rand(-Math.floor(lvl/4)*20,a);q=`${a} − ${b}`;ans=a-b}
 if(mode==="mul"){let m=Math.min(60,6+lvl*3),a=rand(2,m),b=rand(2,m);q=`${a} × ${b}`;ans=a*b;tip=(b===19||a===19)?"×19 kan ofte gjøres som ×20 − tallet.":""}
 if(mode==="div"){let b=rand(2,Math.min(20,4+lvl)),x=rand(2,Math.min(50,8+lvl*2)),a=b*x;q=`${a} ÷ ${b}`;ans=x}
 if(mode==="percent"){let p=choice([5,10,12.5,15,20,25,30,40,50,75]),base=rand(2,30)*10;q=`${p}% av ${base}`;ans=p*base/100;tip="Bryt prosenten ned i enkle deler som 10 %, 5 %, 25 %."}
 if(mode==="fraction"){let den=choice([2,3,4,5,6,8,10]),num=rand(1,den-1),base=den*rand(2,20);q=`${num}/${den} av ${base}`;ans=num*base/den}
 if(mode==="estimate"){let a=rand(120,990),b=rand(120,990);q=`Estimer ${a} + ${b} til nærmeste 100`;ans=Math.round((a+b)/100)*100;tol=50;tip="Rund tallene først og sjekk størrelsesorden."}
 if(mode==="chain"){let a=rand(5,30),b=rand(2,15),c=rand(2,12);q=`(${a} + ${b}) × ${c}`;ans=(a+b)*c}
 currentMath={ans,tol,err};$("mathQuestion").textContent=q;$("mathAnswer").value="";$("mathReason").value="";$("mathFeedback").textContent="";$("mathTip").textContent=tip;$("mathLevel").textContent=lvl;$("mathAnswer").focus()
}
function checkMath(){
 if(!currentMath||!mathRun.active)return;if(state.settings.explain&&!$("mathReason").value.trim()){ $("mathFeedback").textContent="Skriv kort hvordan du tenkte først.";return}
 let v=Number($("mathAnswer").value.replace(",",".")),ok=Math.abs(v-currentMath.ans)<=currentMath.tol;
 if(ok){mathRun.score++;$("mathFeedback").innerHTML=`<span class="good">Riktig ✓</span>`;record("math",true,12)}else{$("mathFeedback").innerHTML=`<span class="bad">Feil. Riktig svar: ${currentMath.ans}</span>`;record("math",false,0,"matte: "+currentMath.err);if(mathRun.hard){mathRun.active=false;clearInterval(mathRun.timer);$("mathFeedback").innerHTML+=`<br>Hard mode avsluttet. Score: ${mathRun.score}`;return}}
 if(mathRun.sixty&&Date.now()>mathRun.end)return;setTimeout(newMath,ok?350:900)
}
$("mathAnswer").addEventListener("keydown",e=>{if(e.key==="Enter")checkMath()});

/* MEMORY */
function startMemory(){memory.mode=$("memoryMode").value;memory.phase="show";$("memoryFeedback").textContent="";$("memoryAnswer").value="";$("memoryWork").innerHTML="";let lvl=state.levels.memory;
 if(memory.mode==="sequence"){let n=Math.min(14,4+Math.floor(lvl/2)),pool="ABCDEFGHJKLMNPQRSTUVWXYZ23456789".split("");memory.seq=Array.from({length:n},()=>choice(pool));$("memoryPrompt").textContent=memory.seq.join("  ");setTimeout(()=>{$("memoryPrompt").textContent="••••••";memory.phase="answer";$("memoryAnswer").placeholder="Sekvens";$("memoryAnswer").focus()},Math.max(1200,4200-lvl*120))}
 if(memory.mode==="working"){let n=Math.min(8,3+Math.floor(lvl/3));memory.seq=Array.from({length:n},()=>rand(1,9));let add=rand(1,9);memory.work={add};$("memoryPrompt").textContent=memory.seq.join("  ");$("memoryWork").innerHTML=`<p>Husk tallene. Etterpå: legg <b>${add}</b> til hvert tall og skriv den nye sekvensen.</p>`;setTimeout(()=>{$("memoryPrompt").textContent="Skjult";memory.phase="answer";$("memoryAnswer").focus()},Math.max(1500,4500-lvl*100))}
 if(memory.mode==="nback"){let n=Math.min(3,1+Math.floor(lvl/5)),len=8+Math.floor(lvl/2),pool=["A","B","C","D","E","F"];let seq=Array.from({length:len},()=>choice(pool));let idx=rand(n,len-1);seq[idx]=seq[idx-n];memory.nback={n,seq,idx};$("memoryPrompt").textContent=seq.join("  ");$("memoryWork").innerHTML=`<p>Hvilken posisjon (1-${len}) gjentar symbolet fra <b>${n}</b> steg tidligere?</p>`;memory.phase="answer"}
}
function memoryAction(){if(memory.phase!=="answer")return;let ok=false,lvl=state.levels.memory;
 if(memory.mode==="sequence"){ok=$("memoryAnswer").value.toUpperCase().replace(/\s/g,"")===memory.seq.join("")}
 if(memory.mode==="working"){let want=memory.seq.map(x=>x+memory.work.add).join("");ok=$("memoryAnswer").value.replace(/\D/g,"")===want}
 if(memory.mode==="nback"){ok=Number($("memoryAnswer").value)===memory.nback.idx+1}
 $("memoryFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Ikke helt.</span>`;
 if(ok&&memory.mode==="sequence"){state.records.memory=Math.max(state.records.memory,memory.seq.length)}record("memory",ok,15,ok?null:"hukommelse: "+memory.mode);memory.phase="idle";save()
}

/* LOGIC */
function makeLogic(){
 let lvl=state.levels.logic,type=choice(["seq","odd","relation","truth","matrix","insufficient"]);
 if(type==="seq"){let a=rand(1,15),d=rand(2,7+Math.floor(lvl/3)),seq=[a,a+d,a+2*d,a+3*d];let ans=a+4*d;return{q:`Hva kommer neste? ${seq.join(", ")}, ?`,ans:String(ans),opts:[ans,ans+d,ans-d,ans+1].sort(()=>Math.random()-.5).map(String),why:`Forskjellen er +${d} hver gang.`,err:"logikk: tallrekke"}}
 if(type==="odd"){let base=rand(2,9),good=[base*2,base*3,base*4],odd=base*5+1,opts=[...good,odd].sort(()=>Math.random()-.5);return{q:`Hvilket tall bryter mønsteret? ${opts.join(", ")}`,ans:String(odd),opts:opts.map(String),why:`De andre er multipler av ${base}.`,err:"logikk: mønster"}}
 if(type==="relation"){return{q:"Ada er eldre enn Birk. Cato er yngre enn Birk. Hvem er eldst?",ans:"Ada",opts:["Ada","Birk","Cato","Kan ikke avgjøres"],why:"Ada > Birk > Cato.",err:"logikk: relasjon"}}
 if(type==="truth"){return{q:"Én av to personer lyver alltid. A sier: «B lyver». B sier: «Vi lyver begge». Hvem kan være sannferdig?",ans:"A",opts:["A","B","Begge","Ingen"],why:"Hvis B snakker sant, sier B samtidig at B lyver. Det er selvmotsigende. Derfor er A sannferdig.",err:"logikk: sannhet/løgn"}}
 if(type==="matrix"){let a=rand(2,8),b=rand(2,8);return{q:`2×2-regel: øverst venstre=${a}, øverst høyre=${b}, nederst venstre=${a+b}. Hvis nederst høyre følger regelen «produkt», hva er tallet?`,ans:String(a*b),opts:[a*b,a+b,a*b+1,a+b+2].map(String).sort(()=>Math.random()-.5),why:"Nederst høyre følger eksplisitt produktregelen.",err:"logikk: matrise"}}
 return{q:"En person kommer sent tre dager på rad. Kan du sikkert konkludere med at personen er lat?",ans:"Nei, for lite informasjon",opts:["Ja","Nei, for lite informasjon","Ja, hvis det er samme tidspunkt","Bare hvis andre er enige"],why:"Observasjonen sier bare at personen kom sent. Årsaken er ukjent.",err:"logikk: overkonklusjon"}
}
function newLogic(){currentLogic=makeLogic();$("logicQuestion").textContent=currentLogic.q;$("logicReason").value="";$("logicFeedback").textContent="";$("logicOptions").innerHTML=currentLogic.opts.map(o=>`<button onclick='answerLogic(${JSON.stringify(o)})'>${o}</button>`).join("")}
function answerLogic(v){if(state.settings.explain&&!$("logicReason").value.trim()){ $("logicFeedback").textContent="Begrunn valget kort først.";return}let ok=v===currentLogic.ans;$("logicFeedback").innerHTML=(ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Feil.</span>`)+` ${currentLogic.why}`;record("logic",ok,14,ok?null:currentLogic.err)}

/* CHESS v6: legal moves + official Lichess puzzles */
const pieces={K:"♔",Q:"♕",R:"♖",B:"♗",N:"♘",P:"♙",k:"♚",q:"♛",r:"♜",b:"♝",n:"♞",p:"♟"};
const knownLichessPuzzleIds=["00sHx","00sJ9","00sJb","00sO1","onWjf","NO0kY","AE9kE","Nw9Bj","EdwR2","b3Nx3","xx3mN","D8OlZ","886cH","0n3j7","xtWJ2","NKEkV"];
let livePuzzle=null,puzzleBoard=null,puzzleStep=0,puzzleLoading=false,puzzleSolved=false,puzzleHadMistake=false,puzzleUsedHint=false,puzzleHintLevel=0,boardOrientation='w';
let stockfishWorker=null,engineReady=false,engineBusy=false,engineLast={best:null,score:null,cp:null,pv:null},engineRequest=null,analysisFen=null;

function waitForChessCore(timeout=12000){
 if(window.ChessCore)return Promise.resolve(true);
 return new Promise(resolve=>{let done=false;const f=()=>{if(done)return;done=true;clearTimeout(t);resolve(true)};window.addEventListener('chessjs-ready',f,{once:true});const t=setTimeout(()=>{if(!done){done=true;resolve(!!window.ChessCore)}},timeout)})
}
function prettyTheme(t){const map={fork:'Gaffel',pin:'Binding',skewer:'Spidd',discoveredAttack:'Avdekket angrep',hangingPiece:'Hengende brikke',mate:'Matt',mateIn1:'Matt i 1',mateIn2:'Matt i 2',defensiveMove:'Forsvar',sacrifice:'Offer',attraction:'Avledning',deflection:'Avledning',clearance:'Linjeåpning',interference:'Interferens',promotion:'Forvandling',endgame:'Sluttspill',middlegame:'Midtspill',opening:'Åpning',advantage:'Fordel'};return map[t]||t.replace(/([a-z])([A-Z])/g,'$1 $2')}
function cachePuzzleData(data){
 state.chessPuzzleCache ||= [];
 const id=data?.puzzle?.id;if(!id)return;
 state.chessPuzzleCache=state.chessPuzzleCache.filter(x=>x?.puzzle?.id!==id);state.chessPuzzleCache.unshift(data);state.chessPuzzleCache=state.chessPuzzleCache.slice(0,30);save();
}
async function fetchPuzzleData(){
 const headers={Accept:'application/json'};
 try{
  const r=await fetch('https://lichess.org/api/puzzle/next',{headers,cache:'no-store'});
  if(r.ok){const d=await r.json();if(d?.puzzle?.solution?.length&&d?.game?.pgn){cachePuzzleData(d);return d}}
 }catch(e){console.warn('Lichess random puzzle:',e)}
 // Public ID fallback: all are real Lichess puzzle IDs.
 for(let tries=0;tries<4;tries++){
  try{let id=choice(knownLichessPuzzleIds),r=await fetch('https://lichess.org/api/puzzle/'+id,{headers});if(r.ok){let d=await r.json();if(d?.puzzle?.solution?.length&&d?.game?.pgn){cachePuzzleData(d);return d}}}catch(e){}
 }
 if(state.chessPuzzleCache?.length)return choice(state.chessPuzzleCache);
 throw new Error('Kunne ikke hente en sjakkoppgave. Koble til nettet og prøv igjen.');
}
function changeChessMode(){
 let mode=$("chessMode").value;
 $("enginePanel").hidden=mode!=="engine";
 $("chessHintBtn").hidden=mode==="engine";
 $("candidateAddBtn").hidden=mode!=="candidate";
 if(mode==="engine")loadFenForAnalysis();else newChess();
}
async function newChess(){
 if($("chessMode").value==='engine'){loadFenForAnalysis();return}
 if(puzzleLoading)return;puzzleLoading=true;clearChess();
 $("chessGoal").textContent='Laster en ekte Lichess-oppgave…';$("chessHint").textContent='Validerer stilling og løsning.';$("chessFeedback").textContent='';$("puzzleMeta").textContent='';
 try{
  if(!await waitForChessCore())throw new Error('Sjakkregel-biblioteket kunne ikke lastes. Sjekk nettilkoblingen én gang.');
  const data=await fetchPuzzleData();
  const board=window.ChessCore.puzzlePosition(data);
  livePuzzle=data;puzzleBoard=board;puzzleStep=0;puzzleSolved=false;puzzleHadMistake=false;puzzleUsedHint=false;puzzleHintLevel=0;boardOrientation=board.turn();analysisFen=board.fen();
  chess.from=null;chess.to=null;chess.candidates=[];
  $("chessTheme").textContent='LICHESS';$("chessPuzzleNo").textContent='#'+(data.puzzle.id||'–');
  $("chessGoal").textContent=`${board.turn()==='w'?'Hvit':'Svart'} trekker. Finn beste fortsettelse.`;
  $("chessHint").textContent='Temaene holdes skjult til du er ferdig, så de ikke røper løsningen.';
  $("puzzleMeta").innerHTML=`Rating: <b>${data.puzzle.rating??'–'}</b> · offisiell Lichess-oppgave`;
  $("chessSource").textContent='Kilde: Lichess puzzle '+(data.puzzle.id||'');
  $("candidateBox").textContent=$("chessMode").value==='candidate'?'Legg inn minst to lovlige kandidat-trekk før du velger slutt-trekket.':'';
  renderBoard();
 }catch(e){console.error(e);livePuzzle=null;puzzleBoard=null;$("chessGoal").textContent='Sjakk kunne ikke lastes';$("chessFeedback").innerHTML=`<span class="bad">${e.message||'Ukjent feil'}</span>`;renderBoard()}
 finally{puzzleLoading=false}
}
function clearChess(){chess.from=null;chess.to=null;document.querySelectorAll('.square').forEach(x=>x.classList.remove('sel','legal','hint-square'));setSelectedUci('')}
function fenToPieces(fen){let board=fen.trim().split(/\s+/)[0],rows=board.split('/'),out={};if(rows.length!==8)throw new Error('Ugyldig FEN');rows.forEach((row,r)=>{let f=0;for(let ch of row){if(/\d/.test(ch))f+=Number(ch);else{if(f>7)throw new Error('Ugyldig FEN');out["abcdefgh"[f]+(8-r)]=ch;f++}}if(f!==8)throw new Error('Ugyldig FEN')});return out}
function chessFenSide(fen){return(fen.trim().split(/\s+/)[1]||'w')}
function currentChessFen(){if($("chessMode").value==='engine')return analysisFen||$("fenInput").value.trim();return puzzleBoard?.fen()||null}
function pieceImage(pc){if(!pc)return'';let color=pc===pc.toUpperCase()?'w':'b',type=pc.toUpperCase();return `https://lichess1.org/assets/piece/cburnett/${color}${type}.svg`}
function displaySquares(){let arr=[];if(boardOrientation==='b'){for(let r=7;r>=0;r--)for(let f=7;f>=0;f--)arr.push("abcdefgh"[f]+(8-r))}else{for(let r=0;r<8;r++)for(let f=0;f<8;f++)arr.push("abcdefgh"[f]+(8-r))}return arr}
function renderBoard(clearFeedback=false){
 let fen=currentChessFen(),pcs={};try{if(fen)pcs=fenToPieces(fen)}catch(e){}
 let html='';for(let sq of displaySquares()){let f="abcdefgh".indexOf(sq[0]),r=8-Number(sq[1]),pc=pcs[sq]||'',cls=(r+f)%2===0?'light':'dark';let img=pc?`<img class="chess-piece" src="${pieceImage(pc)}" alt="${pieces[pc]||pc}" draggable="false">`:'';html+=`<button class="square ${cls}" data-s="${sq}" aria-label="${sq}" onclick="pickSquare('${sq}')">${img}</button>`}$("board").innerHTML=html;if(clearFeedback)$("chessFeedback").textContent=''
}
function selectedUci(){return $("selectedMove").dataset.uci||''}
function setSelectedUci(mv){$("selectedMove").dataset.uci=mv||'';$("selectedMove").textContent=mv?`Trekk: ${mv.slice(0,2)} → ${mv.slice(2,4)}${mv[4]?` = ${mv[4].toUpperCase()}`:''}`:'Trekk: –'}
function pickSquare(s){
 let fen=currentChessFen();if(!fen||!window.ChessCore)return;
 if(!chess.from){
  let legal=window.ChessCore.legalMovesFrom(fen,s);if(!legal.length){$("chessFeedback").textContent='Velg en brikke som har et lovlig trekk.';return}
  chess.from=s;document.querySelectorAll('.square').forEach(x=>x.classList.remove('sel','legal'));document.querySelector(`[data-s="${s}"]`)?.classList.add('sel');legal.forEach(d=>document.querySelector(`[data-s="${d}"]`)?.classList.add('legal'));return
 }
 let mv=chess.from+s,pcs={};try{pcs=fenToPieces(fen)}catch(e){};let pc=pcs[chess.from];if(pc&&pc.toUpperCase()==='P'&&(s[1]==='8'||s[1]==='1'))mv+='q';
 let test=window.ChessCore.tryMove(fen,mv);
 document.querySelectorAll('.square').forEach(x=>x.classList.remove('sel','legal'));
 if(!test.ok){chess.from=null;setSelectedUci('');$("chessFeedback").innerHTML='<span class="bad">Det trekket er ikke lovlig i denne stillingen.</span>';return}
 chess.from=null;chess.to=s;setSelectedUci(mv);$("chessFeedback").textContent='Lovlig trekk. Trykk «Sjekk trekk» når du er klar.';
}
function addCandidateMove(){let mv=selectedUci();if(!mv)return;let fen=currentChessFen(),test=window.ChessCore?.tryMove(fen,mv);if(!test?.ok){$("chessFeedback").textContent='Kandidaten må være et lovlig trekk.';return}if(!chess.candidates.includes(mv))chess.candidates.push(mv);$("candidateBox").innerHTML=`Kandidater (${chess.candidates.length}): <b>${chess.candidates.join(' · ')}</b>`;setSelectedUci('')}
function puzzleThemes(){return livePuzzle?.puzzle?.themes||[]}
function isMateInOneTheme(){let t=puzzleThemes();return t.includes('mateIn1')||t.includes('mate')&&livePuzzle?.puzzle?.solution?.length===1}
function applyPuzzleMove(mv){let m=window.ChessCore.uciMove(puzzleBoard,mv);if(!m)throw new Error('Lichess-løsningen inneholdt et trekk som ikke var lovlig i rekonstruert stilling.');analysisFen=puzzleBoard.fen();boardOrientation=boardOrientation||puzzleBoard.turn();renderBoard();return m}
function finishPuzzle(){
 puzzleSolved=true;let themes=puzzleThemes().map(prettyTheme).join(', ')||'Uten temamerke';let clean=!puzzleHadMistake&&!puzzleUsedHint;
 $("chessTheme").textContent='LØST';$("chessGoal").textContent='Oppgave løst ✓';$("chessHint").textContent='Tema: '+themes;
 $("chessFeedback").innerHTML=`<span class="good">Hele løsningen er korrekt.</span>${puzzleUsedHint?' Hint ble brukt.':''}`;
 state.chessThemes||={};for(let t of puzzleThemes()){state.chessThemes[t]||={c:0,t:0};state.chessThemes[t].t++;if(clean)state.chessThemes[t].c++}
 record('chess',clean,clean?22:10,clean?null:'sjakk: oppgave med feil/hint');
}
async function submitChess(){
 if($("chessMode").value==='engine'){analysePosition(true);return}
 if(!livePuzzle||!puzzleBoard||puzzleSolved){$("chessFeedback").textContent='Last en ny oppgave først.';return}
 let mv=selectedUci();if(!mv){$("chessFeedback").textContent='Velg et trekk på brettet først.';return}
 if($("chessMode").value==='candidate'&&chess.candidates.length<2){$("chessFeedback").textContent='Legg inn minst to kandidat-trekk før du sjekker slutt-trekket.';return}
 let legal=window.ChessCore.tryMove(puzzleBoard.fen(),mv);if(!legal.ok){$("chessFeedback").innerHTML='<span class="bad">Ulovlig trekk.</span>';return}
 let expected=livePuzzle.puzzle.solution[puzzleStep];let accepted=mv===expected||(isMateInOneTheme()&&legal.checkmate);
 if(!accepted){puzzleHadMistake=true;$("chessFeedback").innerHTML='<span class="bad">Lovlig trekk, men ikke løsningen.</span> Regn motstanderens beste svar og prøv igjen.';setSelectedUci('');return}
 try{applyPuzzleMove(mv)}catch(e){$("chessFeedback").innerHTML=`<span class="bad">Intern sjakkfeil: ${e.message}</span>`;return}
 puzzleStep++;setSelectedUci('');chess.candidates=[];$("candidateBox").textContent=$("chessMode").value==='candidate'?'Nye kandidater for neste beslutning.':'';
 if(puzzleStep>=livePuzzle.puzzle.solution.length){finishPuzzle();return}
 $("chessFeedback").innerHTML='<span class="good">Riktig.</span> Motstanderen svarer…';
 setTimeout(()=>{
  if(puzzleSolved||!livePuzzle)return;let reply=livePuzzle.puzzle.solution[puzzleStep];try{applyPuzzleMove(reply);puzzleStep++;if(puzzleStep>=livePuzzle.puzzle.solution.length){finishPuzzle();return}$("chessFeedback").textContent='Din tur igjen. Finn neste trekk i kombinasjonen.'}catch(e){$("chessFeedback").innerHTML=`<span class="bad">Kunne ikke spille Lichess-svaret: ${e.message}</span>`}
 },550)
}
function puzzleHint(){
 if(!livePuzzle||puzzleSolved)return;let mv=livePuzzle.puzzle.solution[puzzleStep];if(!mv)return;puzzleUsedHint=true;puzzleHintLevel++;
 document.querySelectorAll('.square').forEach(x=>x.classList.remove('hint-square'));
 if(puzzleHintLevel===1){document.querySelector(`[data-s="${mv.slice(0,2)}"]`)?.classList.add('hint-square');$("chessFeedback").textContent='Hint 1: Jeg har markert brikken som bør flyttes.'}
 else if(puzzleHintLevel===2){document.querySelector(`[data-s="${mv.slice(0,2)}"]`)?.classList.add('hint-square');document.querySelector(`[data-s="${mv.slice(2,4)}"]`)?.classList.add('hint-square');$("chessFeedback").textContent='Hint 2: Fra- og til-ruten er markert.'}
 else{$("chessFeedback").textContent=`Hint 3: Trekket er ${mv.slice(0,2)} → ${mv.slice(2,4)}.`}
}

/* Stockfish analysis mode */
function engineStatus(text,kind=''){let dot=$("engineDot");if(!dot)return;dot.className='engine-dot'+(kind?' '+kind:'');$("engineStatus").textContent=text}
async function loadStockfishSource(){
 const url='https://unpkg.com/stockfish@18.0.8/bin/stockfish-18-asm.js',cacheName='strategisk-stockfish-18';
 try{if('caches' in window){let cache=await caches.open(cacheName),cached=await cache.match(url);if(cached)return await cached.text();let res=await fetch(url,{mode:'cors'});if(!res.ok)throw new Error('HTTP '+res.status);await cache.put(url,res.clone());return await res.text()}}catch(e){console.warn('Stockfish cache/fetch:',e)}
 let res=await fetch(url,{mode:'cors'});if(!res.ok)throw new Error('HTTP '+res.status);return await res.text()
}
async function initStockfish(){
 if(stockfishWorker)return engineReady;engineStatus('Laster Stockfish 18…','busy');
 try{const source=await loadStockfishSource();stockfishWorker=new Worker(URL.createObjectURL(new Blob([source],{type:'text/javascript'})));return await new Promise(resolve=>{let settled=false,timer=setTimeout(()=>{if(!engineReady&&!settled){settled=true;engineStatus('Motor utilgjengelig. Lichess-oppgaver virker fortsatt.','error');resolve(false)}},20000);stockfishWorker.onmessage=e=>{let line=String(e.data);if(line.includes('uciok')&&!settled){engineReady=true;settled=true;clearTimeout(timer);engineStatus('Stockfish 18 klar','ready');resolve(true)}handleEngineLine(line)};stockfishWorker.onerror=()=>{if(!settled){settled=true;clearTimeout(timer);engineStatus('Motor kunne ikke startes.','error');engineReady=false;resolve(false)}};stockfishWorker.postMessage('uci')})}catch(e){engineStatus(navigator.onLine?'Motor kunne ikke lastes akkurat nå.':'Koble til nett for å laste motoren.','error');return false}
}
function parseEngineInfo(line){if(!line.startsWith('info ')||!line.includes(' score '))return;let m=line.match(/score (cp|mate) (-?\d+)/),pv=line.match(/ pv (.+)$/);if(m){engineLast.cp=m[1]==='cp'?Number(m[2]):(Number(m[2])>0?100000:-100000);engineLast.score=m[1]==='mate'?`Matt ${m[2]}`:(Number(m[2])/100).toFixed(2);if(pv)engineLast.pv=pv[1].split(' ').slice(0,8).join(' ')}}
function handleEngineLine(line){parseEngineInfo(line);if(!line.startsWith('bestmove '))return;engineBusy=false;engineLast.best=line.split(/\s+/)[1];engineStatus('Stockfish 18 klar','ready');let side=analysisFen?chessFenSide(analysisFen):'w';$("engineEval").textContent=`Evaluering: ${engineLast.score??'–'} (${side==='w'?'hvit':'svart'} i trekket)`;$("engineLine").textContent=`Beste linje: ${engineLast.pv||engineLast.best||'–'}`;
 if(engineRequest&&engineRequest.type==='movecheck'){
  if(engineRequest.stage==='best'){engineRequest.best=engineLast.best;engineRequest.baseCp=engineLast.cp;if(engineRequest.move===engineLast.best){$("chessFeedback").innerHTML='<span class="good">Trekket ditt er Stockfish sitt førstevalg ✓</span>';record('chess',true,22);engineRequest=null;return}engineRequest.stage='user';engineLast={best:null,score:null,cp:null,pv:null};engineBusy=true;engineStatus('Vurderer trekket ditt…','busy');stockfishWorker.postMessage('position fen '+analysisFen+' moves '+engineRequest.move);stockfishWorker.postMessage('go depth '+Math.min(16,9+Math.floor(state.levels.chess/2)));return}
  if(engineRequest.stage==='user'){let userCp=engineLast.cp==null?null:-engineLast.cp,loss=(userCp==null||engineRequest.baseCp==null)?null:Math.max(0,engineRequest.baseCp-userCp),label='Alternativt trekk',cls='';if(loss!=null){if(loss<=35){label='Sterkt trekk';cls='good'}else if(loss<=100){label='Unøyaktighet'}else if(loss<=250){label='Feil';cls='bad'}else{label='Blunder';cls='bad'}}let lossText=loss!=null&&loss<90000?` Omtrent ${(loss/100).toFixed(2)} bønder dårligere enn motorens førstevalg.`:'';$("chessFeedback").innerHTML=`<span class="${cls}">${label}</span> Stockfish foretrekker <b>${engineRequest.best}</b> fremfor ${engineRequest.move}.${lossText}`;let ok=loss!=null?loss<=100:false;record('chess',ok,ok?14:3,ok?null:'sjakk: motorfeil');engineRequest=null;return}
 }engineRequest=null
}
async function analysePosition(checkMove=false){
 if(!await waitForChessCore()){engineStatus('Sjakkregler kunne ikke lastes.','error');return}let ok=await initStockfish();if(!ok)return;let fen=$("fenInput").value.trim();try{new window.ChessCore.Chess(fen)}catch(e){$("chessFeedback").innerHTML='<span class="bad">Ugyldig FEN.</span>';return}analysisFen=fen;engineLast={best:null,score:null,cp:null,pv:null};engineBusy=true;let mv=selectedUci();if(checkMove&&mv&&!window.ChessCore.tryMove(fen,mv).ok){$("chessFeedback").innerHTML='<span class="bad">Det valgte trekket er ulovlig.</span>';return}engineRequest=checkMove&&mv?{type:'movecheck',stage:'best',move:mv}:null;engineStatus('Analyserer…','busy');stockfishWorker.postMessage('stop');stockfishWorker.postMessage('position fen '+fen);stockfishWorker.postMessage('go depth '+Math.min(16,9+Math.floor(state.levels.chess/2)))
}
function engineHint(){if(engineLast.best){$("chessFeedback").textContent='Motorhint: vurder et trekk fra '+engineLast.best.slice(0,2)+'.';return}analysePosition(false).then(()=>setTimeout(()=>{if(engineLast.best)$("chessFeedback").textContent='Motorhint: vurder et trekk fra '+engineLast.best.slice(0,2)+'.'},1200))}
async function loadFenForAnalysis(){
 if(!await waitForChessCore())return;let fen=$("fenInput").value.trim();try{let c=new window.ChessCore.Chess(fen);analysisFen=c.fen();boardOrientation=c.turn();clearChess();renderBoard();$("chessTheme").textContent='STOCKFISH';$("chessPuzzleNo").textContent='analyse';$("chessGoal").textContent='Analyser stillingen eller test et lovlig trekk';$("chessHint").textContent=`${c.turn()==='w'?'Hvit':'Svart'} i trekket.`;$("chessFeedback").textContent='FEN lastet.'}catch(e){$("chessFeedback").innerHTML='<span class="bad">Ugyldig FEN.</span>'}
}
window.addEventListener('chessjs-ready',()=>{if(document.getElementById('chess')?.classList.contains('active')&&!livePuzzle)newChess()});

/* REACTION */
function startReaction(){clearTimeout(reaction.timer);let mode=$("reactionMode").value;reaction.phase="waiting";$("reactionBox").className="reaction-box";$("reactionBox").textContent="Vent…";$("reactionFeedback").textContent="";reaction.timer=setTimeout(()=>{reaction.target=mode==="simple"?true:Math.random()>.35;reaction.phase="ready";reaction.start=performance.now();$("reactionBox").className="reaction-box "+(reaction.target?"ready":"nogo");$("reactionBox").textContent=reaction.target?"TRYKK":"IKKE TRYKK";if(!reaction.target)setTimeout(()=>{if(reaction.phase==="ready"){reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="good">Bra kontroll ✓</span>`;record("reaction",true,12);$("reactionBox").className="reaction-box";$("reactionBox").textContent="Start igjen"}},900)},rand(1200,3500))}
function reactionClick(){if(reaction.phase==="waiting"){clearTimeout(reaction.timer);reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="bad">For tidlig.</span>`;record("reaction",false,0,"reaksjon: for tidlig");return}if(reaction.phase==="ready"){if(!reaction.target){reaction.phase="idle";$("reactionFeedback").innerHTML=`<span class="bad">No-Go bom.</span>`;record("reaction",false,0,"reaksjon: inhibisjon");return}let ms=Math.round(performance.now()-reaction.start);reaction.phase="idle";if(state.records.reaction===null||ms<state.records.reaction)state.records.reaction=ms;$("reactionFeedback").innerHTML=`<span class="good">${ms} ms</span>`;record("reaction",ms<650,10,ms<650?null:"reaksjon: treg");save()}}

/* OBSERVATION */
const obsItems=["🔑 nøkkel","📕 rød bok","☕ kopp","🕶️ solbriller","🎧 hodetelefoner","⌚ klokke","✏️ blyant","🪙 mynt","📱 mobil","🧤 hanske","🎲 terning","🍎 eple","🧩 puslespillbit","📎 binders","🧃 juice"];
function startObserve(){let mode=$("observeMode").value,lvl=state.levels.observe,count=Math.min(10,4+Math.floor(lvl/2)),scene=[...obsItems].sort(()=>Math.random()-.5).slice(0,count);observe.scene=scene;$("observeQuestions").innerHTML="";$("observeFeedback").textContent="";$("observeScene").textContent=scene.join("   •   ");
 if(mode==="recall")setTimeout(()=>{$("observeScene").textContent="Skjult.";renderRecallQuestions()},Math.max(1800,5000-lvl*120));
 else setTimeout(()=>{let changed=[...scene],i=rand(0,changed.length-1),replacement=choice(obsItems.filter(x=>!scene.includes(x)));observe.changed={i,old:changed[i],new:replacement};changed[i]=replacement;$("observeScene").textContent=changed.join("   •   ");$("observeQuestions").innerHTML=`<div class="question-block"><label>Hva ble byttet ut? Skriv den gamle tingen.</label><input id="obsChange"></div><button class="primary" onclick="checkObserveChange()">Svar</button>`},Math.max(1800,5000-lvl*120))}
function renderRecallQuestions(){$("observeQuestions").innerHTML=`<div class="question-block"><label>Hvor mange ting var det?</label><input id="oq0"></div><div class="question-block"><label>Skriv to ting du husker, separert med komma.</label><input id="oq1"></div><button class="primary" onclick="checkObserveRecall()">Svar</button>`}
function checkObserveRecall(){let n=$("oq0").value.trim(),items=$("oq1").value.toLowerCase().split(",").map(x=>x.trim()).filter(Boolean),countOk=n===String(observe.scene.length),hits=items.filter(i=>observe.scene.some(x=>x.toLowerCase().includes(i)&&i.length>1)).length,ok=countOk&&hits>=2;$("observeFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Ikke helt.</span> ${observe.scene.join(", ")}`;record("observe",ok,15,ok?null:"observasjon: recall")}
function checkObserveChange(){let v=$("obsChange").value.toLowerCase(),ok=observe.changed.old.toLowerCase().includes(v)&&v.length>1;$("observeFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Det var ${observe.changed.old} som ble erstattet.</span>`;record("observe",ok,15,ok?null:"observasjon: change")}

/* CONTROL */
const controlExercises=[
["2-sekundersregelen","I tre samtaler: vent omtrent 2 sekunder før du svarer på noe som overrasker eller irriterer deg."],
["Nøytralt kamera","Film deg selv i 2 minutter mens du løser hoderegning. Hold ansikt og skuldre avslappet."],
["Ingen fyllord","I én samtale: ikke fyll stillhet med «eh», nervøs latter eller unødvendige ord."],
["Fakta vs tolkning","Legg merke til tre ting noen gjør. Skill mentalt hva du faktisk så fra hva du tror det betyr."],
["Rolig kropp","I fem minutter: sitt eller stå rolig uten unødvendig fikling. Pust normalt."],
["Kontrollert overraskelse","Be noen lese deg fem tilfeldige ord eller spørsmål. Svar rolig uten å skynde deg."],
["Pokerfjes + matte","Film 3 minutter. Løs hoderegning mens du holder et avslappet, naturlig uttrykk."],
["Ubehagelig stillhet","La en naturlig stillhet vare litt lenger enn vanlig uten å fylle den automatisk."]
];
function newControl(){let x=choice(controlExercises);$("controlTitle").textContent=x[0];$("controlText").textContent=x[1];$("controlFeedback").textContent=""}
function completeControl(){$("controlFeedback").innerHTML=`<span class="good">Registrert ✓</span>`;record("control",true,8)}

/* STRATEGY */
const strategies=[
 {q:"Du får en melding: «Kan vi snakke senere?» Hva er beste første konklusjon?",a:"Ikke konkluder ennå",o:["De er sinte","Noe alvorlig har skjedd","Ikke konkluder ennå","De vil avslutte kontakten"],why:"Meldingen er tvetydig. Behovet for mer informasjon er selve poenget."},
 {q:"Du har to oppgaver: A haster i dag men tar 15 min. B er viktigere, men fristen er om tre dager og tar 2 timer. Hva er mest robust plan?",a:"Gjør A først, planlegg blokk til B",o:["Bare B","Bare A","Gjør A først, planlegg blokk til B","Utsett begge"],why:"Du fjerner den akutte risikoen uten å ofre den viktige oppgaven."},
 {q:"En venn virker kort i svarene. Hvilket neste steg gir mest informasjon med minst risiko?",a:"Spør normalt om alt er greit",o:["Konfronter dem","Ignorer dem i en uke","Spør normalt om alt er greit","Anta at de er sure på deg"],why:"Direkte, lavdramatisk avklaring slår tankelesing."},
 {q:"Du vurderer to valg. Det ene har stor gevinst men kan koste deg alt. Det andre har moderat gevinst og liten nedside. Hva bør du vurdere først?",a:"Hvor stor nedside du faktisk tåler",o:["Hvilket som virker kulest","Hvor stor nedside du faktisk tåler","Hva andre ville valgt","Bare maksimal gevinst"],why:"Strategi handler også om overlevelse og reversibilitet, ikke bare oppside."},
 {q:"Tre personer gir ulike forklaringer på samme hendelse. Hva bør du gjøre først?",a:"Finn hvilke fakta de faktisk er enige om",o:["Velg den mest selvsikre","Finn hvilke fakta de faktisk er enige om","Anta at to samarbeider","Tro den du liker best"],why:"Felles fakta gir et bedre startpunkt enn personlighet eller selvsikkerhet."},
 {q:"Du har 60 % sjanse for gevinst på 100 og 40 % sjanse for tap på 100. Forventet verdi?",a:"+20",o:["+20","0","-20","+60"],why:"0,6×100 + 0,4×(-100) = +20."}
];
function newStrategy(){currentStrategy=choice(strategies);$("strategyQuestion").textContent=currentStrategy.q;$("strategyReason").value="";$("strategyFeedback").textContent="";$("strategyOptions").innerHTML=currentStrategy.o.map(o=>`<button onclick='answerStrategy(${JSON.stringify(o)})'>${o}</button>`).join("")}
function answerStrategy(v){if(state.settings.explain&&!$("strategyReason").value.trim()){ $("strategyFeedback").textContent="Begrunn valget kort først.";return}let ok=v===currentStrategy.a;$("strategyFeedback").innerHTML=(ok?`<span class="good">Godt valg ✓</span>`:`<span class="bad">Ikke beste valg.</span>`)+` ${currentStrategy.why}`;record("strategy",ok,14,ok?null:"scenario: beslutning")}

/* DAILY + EXAM */
function weightedWeakSkills(){let arr=[];skills.forEach(k=>{let s=state.skill[k],acc=s.t?s.c/s.t:.7,weight=1+(1-acc)*4+(5-Math.min(5,state.levels[k]))*.2;for(let i=0;i<Math.ceil(weight);i++)arr.push(k)});return arr}
function startDailyLegacy(){state.sessions++;touchStreak();let pool=weightedWeakSkills(),today=[];while(today.length<6)today.push(choice(pool));state.daily=today;save()}
function makeExamQ(){
 let type=choice(["math","logic","strategy"]);if(type==="math"){let a=rand(10,99),b=rand(10,99),op=choice(["+","×"]);return{type,q:`${a} ${op} ${b}`,ans:String(op==="+"?a+b:a*b),opts:null}}
 if(type==="logic"){let q=makeLogic();return{type,q:q.q,ans:q.ans,opts:q.opts}}
 let s=choice(strategies);return{type,q:s.q,ans:s.a,opts:s.o}
}
function startExam(){exam={idx:0,score:0,q:null,total:12};openView("exam");nextExam()}
function nextExam(){if(exam.idx>=exam.total){let pct=Math.round(exam.score/exam.total*100);state.records.exam=Math.max(state.records.exam,pct);state.history.push({date:dayKey(),score:pct,type:"exam"});state.history=state.history.slice(-30);save();$("examQuestion").innerHTML=`<h2>Ferdig: ${pct}%</h2>`;$("examOptions").innerHTML="";$("examAnswer").style.display="none";$("examMeta").textContent="Eksamen fullført";return}exam.q=makeExamQ();$("examMeta").textContent=`Oppgave ${exam.idx+1}/${exam.total}`;$("examQuestion").textContent=exam.q.q;$("examFeedback").textContent="";$("examAnswer").value="";$("examAnswer").style.display=exam.q.opts?"none":"block";$("examOptions").innerHTML=exam.q.opts?exam.q.opts.map(o=>`<button onclick='selectExam(${JSON.stringify(o)})'>${o}</button>`).join(""):"";exam.selected=null}
function selectExam(v){exam.selected=v;document.querySelectorAll("#examOptions button").forEach(b=>b.style.outline="");[...document.querySelectorAll("#examOptions button")].find(b=>b.textContent===v).style.outline="2px solid #8fb3ff"}
function submitExam(){let v=exam.q.opts?exam.selected:$("examAnswer").value.trim();if(v==null||v==="")return;let ok=String(v)===String(exam.q.ans);if(ok)exam.score++;$("examFeedback").innerHTML=ok?`<span class="good">Riktig ✓</span>`:`<span class="bad">Feil. Riktig: ${exam.q.ans}</span>`;exam.idx++;setTimeout(nextExam,700)}

/* PROGRESS, HISTORY, RECORDS */
function renderProgress(){
 const names={math:"Hoderegning",memory:"Hukommelse",logic:"Logikk",chess:"Sjakk",observe:"Observasjon",reaction:"Reaksjon",control:"Selvkontroll",strategy:"Scenarioanalyse"};
 $("progressCards").innerHTML=skills.map(k=>{let s=state.skill[k],acc=s.t?Math.round(s.c/s.t*100):0;return `<div class="card"><div class="progress-line"><b>${names[k]}</b><span>Nivå ${state.levels[k]}</span></div><p>${s.t?acc+" % på nåværende nivå":"Ingen ferske forsøk"}</p><div class="bar"><div style="width:${Math.min(100,state.levels[k]/30*100)}%"></div></div></div>`}).join("");
 let errs=Object.entries(state.errors).sort((a,b)=>b[1]-a[1]).slice(0,8);$("errorSummary").innerHTML=errs.length?errs.map(([k,v])=>`<p><b>${k}</b>: ${v}</p>`).join(""):"<p>Ingen registrerte feiltyper ennå.</p>";drawHistory()
}
function drawHistory(){let c=$("historyChart"),ctx=c.getContext("2d"),w=c.width,h=c.height;ctx.clearRect(0,0,w,h);ctx.strokeStyle="#26334d";ctx.lineWidth=1;for(let y=40;y<h;y+=50){ctx.beginPath();ctx.moveTo(35,y);ctx.lineTo(w-15,y);ctx.stroke()}let data=state.history.slice(-14);if(!data.length){ctx.fillStyle="#9aa7bd";ctx.font="20px sans-serif";ctx.fillText("Ingen eksamenshistorikk ennå.",40,80);return}ctx.strokeStyle="#8fb3ff";ctx.lineWidth=4;ctx.beginPath();data.forEach((d,i)=>{let x=40+i*((w-70)/Math.max(1,data.length-1)),y=h-30-(d.score/100)*(h-60);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
function renderRecords(){
 let r=state.records;$("recordCards").innerHTML=`<div class="card"><b>Beste reaksjon</b><h2>${r.reaction??"–"}${r.reaction?" ms":""}</h2></div><div class="card"><b>Lengste sekvens</b><h2>${r.memory||"–"}</h2></div><div class="card"><b>60 sek matte</b><h2>${r.math60||"–"}</h2></div><div class="card"><b>Beste eksamen</b><h2>${r.exam||"–"}${r.exam?"%":""}</h2></div>`;
 let ach=[["Første steg",state.total>=1,"Fullfør én oppgave"],["100 forsøk",state.total>=100,"Gjør 100 forsøk"],["Streak 7",state.streak>=7,"Tren 7 dager på rad"],["Matte 10",state.levels.math>=10,"Nå nivå 10 i matte"],["Minne 8",state.records.memory>=8,"Husk 8 symboler"],["Under 300",r.reaction&&r.reaction<300,"Reaksjon under 300 ms"],["Eksamen 90",r.exam>=90,"Få minst 90 %"],["Allrounder",skills.every(k=>state.levels[k]>=3),"Nivå 3 i alt"]];
 $("achievements").innerHTML=ach.map(a=>`<div class="card achievement ${a[1]?"unlocked":""}"><h3>${a[1]?"🏆":"🔒"} ${a[0]}</h3><p>${a[2]}</p></div>`).join("")
}
function exportProgress(){let blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="strategisk-trening-progresjon.json";a.click()}
function resetProgress(){if(confirm("Nullstille all progresjon?")){state=fresh();save();renderProgress()}}

loadSettings();renderStats();newLogic();newControl();newStrategy();
if("serviceWorker" in navigator&&location.protocol!=="file:"){window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}))}

/* v3 guided daily session + backup restore */
const dailyNames={math:"Hoderegning",memory:"Hukommelse",logic:"Logikk",chess:"Sjakk",observe:"Observasjon",reaction:"Reaksjon",control:"Selvkontroll",strategy:"Scenarioanalyse"};
const dailyDescriptions={
 math:"Løs én oppgave. Fokuser på metode før fart.",memory:"Fullfør én hukommelsesoppgave.",logic:"Løs én logikkoppgave og begrunn gjerne svaret.",chess:"Løs én stilling. Se etter motstanderens trussel først.",observe:"Fullfør én observasjonsrunde.",reaction:"Gjør én reaksjonsrunde uten forhastet trykk.",control:"Fullfør én selvkontrolløvelse.",strategy:"Løs ett scenario og skill fakta fra antakelser."
};
function ensureDaily(){if(!state.dailySession)state.dailySession={active:false,queue:[],index:0,startXp:state.xp,completed:[]}}
function buildDailyQueue(){
 let ranked=skills.map(k=>{let s=state.skill[k],acc=s.t?s.c/s.t:.65;return{k,need:(1-acc)*3+(6-Math.min(6,state.levels[k]))*.15+Math.random()*.2}}).sort((a,b)=>b.need-a.need);
 let first=ranked.slice(0,3).map(x=>x.k),rest=skills.filter(k=>!first.includes(k)).sort(()=>Math.random()-.5);
 return [...first,...rest].slice(0,6);
}
function startDaily(){ensureDaily();state.sessions++;touchStreak();state.dailySession={active:true,queue:buildDailyQueue(),index:0,startXp:state.xp,completed:[]};save();openView("daily");renderDailySession()}
function renderDailySession(){ensureDaily();let d=state.dailySession,total=d.queue.length||6,i=Math.min(d.index,total),pct=total?Math.round(i/total*100):0;
 $("dailyProgressText").textContent=`${i} / ${total}`;$("dailyProgressBar").style.width=pct+"%";$("dailyXpText").textContent=`+${Math.max(0,state.xp-d.startXp)} XP`;$("dailyDone").textContent="";
 if(!d.active||i>=total){$("dailySkillLabel").textContent="FULLFØRT";$("dailyTaskTitle").textContent="Dagens økt er ferdig ✓";$("dailyTaskText").textContent="Bra. Du har trent flere ferdigheter uten å overlesse økten.";$("dailyOpenBtn").textContent="Til forsiden";$("dailyOpenBtn").onclick=()=>openView("home");}
 else{let k=d.queue[i];$("dailySkillLabel").textContent=dailyNames[k].toUpperCase();$("dailyTaskTitle").textContent=dailyNames[k];$("dailyTaskText").textContent=dailyDescriptions[k];$("dailyOpenBtn").textContent="Åpne øvelsen";$("dailyOpenBtn").onclick=openDailyModule}
 $("dailyPlan").innerHTML=d.queue.map((k,n)=>`<div class="daily-step ${n<i?'done':''} ${n===i&&d.active?'current':''}"><span>${n<i?'✓':n===i&&d.active?'→':'•'} ${dailyNames[k]}</span><span class="tag">${n<i?'ferdig':n===i&&d.active?'nå':'senere'}</span></div>`).join("");
}
function openDailyModule(){ensureDaily();let d=state.dailySession;if(!d.active||d.index>=d.queue.length){openView("home");return}openView(d.queue[d.index])}
function skipDailyStep(){ensureDaily();let d=state.dailySession;if(!d.active||d.queue.length<2)return;let i=d.index,j=Math.min(d.queue.length-1,i+1);[d.queue[i],d.queue[j]]=[d.queue[j],d.queue[i]];save();renderDailySession()}
function checkDailyCompletion(skill){ensureDaily();let d=state.dailySession;if(!d.active||d.queue[d.index]!==skill)return;d.completed.push(skill);d.index++;if(d.index>=d.queue.length){d.active=false;state.xp+=25;state.history.push({date:dayKey(),score:100,type:"daily"});state.history=state.history.slice(-30)}save()}
const _recordV2=record;
record=function(skill,ok,xp=10,err=null){_recordV2(skill,ok,xp,err);checkDailyCompletion(skill)};
const _openViewV2=openView;
openView=function(id){_openViewV2(id);if(id==="daily")renderDailySession()};
function quickPractice(){let ranked=skills.map(k=>{let s=state.skill[k],acc=s.t?s.c/s.t:.65;return{k,acc,lvl:state.levels[k]}}).sort((a,b)=>a.acc-b.acc||a.lvl-b.lvl);let k=ranked[0].k;alert(`Jeg ville trent ${dailyNames[k]} nå. Det er området appen vurderer som mest nyttig å prioritere ut fra fersk treffsikkerhet og nivå.`);openView(k)}
function importProgressFile(event){let f=event.target.files&&event.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let incoming=JSON.parse(r.result);if(!incoming||typeof incoming!=="object"||!incoming.levels||!incoming.skill)throw new Error("Ugyldig backup");state=incoming;skills.forEach(k=>{state.skill[k]||={c:0,t:0,score:0};state.levels[k]||=1});state.errors||={};state.history||=[];state.settings||=fresh().settings;state.records||=fresh().records;save();loadSettings();alert("Backup importert ✓");openView("progress")}catch(e){alert("Kunne ikke importere backup. Sjekk at du valgte en eksportert progresjonsfil.")}};r.readAsText(f);event.target.value=""}
