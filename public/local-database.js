(function(){
  'use strict';
  const DB_NAME='studyos-local',STORE_NAME='documents',DATA_KEY='main';
  const LEGACY_KEY='studyos-browser-data-v1',RECOVERY_KEY='studyos-recovery-v1';
  const desktop=()=>Boolean(window.__TAURI__?.core?.invoke);
  const invoke=(command,args)=>window.__TAURI__.core.invoke(command,args);
  function available(){return typeof indexedDB!=='undefined'}
  function open(){return new Promise((resolve,reject)=>{if(!available())return reject(new Error('IndexedDB indisponível'));const request=indexedDB.open(DB_NAME,1);request.onupgradeneeded=()=>{const database=request.result;if(!database.objectStoreNames.contains(STORE_NAME))database.createObjectStore(STORE_NAME)};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Não foi possível abrir o banco local'));request.onblocked=()=>reject(new Error('O banco local está bloqueado por outra aba'))})}
  async function run(mode,operation){const database=await open();return new Promise((resolve,reject)=>{const transaction=database.transaction(STORE_NAME,mode),request=operation(transaction.objectStore(STORE_NAME));request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error||new Error('Falha no banco local'));transaction.oncomplete=()=>database.close();transaction.onerror=()=>{database.close();reject(transaction.error||new Error('Falha na transação local'))};transaction.onabort=()=>{database.close();reject(transaction.error||new Error('Transação local cancelada'))}})}
  function parse(value){if(!value)return null;try{const parsed=typeof value==='string'?JSON.parse(value):value;return parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:null}catch{return null}}
  async function read(){
    if(desktop()) return parse(await invoke('read_state'));
    if(available()){try{const stored=parse(await run('readonly',store=>store.get(DATA_KEY)));if(stored)return stored}catch(error){console.warn('[StudyOS] IndexedDB indisponível; usando armazenamento de compatibilidade.',error)}}const legacy=parse(localStorage.getItem(LEGACY_KEY));if(legacy&&available()){try{await write(legacy);localStorage.removeItem(LEGACY_KEY)}catch{}}return legacy
  }
  async function write(payload){
    const snapshot=JSON.stringify(payload);
    if(desktop()) return invoke('write_state',{payload});
    localStorage.setItem(RECOVERY_KEY,snapshot);if(available()){try{await run('readwrite',store=>store.put(snapshot,DATA_KEY));localStorage.removeItem(LEGACY_KEY);return 'indexeddb'}catch(error){console.warn('[StudyOS] Falha no IndexedDB; usando armazenamento de compatibilidade.',error)}}localStorage.setItem(LEGACY_KEY,snapshot);return 'localstorage'
  }
  function recovery(){return parse(localStorage.getItem(RECOVERY_KEY))}
  window.StudyOSLocalDB={read,write,recovery,available,desktop,info:async()=>desktop()?invoke('storage_info'):{engine:available()?'IndexedDB':'localStorage',scope:'device',cloud:false}};
})();
