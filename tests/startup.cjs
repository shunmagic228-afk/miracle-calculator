const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {Calculator,normalizeFreeTarget}=require('../engine.js');
const source=fs.readFileSync(require.resolve('../app.js'),'utf8').split('\nfunction fitDisplay')[0];
const saved=new Map();
function launch(blocked=false){
 const elements=new Map();
 const context={Calculator,calculatorHelpers:{normalizeFreeTarget},window:{addEventListener(){}},setInterval(){},localStorage:{getItem(k){if(blocked)throw Error('blocked');return saved.get(k)??null;},setItem(k,v){if(blocked)throw Error('blocked');saved.set(k,String(v));}},document:{addEventListener(){},getElementById(id){if(!elements.has(id))elements.set(id,{style:{setProperty(){}},setAttribute(){},addEventListener(){}});return elements.get(id);}}};
 vm.createContext(context);vm.runInContext(source,context);
 return {run:code=>vm.runInContext(code,context),slider:elements.get('delay')};
}
let app=launch();assert.equal(app.run('calc.magic'),true);assert.equal(app.run('calc.delay'),30);
app.slider.value='120';app.run('updateDelay();calc.key("%");');assert.equal(app.run('calc.magic'),false);
app=launch();assert.equal(app.run('calc.magic'),true);assert.equal(app.run('calc.delay'),120);
app.run('calc.key("4");calc.key("=");');assert.equal(app.run('calc.phase'),'forcing');app.run('calc.reset()');assert.equal(app.run('calc.magic'),true);
for(const value of ['invalid','0','301','15']){saved.set('delay',value);app=launch();assert.equal(app.run('calc.delay'),30);assert.equal(app.run('calc.magic'),true);}
app=launch(true);assert.equal(app.run('calc.magic'),true);assert.equal(app.run('calc.delay'),30);
console.log('Passed: always ON after restart, saved delay, forcing, reset, invalid settings and unavailable storage');
