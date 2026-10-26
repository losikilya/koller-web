import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs'
import {resolve,relative,dirname} from 'node:path'
import {pathToFileURL} from 'node:url'
import ts from 'typescript'

const normalize=path=>path.replaceAll('\\','/')
export function contractImportAllowed(spec) { return spec.startsWith('.') || spec === 'zod' }
export function boundaryViolation(from,to){
 const packageOwner=path=>path.match(/^packages\/([^/]+)/)?.[1]
 const moduleOwner=path=>path.match(/^apps\/web\/src\/modules\/([^/]+)/)?.[1]
 const owner=packageOwner(from), target=packageOwner(to)
 if(owner && to.startsWith('apps/'))return 'Packages cannot import applications'
 if(owner==='contracts' && !to.startsWith('packages/contracts/'))return 'Contracts must be framework independent'
 if(owner && target && owner!==target && !(owner==='ui' && target==='design-tokens'))return 'Forbidden package dependency'
 if(to.startsWith('apps/web/src/app/') && !from.startsWith('apps/web/src/app/'))return 'Framework routes cannot be imported by lower layers'
 if(from.startsWith('apps/web/src/shared/') && /^apps\/web\/src\/(shell|modules)\//.test(to))return 'Shared cannot import upper layers'
 if(moduleOwner(from) && to.startsWith('apps/web/src/shell/'))return 'Modules cannot import shell'
 if(moduleOwner(to) && moduleOwner(from)!==moduleOwner(to) && !/^apps\/web\/src\/modules\/[^/]+\/index\.ts$/.test(to))return 'Module consumers must use its public entry point'
 if(owner && target && owner!==target && !/\/src\/(?:index\.tsx?|tokens\.css)$/.test(to))return 'Package consumers must use explicit exports'
 return null
}
export function importSpecifiers(source,path){
 const result=[]
 const ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true)
 function visit(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier))result.push(node.moduleSpecifier.text)
  if(ts.isCallExpression(node) && (node.expression.kind===ts.SyntaxKind.ImportKeyword || node.expression.getText(ast)==='require')) {
   const arg=node.arguments[0]
   if(arg && (ts.isStringLiteral(arg)||ts.isNoSubstitutionTemplateLiteral(arg)))result.push(arg.text)
   else result.push('<dynamic>')
  }
  ts.forEachChild(node,visit)
 }
 visit(ast)
 if(/\.s?css$/.test(path))for(const match of source.matchAll(/@(?:use|import)\s+['"]([^'"]+)['"]/g))result.push(match[1])
 return result
}
export function validateGraph(graph){
 const visiting=new Set(),visited=new Set(),errors=[]
 function visit(node){if(visiting.has(node)){errors.push('Circular import: '+node);return}if(visited.has(node))return;visiting.add(node);for(const target of graph.get(node)??[])visit(target);visiting.delete(node);visited.add(node)}
 for(const node of graph.keys())visit(node)
 return errors
}
export function checkBoundaries(root=process.cwd()){
 const walk=dir=>existsSync(dir)?readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(resolve(dir,entry.name)):[resolve(dir,entry.name)]):[]
 const sources=['apps/web/src','packages/ui/src','packages/design-tokens/src','packages/contracts/src'].flatMap(dir=>walk(resolve(root,dir))).filter(p=>/\.(?:[jt]sx?|s?css)$/.test(p))
 const names={'@dance/ui':'packages/ui/src/index.tsx','@dance/contracts':'packages/contracts/src/index.ts','@dance/design-tokens/tokens.css':'packages/design-tokens/src/tokens.css'}
 const graph=new Map(),errors=[]
 for(const file of sources){const from=normalize(relative(root,file));const targets=[]
  for(const spec of importSpecifiers(readFileSync(file,'utf8'),file)){
   if(spec==='<dynamic>'){errors.push(from+': nonliteral import requires explicit review');continue}
   if(from.startsWith('packages/contracts/') && !contractImportAllowed(spec))errors.push(from+': contracts cannot import '+spec)
   let candidate=names[spec] || (spec.startsWith('@/')?'apps/web/src/'+spec.slice(2):spec.startsWith('.')?normalize(relative(root,resolve(dirname(file),spec))):null)
   if(!candidate){if(spec.startsWith('@dance/'))errors.push(from+': undeclared workspace export '+spec);continue}
   const to=[candidate,candidate+'.ts',candidate+'.tsx',candidate+'/index.ts',candidate+'/index.tsx'].find(p=>existsSync(resolve(root,p)) && statSync(resolve(root,p)).isFile())
   if(!to){errors.push(from+': unresolved local import '+spec);continue}
   const violation=boundaryViolation(from,to);if(violation)errors.push(from+' → '+to+': '+violation)
   targets.push(to)
  }graph.set(from,targets)
 }
 return [...errors,...validateGraph(graph)]
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){const errors=checkBoundaries();if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log('Import boundaries and cycles: PASS')}
