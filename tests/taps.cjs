const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {Calculator}=require('../engine.js');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8');
const tree={calculator:null,toolbar:'calculator',history:'toolbar',settings:'toolbar',screen:'calculator',currenttime:'screen',targettime:'screen',display:'screen',expression:'screen',keys:'calculator',gap:'keys',seven:'keys',equals:'keys',bottom:'calculator'};
const handlers=new Map(),calc=new Calculator();calc.magic=true;calc.key('4');calc.key('=');let toggles=0;
const context={calc,$:id=>({addEventListener(type,fn,capture){assert.equal(capture,true);handlers.set(id,fn);}}),press:k=>calc.key(k)};
vm.createContext(context);vm.runInContext(source.slice(source.lastIndexOf("$('keys').addEventListener")),context);
assert.deepEqual([...handlers.keys()],['keys']);
function tap(id,key){const event={target:{closest:selector=>selector==='[data-key]'&&key?{dataset:{key}}:null},preventDefault(){},stopImmediatePropagation(){this.stopped=true;}};for(let p=id;p;p=tree[p]){handlers.get(p)?.(event);if(event.stopped)return;}if(id==='history')toggles++;}
for(const phase of ['forcing','done']){calc.phase=phase;for(const id of ['toolbar','history','settings','screen','currenttime','targettime','expression','display','bottom']){const before={index:calc.index,entry:calc.entry,target:calc.target,phase:calc.phase};tap(id);assert.deepEqual({index:calc.index,entry:calc.entry,target:calc.target,phase:calc.phase},before,id);}}
assert.equal(toggles,2);
calc.phase='forcing';let index=calc.index;tap('gap');assert.equal(calc.index,index+1);
index=calc.index;tap('seven','7');assert.equal(calc.index,index+1);
while(calc.index<=calc.forced.digits.length)tap('seven','7');tap('equals','=');assert.equal(calc.phase,'done');
console.log('Passed: entire area above keys excluded, clock remains clickable, keypad gaps and keys advance once, final equals completes');
