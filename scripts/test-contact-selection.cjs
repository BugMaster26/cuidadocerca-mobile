const assert=require('node:assert/strict');
const { chooseSosContact, contactChoices }=require('../src/services/contactSelection.ts');
async function main(){
 const choices=contactChoices({fullName:'  Ana  ',phones:[{number:'+51 999-111-222',label:'mobile'},{number:'+51999111222'},{number:'(01) 234.5678'},{number:'123'}]});
 assert.equal(choices.name,'Ana'); assert.deepEqual(choices.phones.map(p=>p.number),['+51999111222','012345678']);
 let asked=0,picked=0;
 const denied={requiresPermission:true,permission:async()=>({granted:false,canAskAgain:false}),requestPermission:async()=>{asked++;return {granted:false,canAskAgain:false}},pick:async()=>{picked++;return null}};
 assert.equal((await chooseSosContact(denied)).status,'denied');assert.equal(asked,0);assert.equal(picked,0);
 const cancelled={...denied,permission:async()=>({granted:true,canAskAgain:true})};
 assert.equal((await chooseSosContact(cancelled)).status,'cancelled');
 const selected={...cancelled,pick:async()=>({fullName:'Ana',phones:[{number:'999111222'},{number:'988111222'}]})};
 const result=await chooseSosContact(selected);assert.equal(result.status,'selected');assert.equal(result.contact.phones.length,2);
 assert.equal((await chooseSosContact({...selected,pick:async()=>({fullName:'Ana',phones:[]})})).status,'no-phone');
 console.log('Permisos denegados, cancelación y selección de varios teléfonos verificados.');
}
main().catch(e=>{console.error(e);process.exitCode=1});
