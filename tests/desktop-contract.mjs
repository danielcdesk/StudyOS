import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const config=JSON.parse(read('src-tauri/tauri.conf.json'));
const cargo=read('src-tauri/Cargo.toml');
const backend=read('src-tauri/src/main.rs');
const adapter=read('public/local-database.js');
const upgrades=read('public/desktop-upgrades.js');

assert.equal(config.identifier,'br.com.studyos.app','identificador do aplicativo Windows ausente');
assert.equal(config.build.frontendDist,'../public','o pacote desktop deve usar a interface local existente');
assert.match(cargo,/rusqlite/,'SQLite não foi declarado no aplicativo desktop');
assert.match(backend,/schema_migrations/,'schema versionado ausente');
assert.match(backend,/study_state/,'fonte de verdade SQLite ausente');
assert.match(backend,/MAX_STATE_BYTES/,'limite de importação ausente');
assert.match(backend,/backup_file/,'backup local antes de gravações ausente');
assert.match(adapter,/__TAURI__/,'adaptador desktop não detecta o host nativo');
assert.match(adapter,/read_state/,'interface não lê o estado SQLite');
assert.match(adapter,/write_state/,'interface não grava o estado SQLite');
assert.match(upgrades,/Prévia da migração pronta/,'prévia da importação legada ausente');
assert.match(upgrades,/confirmLegacyImport/,'confirmação da importação legada ausente');
assert.match(upgrades,/globalSearch/,'busca global navegável ausente');
console.log('Contrato do aplicativo desktop, SQLite e migração verificado.');
