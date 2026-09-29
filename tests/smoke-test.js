import fs from 'fs';
const js=fs.readFileSync(new URL('../assets/app.js',import.meta.url),'utf8');
const required=['Context','Consult','Critique','Check','Challenge','Conclude'];
for(const x of required) if(!js.includes(`['${x}'`)) throw new Error(`Missing stage: ${x}`);
if(js.includes("['Reflect','Explain what you learned")) throw new Error('Reflect remains as a 6C stage');
for(const bad of ['YOUR-DOMAIN-HERE','Soleyeva Sayyora','sayyorasoleyeva07072000-ship-it']) if(js.includes(bad)) throw new Error(`Forbidden legacy reference: ${bad}`);
console.log('PASS: static 6C/legacy-reference smoke checks');
