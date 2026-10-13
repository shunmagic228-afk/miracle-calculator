const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {Calculator,normalizeFreeTarget}=require('../engine.js');
function finish(c){c.key('AC');while(c.index<=c.forced.digits.length)c.key('=');c.key('=');}
for(const [answer,target] of [['123','547581'],['999999','547581'],['-45','547581'],['3.25','547581'],['547581','547581'],['0','0'],['123','99999999999999']]){
 const c=new Calculator();c.magic=true;c.targetMode='free';c.freeTarget=target;
 if(answer.startsWith('-')){for(const k of answer.slice(1))c.key(k);c.key('±');}else for(const k of answer)c.key(k);
 c.key('=');assert.equal(c.phase,'forcing');assert.equal(c.target,target);assert.equal(c.targetAt,null);
 const f=c.forced;assert(Math.abs(Number(answer)+(f.op==='+'?1:-1)*Number(f.digits)-Number(target))<1e-6);
 c.freeTarget='1';c.targetMode='datetime';finish(c);assert.equal(c.entry,target);assert.equal(c.phase,'done');
 c.reset();assert.equal(c.targetMode,'datetime');
}
assert.equal(normalizeFreeTarget('000123'),'123');assert.equal(normalizeFreeTarget('000'),'0');
for(const s of ['','abc','-1','1.5','1e5','999999999999999'])assert.throws(()=>normalizeFreeTarget(s));
const saved=new Map(),source=fs.readFileSync(require.resolve('../app.js'),'utf8');
function launch(blocked=false){const els=new Map(),callbacks=new Map();
 const context={Calculator,calculatorHelpers:{normalizeFreeTarget},calculatorDisplay:require('../engine.js').displayState,navigator:{},setInterval(){},window:{addEventListener(){}},localStorage:{getItem(k){if(blocked)throw Error();return saved.get(k)??null;},setItem(k,v){if(blocked)throw Error();saved.set(k,String(v));}},document:{querySelectorAll(){return[];},addEventListener(){},getElementById(id){if(!els.has(id))els.set(id,{clientWidth:390,scrollWidth:100,style:{setProperty(){}},classList:{toggle(){}},parentElement:{clientWidth:390},setAttribute(){},focus(){this.focused=true;},showModal(){this.open=true;},close(){this.open=false;},addEventListener(type,cb){callbacks.set(id+type,cb);}});return els.get(id);}}};
 vm.createContext(context);vm.runInContext(source,context);return{run:s=>vm.runInContext(s,context),els,event:(id,type,value)=>{els.get(id).value=value;callbacks.get(id+type)();}};
}
let app=launch();assert.equal(app.run('calc.targetMode'),'datetime');
app.event('targetmode','change','free');app.event('freetarget','input','547581');app.run('togglePeek()');assert.equal(app.els.get('targettime').textContent,'547,581');assert.equal(app.els.get('currenttime').hidden,true);
app.event('freetarget','input','');app.run('press("=")');assert.equal(app.run('calc.phase'),'normal');assert.equal(app.els.get('panel').open,true);assert.equal(app.els.get('freeerror').hidden,false);
app.event('freetarget','input','001234');app.els.get('close').onclick();assert.equal(app.els.get('panel').open,false);
app.run('press("9");press("=")');assert.equal(app.run('calc.target'),'1234');assert.equal(app.els.get('targetmode').disabled,true);assert.equal(app.els.get('freetarget').disabled,true);
app.run('calc.freeTarget="5";renderPeek()');assert.equal(app.els.get('targettime').textContent,'1,234');
app.els.get('reset').onclick();assert.equal(app.els.get('targetmode').disabled,false);
app=launch();assert.equal(app.run('calc.magic'),true);assert.equal(app.run('calc.targetMode'),'free');assert.equal(app.run('calc.freeTarget'),'1234');
app.event('targetmode','change','datetime');assert.equal(app.els.get('freeconfig').hidden,true);assert.equal(app.els.get('currenttime').hidden,false);
app=launch(true);assert.equal(app.run('calc.targetMode'),'datetime');app.event('targetmode','change','free');app.event('freetarget','input','547581');app.run('press("2");press("=")');assert.equal(app.run('calc.target'),'547581');
console.log('Passed: free targets, subtraction, fractions, zero, 14 digits, frozen result, validation, mode switch, saved settings and blocked storage');
