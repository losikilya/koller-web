import {readFileSync,writeFileSync,mkdirSync,copyFileSync,readdirSync,statSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const change='openspec/changes/phase-three-c-profiles-privacy', home=`${change}/evidence/phase3c4`;
const norm=p=>p.replaceAll('\\','/');
const hash=b=>createHash('sha256').update(b).digest('hex');
const describe=p=>{p=norm(p);const b=readFileSync(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const json=p=>JSON.parse(readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const save=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
const inventory=()=>execFileSync('git',['ls-files','-z'],{maxBuffer:30*1024*1024}).toString().split('\0').filter(Boolean);
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(head!=='524ef172acc8d327ba5591adfa76a8abefa80cba')throw Error('Unexpected HEAD');
const mutable=['.openspec.yaml','proposal.md','design.md','bdd.md','test-plan.json','tasks.md','review.md','specs/user-profile/spec.md','evidence/ledger.json'];
if(process.argv[2]==='initialize'){
 const old=json(`${change}/evidence/phase3c3/acceptance-manifest.json`);
 const entries=[...old.currentSourceFiles,...old.evidenceFiles,...old.planningFiles,old.report,old.review,old.tasks,old.finalLog,old.finalExit];
 for(const e of entries)if(describe(e.path).sha256!==e.sha256)throw Error(`3C3 acceptance drift: ${e.path}`);
 const files=inventory().filter(p=>p.startsWith('docs/web-platform/phase-3c/')||/^docs\/adr\/000[456]-/.test(p)||p.startsWith(change+'/')).map(describe);
 const snapshots=mutable.map(p=>{const from=`${change}/${p}`,to=`${home}/history-3c3/${p}`;mkdirSync(to.slice(0,to.lastIndexOf('/')),{recursive:true});copyFileSync(from,to);return {...describe(from),snapshot:to};});
 const proofs=readdirSync('.git/codex-proofs').filter(n=>n.startsWith('phase3c3-')||n==='current-task.md').map(n=>describe(`.git/codex-proofs/${n}`));
 save(`${home}/history-manifest.json`,{version:1,head,accepted3C3Entries:entries.length,files,snapshots,commitProofs:proofs});
 console.log(JSON.stringify({head,accepted3C3Entries:entries.length,mismatches:0,historicalFiles:files.length,snapshots:snapshots.length,commitProofs:proofs.length}));
}else{
 const history=json(`${home}/history-manifest.json`), snapshots=new Map(history.snapshots.map(e=>[e.path,e.snapshot]));
 for(const e of history.files){const actual=describe(snapshots.get(e.path)??e.path);if(actual.sha256!==e.sha256||actual.bytes!==e.bytes)throw Error(`History drift: ${e.path}`);}
 for(const e of history.commitProofs)if(describe(e.path).sha256!==e.sha256)throw Error(`Commit proof drift: ${e.path}`);
 const ledger=json(`${change}/evidence/ledger.json`),previous=json(`${home}/history-3c3/evidence/ledger.json`);
 if(JSON.stringify(ledger)!==JSON.stringify(previous))throw Error('Existing ledger changed during acceptance');
 for(const e of ledger.events)if(describe(`${change}/${e.report}`).sha256!==e.reportHash)throw Error(`Report hash changed: ${e.sequence}`);
 const extra=execFileSync('git',['ls-files','--others','--exclude-standard','-z'],{maxBuffer:30*1024*1024}).toString().split('\0').filter(Boolean);
 const previousSource=json(`${change}/evidence/phase3c3/current-source-pin.json`).currentSourceFiles.map(e=>norm(e.path));
 const sourcePaths=[...new Set([...previousSource,...[...inventory(),...extra].filter(p=>/^(apps|packages|tests|scripts|supabase|\.storybook|\.github)\//.test(p)||/^[^/]+\.(json|ya?ml|[cm]?js|ts)$/.test(p))])].sort();
 const currentSourceFiles=sourcePaths.map(describe);
 if(process.argv[2]==='pin')save(`${home}/current-source-pin.json`,{head,currentSourceFiles});
 if(process.argv[2]==='final'){
  if(JSON.stringify(json(`${home}/current-source-pin.json`).currentSourceFiles)!==JSON.stringify(currentSourceFiles))throw Error('Source drift after final verification pin');
  const finalLog=process.argv[3],exit=process.argv[4];
  if(!readFileSync(exit,'utf8').includes('VerifyExitCode=0'))throw Error('Final verify not successful');
  const walk=p=>readdirSync(p).flatMap(n=>statSync(`${p}/${n}`).isDirectory()?walk(`${p}/${n}`):[`${p}/${n}`]);
  save(`${home}/acceptance-manifest.json`,{version:1,head,scope:'Phase 3C.4 integrated local acceptance only; active/unarchived; no production or next-phase acceptance',capturedAt:new Date().toISOString(),provenance:'Main-session raw byte hashes and actual outputs; no signatures or remote certification. Existing 51 TDD events unchanged; acceptance is standalone GREEN.',currentSourceFiles,history:describe(`${home}/history-manifest.json`),finalCommand:'PLAYWRIGHT_BROWSER_CHANNEL=msedge pnpm verify',finalExitCode:0,finalLog:describe(finalLog),finalExit:describe(exit),planning:mutable.map(p=>describe(`${change}/${p}`)),report:describe('docs/web-platform/phase-3c/PHASE-3C4-ACCEPTANCE-REPORT.md'),handoff:describe('docs/web-platform/phase-3c/PHASE-3C-INTEGRATION-HANDOFF.md'),evidenceFiles:walk(home).filter(p=>!p.endsWith('/acceptance-manifest.json')).map(describe)});
 }
 console.log(JSON.stringify({historicalFiles:history.files.length,snapshots:history.snapshots.length,commitProofs:history.commitProofs.length,originalReports:ledger.events.length,currentSourceFiles:currentSourceFiles.length,mismatches:0}));
}
