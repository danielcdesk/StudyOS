if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('[StudyOS] Modo offline indisponível.',error)))}
