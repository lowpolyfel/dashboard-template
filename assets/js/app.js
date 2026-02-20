const DB_NAME = 'control-epp-db';
const DB_VERSION = 1;
let db;

const $ = (id) => document.getElementById(id);

async function initDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const dbase = event.target.result;

      if (!dbase.objectStoreNames.contains('trabajadores')) {
        const store = dbase.createObjectStore('trabajadores', { keyPath: 'rpe' });
        store.createIndex('departamento', 'departamento', { unique: false });
        store.createIndex('puesto', 'puesto', { unique: false });
      }
      if (!dbase.objectStoreNames.contains('controlEpp')) {
        const store = dbase.createObjectStore('controlEpp', { keyPath: 'id', autoIncrement: true });
        store.createIndex('deptRole', 'deptRole', { unique: false });
      }
      if (!dbase.objectStoreNames.contains('documentos')) {
        const store = dbase.createObjectStore('documentos', { keyPath: 'id', autoIncrement: true });
        store.createIndex('workerEpp', 'workerEpp', { unique: false });
      }
      if (!dbase.objectStoreNames.contains('empresa')) {
        dbase.createObjectStore('empresa', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

function getAll(store) {
  return new Promise((resolve, reject) => {
    const req = tx(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function save(store, data) {
  return new Promise((resolve, reject) => {
    const req = tx(store, 'readwrite').put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function remove(store, id) {
  return new Promise((resolve, reject) => {
    const req = tx(store, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

async function loadCompanyImage() {
  const req = tx('empresa').get('logo');
  req.onsuccess = () => {
    const logo = req.result?.image;
    const preview = $('companyPreview');
    if (logo) {
      preview.src = logo;
      preview.style.display = 'block';
    }
  };
}

async function renderWorkers() {
  const workers = await getAll('trabajadores');
  const epps = await getAll('controlEpp');
  const docs = await getAll('documentos');

  const filters = {
    rpe: $('searchRpe').value.toLowerCase(),
    dept: $('searchDept').value.toLowerCase(),
    role: $('searchRole').value.toLowerCase()
  };

  const filtered = workers.filter((w) =>
    w.rpe.toLowerCase().includes(filters.rpe) &&
    w.departamento.toLowerCase().includes(filters.dept) &&
    w.puesto.toLowerCase().includes(filters.role)
  );

  $('workersBody').innerHTML = filtered.map((w) => {
    const key = `${w.departamento}::${w.puesto}`;
    const workerEpps = epps.filter((e) => e.deptRole === key);
    const checklistHtml = workerEpps.map((e) => `<label class="checklist-item"><input type="checkbox" checked disabled />${e.nombre}</label>`).join('');
    const docsHtml = workerEpps.map((epp) => {
      const doc = docs.find((d) => d.workerEpp === `${w.rpe}::${epp.id}`);
      const hasDoc = Boolean(doc);
      return `
        <div class="epp-doc-row">
          <div>
            <strong>${epp.nombre}</strong>
            <span class="badge">${hasDoc ? 'Cargado' : 'Pendiente'}</span>
          </div>
          <div class="doc-actions">
            ${hasDoc ? `<a class="btn" href="${doc.file}" target="_blank">Ver PDF</a><a class="btn" href="${doc.file}" download="${doc.fileName}">Descargar</a><button class="btn" data-delete-doc="${doc.id}">Eliminar</button>` : ''}
            <input type="file" accept="application/pdf" data-file="${w.rpe}:${epp.id}" />
            <button class="btn btn-green" data-upload="${w.rpe}:${epp.id}">Subir</button>
          </div>
        </div>`;
    }).join('');

    return `<tr>
      <td>${w.rpe}</td>
      <td>${w.imagen ? `<img class="worker-photo" src="${w.imagen}" alt="${w.nombre}" />` : ''}</td>
      <td>${w.nombre}</td>
      <td>${w.departamento}</td>
      <td>${w.puesto}</td>
      <td>
        ${checklistHtml}
        <div class="epp-add">
          <input type="text" placeholder="Nuevo EPP" data-epp-name="${w.rpe}" />
          <button class="btn" data-add-epp="${w.rpe}">Agregar</button>
        </div>
      </td>
      <td>${docsHtml || '<em>Sin EPP para este departamento/puesto</em>'}</td>
    </tr>`;
  }).join('');
}

async function bindActions() {
  $('workerForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const imagen = await fileToBase64(form.get('imagen'));
    await save('trabajadores', {
      rpe: String(form.get('rpe')).trim(),
      nombre: String(form.get('nombre')).trim(),
      departamento: String(form.get('departamento')).trim(),
      puesto: String(form.get('puesto')).trim(),
      imagen
    });
    event.currentTarget.reset();
    await renderWorkers();
  });

  $('saveCompanyImage').addEventListener('click', async () => {
    const file = $('companyImage').files[0];
    if (!file) return;
    const image = await fileToBase64(file);
    await save('empresa', { id: 'logo', image });
    await loadCompanyImage();
  });

  $('searchBtn').addEventListener('click', renderWorkers);
  ['searchRpe', 'searchDept', 'searchRole'].forEach((id) => $(id).addEventListener('input', renderWorkers));

  document.body.addEventListener('click', async (event) => {
    const addBtn = event.target.closest('[data-add-epp]');
    if (addBtn) {
      const rpe = addBtn.dataset.addEpp;
      const workers = await getAll('trabajadores');
      const worker = workers.find((w) => w.rpe === rpe);
      const input = document.querySelector(`[data-epp-name="${rpe}"]`);
      const nombre = input.value.trim();
      if (!nombre || !worker) return;
      await save('controlEpp', { nombre, deptRole: `${worker.departamento}::${worker.puesto}` });
      input.value = '';
      await renderWorkers();
      return;
    }

    const uploadBtn = event.target.closest('[data-upload]');
    if (uploadBtn) {
      const [rpe, eppId] = uploadBtn.dataset.upload.split(':');
      const fileInput = document.querySelector(`input[data-file="${rpe}:${eppId}"]`);
      const file = fileInput.files[0];
      if (!file) return;
      const base64 = await fileToBase64(file);
      const docs = await getAll('documentos');
      const current = docs.find((d) => d.workerEpp === `${rpe}::${eppId}`);
      await save('documentos', {
        id: current?.id,
        workerEpp: `${rpe}::${eppId}`,
        file: base64,
        fileName: file.name
      });
      await renderWorkers();
      return;
    }

    const deleteBtn = event.target.closest('[data-delete-doc]');
    if (deleteBtn) {
      await remove('documentos', Number(deleteBtn.dataset.deleteDoc));
      await renderWorkers();
    }
  });

  $('downloadZip').addEventListener('click', async () => {
    const payload = {
      trabajadores: await getAll('trabajadores'),
      controlEpp: await getAll('controlEpp'),
      documentos: await getAll('documentos')
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'control-epp-export.json';
    a.click();
    URL.revokeObjectURL(url);
  });
}

async function init() {
  db = await initDb();
  await bindActions();
  await loadCompanyImage();
  await renderWorkers();
}

init();
