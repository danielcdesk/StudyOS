import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
for(const file of fs.readdirSync(path.join(root,'public')).filter(file=>file.endsWith('.js'))){
  assert.doesNotThrow(()=>new vm.Script(read(`public/${file}`),{filename:file}),`${file} contém JavaScript inválido`);
}
assert.doesNotThrow(()=>JSON.parse(read('public/manifest.webmanifest')),'manifesto do aplicativo inválido');
const index=read('public/index.html');
assert.match(index,/local-database\.js/,'banco de dados local não foi carregado');
assert.match(index,/register-sw\.js/,'modo offline não foi registrado');
const database=read('public/local-database.js');
assert.match(database,/indexedDB\.open/,'IndexedDB não foi implementado');
assert.match(database,/RECOVERY_KEY/,'cópia local de recuperação ausente');
assert.doesNotMatch(database,/https?:\/\//,'banco local não pode transmitir dados');
assert.doesNotMatch(read('public/styles.css'),/https?:\/\//,'fontes da interface devem estar disponíveis localmente');
const desktopConfig=JSON.parse(read('src-tauri/tauri.conf.json'));
const desktopBackend=read('src-tauri/src/main.rs');
assert.match(desktopConfig.app.security.csp,/connect-src 'self'/,'CSP desktop deve bloquear conexões externas');
assert.match(desktopBackend,/MAX_STATE_BYTES/,'limite de payload SQLite ausente');
assert.match(desktopBackend,/validate_state/,'validação antes de persistir ausente');
assert.doesNotMatch(read('package.json'),/cloudflare|sites-vite|wrangler/i,'dependências hospedadas não podem permanecer no aplicativo offline');
const tracked=read('.gitignore');
assert.match(tracked,/data\/\*\.json/,'dados pessoais locais não estão ignorados pelo Git');
console.log('Auditoria de segurança, armazenamento local, PWA e sintaxe concluída.');
