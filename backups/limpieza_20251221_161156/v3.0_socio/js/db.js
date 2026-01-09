// js/db.js
// Usamos la versión UMD de `idb` cargada desde CDN en `index.html`.
// `idb` expone un objeto global `idb` con la función `openDB`.
const { openDB } = idb;

const DB_NAME = 'YAvoyDB';
const DB_VERSION = 1;
const STORE_NAME = 'sync-comercios';

let db;

async function initDB() {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
          autoIncrement: true,
        });
      }
    },
  });
  return db;
}

export async function storeDataForSync(data) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.add(data);
  await tx.done;
  console.log('Datos del comercio guardados en IndexedDB para sincronización.');
}

export async function getAllDataForSync() {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

export async function clearSyncData() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
  console.log('Datos de sincronización de IndexedDB eliminados.');
}
