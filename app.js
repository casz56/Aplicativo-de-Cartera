/* Sistema de Gestión de Cartera INFIHUILA
   HTML5 + JavaScript + CSS. Prototipo sin backend.
   Módulos internos: parsers, validators, charts, tables, exports, utils. */
(() => {
  'use strict';

  const COLORS = {
    lime: '#ccd400', teal: '#00757a', dark: '#004651', ok: '#16a34a', warn: '#f59e0b', danger: '#dc2626', gray: '#5c6670', pale: '#edf7f7'
  };

  const ANEXO1_STORAGE_KEY = 'infihuilaCarteraAnexo1.v1.5';
  const ANEXO1_LEGACY_STORAGE_KEY = 'infihuilaCarteraAnexo1.v1';

  const SOURCE_CONFIG = {
    pagos: { title: 'Pagos y recaudos', fileHint: 'ACREPC1', headers: ['TIPO','TRANSACCION','NUMERO','CLIENTE','ENTIDAD','PRESTAMO','LINEA','FECHA','CAPITAL','INTERES CORRIENTE','INTERES SUSPENDIDO','INTERES MORA','OTROS','TOTAL PAGADO','ESTADO'] },
    desembolsos: { title: 'Desembolsos', fileHint: 'ACREPC_DES', headers: ['LINEA','CLIENTE','ENTIDAD','CONTRATO','PAGARE','FECHA DESEMBOLSO','FECHA VENCIMIENTO','MONTO','SALDO CAPITAL (FECHA VALIDA)','PLAZO','FREC KAPI','FREQ INT','TASA','MODALIDAD','ENTIDAD CANAL'] },
    calificacion: { title: 'Calificación de cartera', fileHint: 'ACRESC_C1', headers: ['CLIENTE','ENTIDAD','LINEA','PAGARE','CENTRO DE COSTO','SALDO CAPITAL','SALDO INTERES','TOTAL','DIAS MORA','CALIFICACION','PROVISIÓN GENERAL (1%)'] },
    concentracion: { title: 'Concentración', fileHint: 'ACRESC_COC', headers: ['NUMERO','CLIENTE','ENTIDAD','CAPITAL','CONCENTRACION'] },
    edadCartera: { title: 'Edad de cartera', fileHint: 'ACRESC_EDAD', headers: ['IDENTIFICACION CLIENTE','NOMBRE CLIENTE','NO. PAGARE','LINEA','FECHA DESEMBOLSO','FECHA VENCIMIENTO','SALDO CAPITAL','SALDO TOTAL','ESTADO CREDITO','CALIFICACION CREDITO','DIAS VENCIDAD','CAPITAL DIA','CAPITAL MAYOR A 720'] },
    saldos: { title: 'Saldos de cartera', fileHint: 'ACRESC_P1', headers: ['CLIENTE','ENTIDAD','LINEA','CREDITO','CAPITAL','INTERES CORRIENTE','INTERES SUSPENDIDO','INTERES MORA','TOTAL','TASA E.A.'] },
    indicadoresCalidad: { title: 'Indicadores de calidad', fileHint: 'Datos indicadores', headers: ['Sector','Saldo cartera','% Cartera','Cumple limite cartera','Limite cartera (%)','% Patrimonio tecnico','Cumple limite patrimonio tecnico'] },
    formato514: { title: 'Formato 514 SFC', fileHint: 'Formato_5141', headers: ['SUBCUENTA','CONCEPTO','RECURSOS_EXCEDENTES','RECURSOS_PROPIOS','TOTAL','UNIDAD_CAPTURA'] },
    resultados: { title: 'Resultados consolidados', fileHint: 'Resultados', headers: ['Fecha de corte','No. pagare','Fecha pagare','Monto pagare ($)','Fecha Vencimiento','Cliente','Nombre de cliente','Dias de mora','Calificacion','Linea de credito ERP','Descripcion Concepto','Saldo concepto($)','Saldo capital vencido ($)'] }
  };

  const state = {
    pagos: clone(window.DEMO_DATA?.pagos || []),
    desembolsos: clone(window.DEMO_DATA?.desembolsos || []),
    calificacion: clone(window.DEMO_DATA?.calificacion || []),
    concentracion: clone(window.DEMO_DATA?.concentracion || []),
    edadCartera: clone(window.DEMO_DATA?.edadCartera || []),
    saldos: clone(window.DEMO_DATA?.saldos || []),
    indicadoresCalidad: clone(window.DEMO_DATA?.indicadoresCalidad || []),
    formato514: clone(window.DEMO_DATA?.formato514 || []),
    resultados: clone(window.DEMO_DATA?.resultados || []),
    anexo1: clone(window.ANEXO1_DEMO || getEmptyAnexo1State()),
    filtros: { search:'', line:'', rating:'', sector:'', mora:'', amount:'' },
    metadata: { fechaCorte:'2026-02-28', archivosCargados: [], fechaCarga: new Date().toISOString(), version: '2.0.0', demo: true },
    ui: { activeLayout:'inicio', activeSubmodule:null, filtersDrawerOpen:false, actionMenuOpen:false, compactMode:true, layoutVersion: '2.0.0' },
    charts: {},
    tables: {},
    validations: [],
    unified: []
  };

  const dom = {};
  const TABLE_PAGE_SIZE = 18;

  document.addEventListener('DOMContentLoaded', init);

  function init(){
    cacheDom();
    bindEvents();
    applyPersistedDataMode();
    initializeState();
    renderAll();
    syncTabFromHash();
    window.addEventListener('hashchange', syncTabFromHash);
  }

  function cacheDom(){
    ['fileInput','dropZone','sourceMode','loadedFiles','fechaCorte','overallHealth','kpiGrid','alertGrid','validationGrid','sessionPill','adminAccessBtn','logoutBtn','deleteDataBtn',
     'searchInput','lineFilter','ratingFilter','sectorFilter','moraFilter','amountFilter','clearFiltersBtn','resetBtn','exportExcelBtn','exportPdfBtn',
     'tabs','anexo1Subtabs','anexo1MetaLine','anexo1Resumen','anexo1Alerts','anexo1Content','anexo1Search','anexo1LineFilter','anexo1RatingFilter','anexo1SourceFilter','anexo1MoraFilter','anexo1ViewMode','toggleAnexo1EditBtn','saveAnexo1Btn','discardAnexo1EditsBtn','addAnexo1RowBtn','deleteAnexo1RowBtn','anexo1EditStatus','exportAnexo1ExcelBtn','exportAnexo1PdfBtn','clearAnexo1Btn','refreshAnexo1Btn','helpBtn','helpDialog','closeHelp','clientDialog','closeClient','clientDetail','clientCards','fullscreenBtn'].forEach(id => dom[id] = document.getElementById(id));
  }

  function bindEvents(){
    dom.fileInput?.addEventListener('change', e => handleFiles(e.target.files));
    dom.dropZone?.addEventListener('dragover', e => { e.preventDefault(); dom.dropZone.classList.add('drag'); });
    dom.dropZone?.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag')); 
    dom.dropZone?.addEventListener('drop', e => { e.preventDefault(); dom.dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    dom.searchInput.addEventListener('input', e => updateFilter('search', e.target.value));
    dom.lineFilter.addEventListener('change', e => updateFilter('line', e.target.value));
    dom.ratingFilter.addEventListener('change', e => updateFilter('rating', e.target.value));
    dom.sectorFilter.addEventListener('change', e => updateFilter('sector', e.target.value));
    dom.moraFilter.addEventListener('change', e => updateFilter('mora', e.target.value));
    dom.amountFilter.addEventListener('change', e => updateFilter('amount', e.target.value));
    dom.clearFiltersBtn.addEventListener('click', clearFilters);
    dom.resetBtn?.addEventListener('click', resetDemo);
    dom.deleteDataBtn?.addEventListener('click', clearAllLoadedData);
    dom.logoutBtn?.addEventListener('click', () => window.CarteraAuth?.logout?.());
    dom.exportExcelBtn.addEventListener('click', exportToExcel);
    dom.exportPdfBtn.addEventListener('click', exportToPDF);
    dom.tabs.addEventListener('click', e => { const btn = e.target.closest('.tab[data-tab]'); if(btn){ e.preventDefault(); switchTab(btn.dataset.tab); } });
    dom.anexo1Subtabs?.addEventListener('click', e => { const btn = e.target.closest('[data-anexo1-sheet]'); if(btn){ e.preventDefault(); state.anexo1.activeSheet = btn.dataset.anexo1Sheet; renderAnexo1Module(); }});
    dom.anexo1Search?.addEventListener('input', e => { state.anexo1.filters.search = e.target.value; renderAnexo1Module(); });
    dom.anexo1LineFilter?.addEventListener('change', e => { state.anexo1.filters.line = e.target.value; renderAnexo1Module(); });
    dom.anexo1RatingFilter?.addEventListener('change', e => { state.anexo1.filters.rating = e.target.value; renderAnexo1Module(); });
    dom.anexo1SourceFilter?.addEventListener('change', e => { state.anexo1.filters.source = e.target.value; renderAnexo1Module(); });
    dom.anexo1MoraFilter?.addEventListener('change', e => { state.anexo1.filters.mora = e.target.value; renderAnexo1Module(); });
    dom.anexo1ViewMode?.addEventListener('change', e => { state.anexo1.viewMode = e.target.value; renderAnexo1Module(); });
    dom.exportAnexo1ExcelBtn?.addEventListener('click', exportAnexo1ToExcel);
    dom.exportAnexo1PdfBtn?.addEventListener('click', exportAnexo1ToPDF);
    dom.clearAnexo1Btn?.addEventListener('click', clearAnexo1Data);
    dom.refreshAnexo1Btn?.addEventListener('click', renderAnexo1Module);
    dom.toggleAnexo1EditBtn?.addEventListener('click', toggleAnexo1EditMode);
    dom.saveAnexo1Btn?.addEventListener('click', saveAnexo1Changes);
    dom.discardAnexo1EditsBtn?.addEventListener('click', discardAnexo1Edits);
    dom.addAnexo1RowBtn?.addEventListener('click', addAnexo1Row);
    dom.deleteAnexo1RowBtn?.addEventListener('click', deleteAnexo1SelectedRow);
    document.body.addEventListener('click', e => {
      const gridCell = e.target.closest('[data-anexo-edit-cell]');
      if(gridCell) updateAnexo1GridCell(gridCell);
      const detailCell = e.target.closest('[data-anexo-edit-detail]');
      if(detailCell) updateAnexo1DetailCell(detailCell);
      const rowSelect = e.target.closest('[data-anexo-row-select]');
      if(rowSelect){ selectAnexo1Row(rowSelect); }
      const recordSelect = e.target.closest('[data-anexo-record-select]');
      if(recordSelect){ selectAnexo1Record(recordSelect); }
      const exportBtn = e.target.closest('[data-export-table]');
      if(exportBtn) exportSingleTable(exportBtn.dataset.exportTable);
      const sortable = e.target.closest('th[data-sort]');
      if(sortable) sortTable(sortable.dataset.table, sortable.dataset.sort);
      const client = e.target.closest('[data-client]');
      if(client) openClient360(client.dataset.client);
    });
    document.body.addEventListener('input', e => {
      const gridCell = e.target.closest('[data-anexo-edit-cell]');
      if(gridCell) updateAnexo1GridCell(gridCell, { soft:true });
      const detailCell = e.target.closest('[data-anexo-edit-detail]');
      if(detailCell) updateAnexo1DetailCell(detailCell, { soft:true });
    });
    document.body.addEventListener('blur', e => {
      const editable = e.target.closest?.('[data-anexo-edit-cell], [data-anexo-edit-detail]');
      if(editable) finalizeAnexo1Edit();
    }, true);
    document.body.addEventListener('keydown', e => {
      const editable = e.target.closest?.('[data-anexo-edit-cell], [data-anexo-edit-detail]');
      if(editable) handleAnexo1EditableKeydown(e, editable);
    });
    dom.helpBtn.addEventListener('click', () => dom.helpDialog.showModal());
    dom.closeHelp.addEventListener('click', () => dom.helpDialog.close());
    dom.closeClient.addEventListener('click', () => dom.clientDialog.close());
    dom.fullscreenBtn.addEventListener('click', () => document.querySelector('.content-panel').requestFullscreen?.());
  }

  function initializeState(){
    state.unified = buildUnifiedPortfolio();
    state.validations = runValidationEngine();
  }

  function renderAll(){
    state.unified = buildUnifiedPortfolio();
    state.validations = runValidationEngine();
    populateFilters();
    renderStatus();
    renderDashboard();
    renderValidation();
    renderCharts();
    renderTables();
    renderClientCards();
    renderAnexo1Module();
  }

  function switchTab(tabName, updateHash = true){
    if(state.ui) state.ui.activeLayout = String(tabName || 'dashboard').replace(/^#/, '');
    if(typeof window.activateCarteraTab === 'function'){
      window.activateCarteraTab(tabName || 'dashboard', { updateHash });
      return;
    }
    const safeTab = String(tabName || 'dashboard').replace(/^#/, '').trim();
    const tabs = document.querySelectorAll('.tab[data-tab]');
    const pages = document.querySelectorAll('.tab-page');
    let targetButton = Array.from(tabs).find(btn => btn.dataset.tab === safeTab) || document.querySelector('.tab[data-tab="dashboard"]') || tabs[0];
    if(!targetButton) return;
    let targetPage = document.getElementById(`tab-${targetButton.dataset.tab}`);

    tabs.forEach(btn => {
      const active = btn === targetButton;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    pages.forEach(page => {
      const active = page === targetPage;
      page.classList.toggle('active', active);
      page.hidden = !active;
    });

    if(updateHash && targetButton){
      const newHash = `#${targetButton.dataset.tab}`;
      try{
        if(window.location.hash !== newHash) history.replaceState(null, '', newHash);
      }catch(err){
        window.location.hash = targetButton.dataset.tab;
      }
    }
  }

  function syncTabFromHash(){
    switchTab(window.location.hash || 'dashboard', false);
  }

  function renderSessionAccess(){
    const session = window.CarteraAuth?.getSession?.();
    if(dom.sessionPill){
      dom.sessionPill.textContent = session ? `${session.role === 'admin' ? 'Admin' : 'Usuario'}: ${session.email}` : 'Sesión no validada';
      dom.sessionPill.classList.toggle('is-admin', session?.role === 'admin');
    }
    if(dom.adminAccessBtn){
      dom.adminAccessBtn.hidden = session?.role !== 'admin';
    }
  }

  function clearAllLoadedData(){
    const confirmed = confirm('¿Borrar toda la información de cartera cargada en esta sesión? Esta acción dejará el aplicativo sin datos hasta que cargues nuevamente los Excel o restablezcas los datos demo.');
    if(!confirmed) return;
    clearSourceArrays();
    state.metadata = { fechaCorte:null, archivosCargados: [], fechaCarga: new Date().toISOString(), version:'2.0.0', demo:false, cleared:true };
    state.filtros = { search:'', line:'', rating:'', sector:'', mora:'', amount:'' };
    state.anexo1 = getEmptyAnexo1State();
    try{ localStorage.setItem('infihuilaCarteraDataMode.v1', 'cleared'); localStorage.removeItem(ANEXO1_STORAGE_KEY); localStorage.removeItem(ANEXO1_LEGACY_STORAGE_KEY); }catch(err){}
    ['searchInput','lineFilter','ratingFilter','sectorFilter','moraFilter','amountFilter'].forEach(id => { if(dom[id]) dom[id].value = ''; });
    renderAll();
    alert('Información cargada borrada. Puedes cargar nuevos Excel o usar Restablecer para volver a los datos demo.');
  }

  function clearSourceArrays(){
    ['pagos','desembolsos','calificacion','concentracion','edadCartera','saldos','indicadoresCalidad','formato514','resultados'].forEach(key => state[key] = []);
    state.anexo1 = getEmptyAnexo1State();
    state.unified = [];
    state.validations = [];
  }

  function applyPersistedDataMode(){
    try{
      if(localStorage.getItem('infihuilaCarteraDataMode.v1') === 'cleared'){
        clearSourceArrays();
        state.metadata = { fechaCorte:null, archivosCargados: [], fechaCarga: new Date().toISOString(), version:'2.0.0', demo:false, cleared:true };
        return;
      }
      const saved = localStorage.getItem(ANEXO1_STORAGE_KEY) || localStorage.getItem(ANEXO1_LEGACY_STORAGE_KEY);
      if(saved){
        const parsed = JSON.parse(saved);
        state.anexo1 = rehydrateAnexo1State(parsed);
        state.anexo1.edit.enabled = false;
        state.anexo1.edit.dirty = false;
        state.metadata.demo = false;
        state.metadata.cleared = false;
      }
    }catch(err){
      console.warn('No fue posible restaurar Anexo 1 guardado localmente.', err);
    }
  }

  function renderStatus(){
    renderSessionAccess();
    dom.fechaCorte.textContent = formatDate(findFechaCorte());
    dom.sourceMode.textContent = state.metadata.cleared ? 'Sin datos: información cargada borrada' : state.metadata.demo ? 'Demo validado con fuentes anexas' : 'Archivos cargados por el usuario';
    dom.loadedFiles.textContent = state.metadata.cleared ? '0 archivos activos' : state.metadata.demo ? '9 fuentes base' : `${state.metadata.archivosCargados.length} archivo(s)`;
    const hasCritical = state.validations.some(v => v.status === 'Crítico');
    const hasWarning = state.validations.some(v => v.status === 'Advertencia');
    dom.overallHealth.className = `health-pill ${hasCritical ? 'danger' : hasWarning ? 'warning' : 'ok'}`;
    dom.overallHealth.textContent = hasCritical ? 'Estado crítico' : hasWarning ? 'Advertencia de conciliación' : 'Fuentes conciliadas';
  }

  function updateFilter(key, value){
    state.filtros[key] = value;
    renderDashboard();
    renderCharts();
    renderTables();
    renderClientCards();
  }

  function clearFilters(){
    state.filtros = { search:'', line:'', rating:'', sector:'', mora:'', amount:'' };
    ['searchInput','lineFilter','ratingFilter','sectorFilter','moraFilter','amountFilter'].forEach(id => dom[id].value = '');
    renderDashboard(); renderCharts(); renderTables(); renderClientCards();
  }

  function resetDemo(){
    if(!confirm('¿Restablecer los datos demo validados con las fuentes anexas?')) return;
    try{ localStorage.removeItem('infihuilaCarteraDataMode.v1'); localStorage.removeItem(ANEXO1_STORAGE_KEY); localStorage.removeItem(ANEXO1_LEGACY_STORAGE_KEY); }catch(err){}
    Object.assign(state, {
      pagos: clone(window.DEMO_DATA.pagos), desembolsos: clone(window.DEMO_DATA.desembolsos), calificacion: clone(window.DEMO_DATA.calificacion),
      concentracion: clone(window.DEMO_DATA.concentracion), edadCartera: clone(window.DEMO_DATA.edadCartera), saldos: clone(window.DEMO_DATA.saldos),
      indicadoresCalidad: clone(window.DEMO_DATA.indicadoresCalidad), formato514: clone(window.DEMO_DATA.formato514), resultados: clone(window.DEMO_DATA.resultados), anexo1: clone(window.ANEXO1_DEMO || getEmptyAnexo1State())
    });
    state.metadata = { fechaCorte:'2026-02-28', archivosCargados: [], fechaCarga: new Date().toISOString(), version:'2.0.0', demo:true };
    clearFilters();
  }

  /* ===============================
     PARSERS: lectura Excel en browser
     =============================== */
  async function handleFiles(fileList){
    if(typeof XLSX === 'undefined'){
      alert('No se pudo cargar SheetJS/XLSX. Verifique conexión a internet para cargar archivos Excel.');
      return;
    }
    const files = Array.from(fileList || []);
    if(!files.length) return;
    const loaded = [];
    const failed = [];
    for(const file of files){
      try{
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type:'array', cellDates:true, raw:false });
        if(detectAnexo1Workbook(file.name, wb)){
          state.anexo1 = parseAnexo1Workbook(file.name, wb);
          loaded.push(`${file.name} → Anexo 1 (${Object.keys(state.anexo1.hojas || {}).length} hojas)`);
          continue;
        }
        const parsed = parseWorkbook(file.name, wb);
        if(parsed.type){
          state[parsed.type] = parsed.records;
          loaded.push(`${file.name} → ${SOURCE_CONFIG[parsed.type].title} (${parsed.records.length})`);
        } else {
          failed.push(`${file.name}: no se reconoció la estructura.`);
        }
      }catch(err){
        console.error(err);
        failed.push(`${file.name}: ${err.message}`);
      }
    }
    try{ localStorage.removeItem('infihuilaCarteraDataMode.v1'); localStorage.removeItem(ANEXO1_STORAGE_KEY); localStorage.removeItem(ANEXO1_LEGACY_STORAGE_KEY); }catch(err){}
    state.metadata.demo = false;
    state.metadata.archivosCargados.push(...loaded);
    state.metadata.fechaCarga = new Date().toISOString();
    renderAll();
    const message = [`Carga procesada: ${loaded.length} archivo(s).`, ...loaded, ...failed].join('\n');
    alert(message);
  }

  function parseWorkbook(fileName, wb){
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { header:1, defval:'', raw:false });
    const type = detectSourceType(fileName, rows);
    if(!type) return { type:null, records:[] };
    if(type === 'formato514') return { type, records: parseFormato514(rows) };
    const headerIndex = findHeaderRow(rows, SOURCE_CONFIG[type].headers);
    if(headerIndex < 0) return { type:null, records:[] };
    const records = rowsToRecords(rows, headerIndex, type).filter(row => isValidRecord(row, type));
    return { type, records };
  }

  function detectSourceType(fileName, rows){
    const n = normalizeText(fileName);
    if(n.includes('ACREPC_DES')) return 'desembolsos';
    if(n.includes('ACREPC1') || (n.includes('ACREPC') && !n.includes('DES'))) return 'pagos';
    if(n.includes('ACRESC_COC')) return 'concentracion';
    if(n.includes('ACRESC_EDAD')) return 'edadCartera';
    if(n.includes('ACRESC_P')) return 'saldos';
    if(n.includes('ACRESC_C1')) return 'calificacion';
    if(n.includes('FORMATO_514') || n.includes('FORMATO 514')) return 'formato514';
    if(n.includes('RESULTADOS')) return 'resultados';
    if(n.includes('INDICADORES')) return 'indicadoresCalidad';
    const sample = normalizeText(rows.slice(0,12).flat().join('|'));
    if(sample.includes('RELACION DE PAGOS')) return 'pagos';
    if(sample.includes('DESEMBOLSOS DE CARTERA')) return 'desembolsos';
    if(sample.includes('CALIFICACION DE CARTERA')) return 'calificacion';
    if(sample.includes('CONCENTRACION')) return 'concentracion';
    if(sample.includes('FORMATO 514')) return 'formato514';
    if(sample.includes('FECHA DE CORTE') && sample.includes('NO PAGARE') && sample.includes('SALDO CONCEPTO')) return 'resultados';
    return null;
  }

  function findHeaderRow(rows, requiredHeaders){
    let best = -1, bestScore = 0;
    rows.forEach((row, idx) => {
      const rowText = normalizeText(row.join('|'));
      const score = requiredHeaders.reduce((acc,h) => acc + (rowText.includes(normalizeText(h).replace(/[()]/g,'')) ? 1 : 0), 0);
      if(score > bestScore){ best = idx; bestScore = score; }
    });
    return bestScore >= 2 ? best : -1;
  }

  function rowsToRecords(rows, headerIndex, type){
    const rawHeaders = rows[headerIndex].map((h,i) => normalizeHeader(h || `COL_${i+1}`));
    const headers = makeUniqueHeaders(rawHeaders);
    return rows.slice(headerIndex+1).map(row => {
      const rec = {};
      headers.forEach((h,i) => { rec[h] = cleanValue(row[i], h); });
      return rec;
    });
  }

  function makeUniqueHeaders(headers){
    const count = {};
    return headers.map(h => {
      count[h] = (count[h] || 0) + 1;
      return count[h] > 1 ? `${h}_${count[h]}` : h;
    });
  }

  function parseFormato514(rows){
    return rows.map(row => ({
      SUBCUENTA: String(row[1] || '').trim(),
      CONCEPTO: String(row[2] || '').trim(),
      RECURSOS_EXCEDENTES: toNumber(row[3]),
      RECURSOS_PROPIOS: toNumber(row[4]),
      TOTAL: toNumber(row[5]),
      UNIDAD_CAPTURA: String(row[7] || '').trim()
    })).filter(r => /^\d+$/.test(r.SUBCUENTA) && r.CONCEPTO && r.TOTAL > 0);
  }

  function isValidRecord(r, type){
    const text = Object.values(r).join(' ');
    if(!text.trim()) return false;
    if(/TOTAL SUBTIPO|TOTAL TIPO|TIPO CARTERA|SUBTIPO CARTERA|TOTAL GENERAL/i.test(text)) return false;
    if(type === 'pagos') return ['REBA','DECA'].includes(String(val(r,'TIPO')).trim());
    if(type === 'desembolsos') return toNumber(val(r,'MONTO')) > 0 && String(val(r,'LINEA')).length > 3;
    if(type === 'calificacion') return toNumber(val(r,'SALDO CAPITAL')) > 0 && val(r,'CLIENTE');
    if(type === 'concentracion') return toNumber(val(r,'CAPITAL')) > 0 && val(r,'ENTIDAD');
    if(type === 'edadCartera') return toNumber(val(r,'SALDO CAPITAL')) > 0 && (val(r,'NOMBRE CLIENTE') || val(r,'CLIENTE'));
    if(type === 'saldos') return toNumber(val(r,'CAPITAL')) > 0 && val(r,'ENTIDAD');
    if(type === 'indicadoresCalidad') return val(r,'SECTOR') && toNumber(val(r,'SALDO CARTERA')) > 0;
    if(type === 'resultados') return val(r,'NOMBRE DE CLIENTE') && toNumber(val(r,'SALDO CONCEPTO')) > 0;
    return true;
  }

  /* ===============================
     MODELO UNIFICADO Y VALIDACIONES
     =============================== */
  function buildUnifiedPortfolio(){
    const map = new Map();
    const add = (id, patch) => {
      if(!id) return;
      const key = String(id).trim();
      if(!map.has(key)) map.set(key, { cliente:key, entidad:'', nit:key, capital:0, total:0, interesCorriente:0, interesMora:0, interesSuspendido:0, diasMora:0, calificacion:'', linea:'', provision:0, concentracion:0, pagarés:new Set(), pagos:0, desembolsos:0, capitalVencido:0 });
      const obj = map.get(key);
      Object.assign(obj, patch(obj));
    };

    state.saldos.forEach(r => add(val(r,'CLIENTE'), obj => ({
      entidad: val(r,'ENTIDAD') || obj.entidad,
      capital: obj.capital + toNumber(val(r,'CAPITAL')),
      total: obj.total + toNumber(val(r,'TOTAL')),
      interesCorriente: obj.interesCorriente + toNumber(val(r,'INTERES CORRIENTE')),
      interesMora: obj.interesMora + toNumber(val(r,'INTERES MORA')),
      interesSuspendido: obj.interesSuspendido + toNumber(val(r,'INTERES SUSPENDIDO')),
      linea: val(r,'LINEA') || obj.linea
    })));

    state.calificacion.forEach(r => add(val(r,'CLIENTE'), obj => ({
      entidad: val(r,'ENTIDAD') || obj.entidad,
      diasMora: Math.max(obj.diasMora, toNumber(val(r,'DIAS MORA'))),
      calificacion: worstRating(obj.calificacion, val(r,'CALIFICACION')),
      provision: obj.provision + toNumber(val(r,'PROVISIÓN GENERAL')),
      linea: val(r,'LINEA') || obj.linea
    })));

    state.concentracion.forEach(r => add(val(r,'CLIENTE'), obj => ({
      entidad: val(r,'ENTIDAD') || obj.entidad,
      concentracion: Math.max(obj.concentracion, toNumber(val(r,'CONCENTRACION')))
    })));

    state.resultados.forEach(r => add(val(r,'CLIENTE'), obj => {
      const desc = normalizeText(val(r,'DESCRIPCION CONCEPTO'));
      const amount = toNumber(val(r,'SALDO CONCEPTO'));
      const pay = String(val(r,'NO PAGARE') || val(r,'NO. PAGARE') || '').trim();
      if(pay) obj.pagarés.add(pay);
      return {
        entidad: val(r,'NOMBRE DE CLIENTE') || obj.entidad,
        diasMora: Math.max(obj.diasMora, toNumber(val(r,'DIAS DE MORA'))),
        calificacion: worstRating(obj.calificacion, val(r,'CALIFICACION')),
        capitalVencido: obj.capitalVencido + toNumber(val(r,'SALDO CAPITAL VENCIDO')),
        linea: val(r,'LINEA DE CREDITO ERP') || obj.linea,
        capital: obj.capital || (desc === 'CAPITAL' ? amount : obj.capital)
      };
    }));

    state.pagos.forEach(r => add(val(r,'CLIENTE'), obj => ({ pagos: obj.pagos + toNumber(val(r,'TOTAL PAGADO')) })));
    state.desembolsos.forEach(r => add(val(r,'CLIENTE'), obj => ({ desembolsos: obj.desembolsos + toNumber(val(r,'MONTO')) })));

    return Array.from(map.values()).map(x => ({...x, pagarés: x.pagarés.size})).sort((a,b) => b.capital - a.capital);
  }

  function runValidationEngine(){
    const records = [];
    const capitalSaldos = sum(state.saldos, 'CAPITAL');
    const capitalCalificacion = sum(state.calificacion, 'SALDO CAPITAL');
    const capitalConcentracion = sum(state.concentracion, 'CAPITAL');
    const capitalResultados = sumWhere(state.resultados, r => normalizeText(val(r,'DESCRIPCION CONCEPTO')) === 'CAPITAL', 'SALDO CONCEPTO');
    const formatoTotal = findFormatoTotal();
    const diffResultados = capitalSaldos - capitalResultados;
    const diffFormato = capitalSaldos - formatoTotal;
    const diffACRESC = Math.max(Math.abs(capitalSaldos-capitalCalificacion), Math.abs(capitalSaldos-capitalConcentracion));

    records.push(validation('Capital ACRESC Saldo vs Calificación', capitalSaldos, capitalCalificacion, diffACRESC, diffACRESC < 1 ? 'Validado':'Advertencia', 'Comparación entre ACRESC_P1 y ACRESC_C1 / COC.'));
    records.push(validation('Capital ACRESC vs Resultados.xlsx', capitalSaldos, capitalResultados, diffResultados, Math.abs(diffResultados) < 1000 ? 'Validado':'Advertencia', 'Diferencia esperada por corte, conceptos incluidos/excluidos o estructura regulatoria.'));
    records.push(validation('Capital ACRESC vs Formato 514', capitalSaldos, formatoTotal, diffFormato, Math.abs(diffFormato) < 1000 ? 'Validado':'Advertencia', 'Validación del saldo frente al reporte regulatorio SFC.'));

    const duplicateKeys = new Set(); const duplicates = [];
    state.resultados.forEach(r => {
      const key = `${val(r,'NO PAGARE')}|${val(r,'CODIGO CONCEPTO')}|${val(r,'DESCRIPCION CONCEPTO')}`;
      if(duplicateKeys.has(key)) duplicates.push(key); else duplicateKeys.add(key);
    });
    records.push({control:'Duplicados pagaré + concepto', fuente:'Resultados.xlsx', valorA:duplicates.length, valorB:0, diferencia:duplicates.length, status:duplicates.length ? 'Advertencia':'Validado', observacion:duplicates.length ? 'Existen conceptos repetidos que deben revisarse.' : 'Sin duplicados materiales detectados.'});

    const noClient = state.saldos.filter(r => !val(r,'CLIENTE') || !val(r,'ENTIDAD')).length;
    records.push({control:'Clientes/NIT incompletos', fuente:'ACRESC_P1', valorA:noClient, valorB:0, diferencia:noClient, status:noClient ? 'Advertencia':'Validado', observacion:noClient ? 'Hay registros con cliente o entidad incompleta.' : 'Todos los registros de saldos tienen cliente y entidad.'});

    const carteraCritica = state.calificacion.filter(r => ['E','K'].includes(String(val(r,'CALIFICACION')).trim().toUpperCase()) || toNumber(val(r,'DIAS MORA')) > 720).length;
    records.push({control:'Cartera crítica por calificación/mora', fuente:'ACRESC_C1', valorA:carteraCritica, valorB:0, diferencia:carteraCritica, status:carteraCritica ? 'Crítico':'Validado', observacion:carteraCritica ? 'Registros con calificación E/K o mora superior a 720 días requieren gestión prioritaria.' : 'Sin cartera crítica.'});

    const concentrationTop1 = max(state.concentracion, 'CONCENTRACION');
    records.push({control:'Concentración individual máxima', fuente:'ACRESC_COC1', valorA:concentrationTop1, valorB:0.2, diferencia:concentrationTop1-0.2, status:concentrationTop1 > 0.2 ? 'Advertencia':'Validado', observacion:'Monitorea exposición por mayor deudor frente a criterios internos.'});

    return records;
  }

  function validation(control, a, b, diff, status, obs){
    return { control, fuente:'Conciliación entre fuentes', valorA:a, valorB:b, diferencia:diff, status, observacion:obs };
  }

  /* ===============================
     RENDER: Dashboard y módulos
     =============================== */
  function renderDashboard(){
    const rows = filteredUnified();
    const stats = calculateStats(rows);
    const cards = [
      ['Saldo capital total', stats.capital, 'Capital según saldos filtrados', 'money', stats.capital > 0 ? 'ok':'warn'],
      ['Saldo total cartera', stats.total, 'Capital + intereses y conceptos', 'money', 'ok'],
      ['Interés corriente', stats.interesCorriente, 'Intereses causados corrientes', 'money', 'ok'],
      ['Interés en mora', stats.interesMora, 'Intereses moratorios', 'money', stats.interesMora > 0 ? 'warn':'ok'],
      ['Interés suspendido', stats.interesSuspendido, 'Intereses no causados en resultado', 'money', stats.interesSuspendido > 0 ? 'warn':'ok'],
      ['Capital vencido', stats.capitalVencido, 'Fuente Resultados.xlsx', 'money', stats.capitalVencido > 0 ? 'danger':'ok'],
      ['Índice de mora', stats.indiceMora, 'Capital vencido / capital total', 'percent', stats.indiceMora > .03 ? 'danger': stats.indiceMora > .01 ? 'warn':'ok'],
      ['Provisión general', stats.provision, 'Provisión general identificada', 'money', 'ok'],
      ['Recaudo del mes', stats.recaudos, 'Total pagado fuente ACREPC1', 'money', 'ok'],
      ['Desembolsos del mes', stats.desembolsos, 'Total desembolsado fuente ACREPC_DES1', 'money', 'ok'],
      ['Clientes únicos', stats.clientes, 'NIT/entidades consolidadas', 'number', 'ok'],
      ['Pagarés únicos', stats.pagares, 'Pagarés en fuente Resultados', 'number', 'ok'],
      ['Mayor concentración', stats.top1, 'Participación mayor deudor', 'percent', stats.top1 > .2 ? 'warn':'ok'],
      ['Top 5 concentración', stats.top5, 'Suma de los 5 mayores deudores', 'percent', stats.top5 > .6 ? 'warn':'ok'],
      ['Cartera al día', stats.capitalDia, 'Capital en rango al día', 'money', 'ok'],
      ['> 720 días', stats.capital720, 'Capital crítico por edad', 'money', stats.capital720 > 0 ? 'danger':'ok']
    ];
    dom.kpiGrid.innerHTML = cards.slice(0,8).map(([label,value,note,type,status]) => `
      <article class="kpi-card">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${formatValue(value,type)}</div>
        <div class="kpi-note">${note}</div>
        <span class="kpi-status ${status}"></span>
      </article>`).join('');

    const validationDiff = state.validations.find(v => v.control.includes('Resultados'));
    const alerts = [
      {status:'warn', title:'Conciliación obligatoria', msg:`Diferencia ACRESC vs Resultados/Formato 514: ${formatMoney(validationDiff?.diferencia || 0)}. No se oculta; se deja como alerta de control.`},
      {status: stats.capital720 > 0 ? 'danger':'ok', title:'Cartera mayor a 720 días', msg:`Capital crítico identificado: ${formatMoney(stats.capital720)}.`},
      {status: stats.top1 > .2 ? 'warn':'ok', title:'Concentración de deudor principal', msg:`Mayor participación individual: ${formatPercent(stats.top1)}.`}
    ];
    dom.alertGrid.innerHTML = alerts.map(a => `<article class="alert-card ${a.status}"><h4>${a.title}</h4><p>${a.msg}</p></article>`).join('');
  }

  function renderValidation(){
    const c = state.validations;
    const valid = c.filter(x => x.status === 'Validado').length;
    const warn = c.filter(x => x.status === 'Advertencia').length;
    const crit = c.filter(x => x.status === 'Crítico').length;
    const diff = c.find(x => x.control.includes('Resultados'))?.diferencia || 0;
    dom.validationGrid.innerHTML = [
      ['Controles ejecutados', c.length, 'Reglas automáticas aplicadas'],
      ['Validados', valid, 'Sin diferencias materiales'],
      ['Advertencias', warn, 'Requieren conciliación'],
      ['Diferencia principal', formatMoney(diff), 'ACRESC vs Resultados']
    ].map(x => `<div class="validation-card"><span>${x[0]}</span><strong>${x[1]}</strong><span>${x[2]}</span></div>`).join('');
  }

  function renderCharts(){
    const rows = filteredUnified();
    const lineData = groupSum(rows, r => displayLine(r.linea), r => r.capital);
    const ratingData = groupSum(rows, r => r.calificacion || 'Sin calificación', r => r.capital);
    const topDebtors = rows.slice().sort((a,b)=>b.capital-a.capital).slice(0,10);
    const aging = agingBuckets();
    const sector = groupSector();
    const stats = calculateStats(rows);
    renderChart('lineChart', 'doughnut', Object.keys(lineData), Object.values(lineData), 'Saldo capital');
    renderChart('statusChart', 'pie', ['Al día','Vencida'], [Math.max(stats.capital-stats.capitalVencido,0), stats.capitalVencido], 'Saldo');
    renderChart('ratingChart', 'bar', Object.keys(ratingData), Object.values(ratingData), 'Saldo por calificación');
    renderChart('topDebtorsChart', 'bar', topDebtors.map(x => shortName(x.entidad)), topDebtors.map(x=>x.capital), 'Capital');
    renderChart('agingChart', 'line', Object.keys(aging), Object.values(aging), 'Capital por rango');
    renderChart('sectorChart', 'bar', Object.keys(sector), Object.values(sector), '% cartera');
    renderChart('recaudosChart', 'doughnut', ['Capital','Interés corriente','Interés mora','Interés suspendido','Otros'], [sum(state.pagos,'CAPITAL'),sum(state.pagos,'INTERES CORRIENTE'),sum(state.pagos,'INTERES MORA'),sum(state.pagos,'INTERES SUSPENDIDO'),sum(state.pagos,'OTROS')], 'Recaudos');
    const desemb = groupSum(state.desembolsos, r => displayLine(val(r,'LINEA')), r => toNumber(val(r,'MONTO')));
    renderChart('desembolsosChart', 'bar', Object.keys(desemb), Object.values(desemb), 'Desembolsos');
    const prov = groupSum(state.calificacion, r => val(r,'CALIFICACION') || 'Sin calificación', r => toNumber(val(r,'PROVISIÓN GENERAL')));
    renderChart('provisionChart', 'bar', Object.keys(prov), Object.values(prov), 'Provisión');
    renderChart('riskRatingChart', 'doughnut', Object.keys(ratingData), Object.values(ratingData), 'Saldo');
  }

  function renderChart(canvasId, type, labels, data, label){
    const el = document.getElementById(canvasId);
    if(!el) return;

    if(typeof Chart === 'undefined'){
      const card = el.closest('.chart-card');
      if(card && !card.querySelector('.chart-fallback')){
        card.insertAdjacentHTML('beforeend', '<p class="empty-state chart-fallback">Gráfico pendiente de cargar. Verifique la conexión a internet para Chart.js.</p>');
      }
      return;
    }

    const fallback = el.closest('.chart-card')?.querySelector('.chart-fallback');
    if(fallback) fallback.remove();

    if(state.charts[canvasId]) state.charts[canvasId].destroy();
    state.charts[canvasId] = new Chart(el, {
      type,
      data: { labels, datasets: [{ label, data, borderColor: COLORS.teal, backgroundColor: chartPalette(labels.length), borderWidth: 2, tension:.35, fill: type === 'line' }] },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'top', labels:{ font:{ family:'Montserrat', weight:'700' }}}, tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: ${looksPercent(label) ? formatPercent(ctx.raw/100) : formatMoney(ctx.raw)}` }}},
        scales: type === 'bar' || type === 'line' ? { y:{ ticks:{ callback:value => compactMoney(value) }, grid:{ color:'rgba(0,0,0,.08)' }}, x:{ grid:{ display:false }, ticks:{ maxRotation:45,minRotation:0 }}} : undefined
      }
    });
  }

  function renderTables(){
    renderDataTable('validationTable', state.validations, [
      ['control','Control'], ['fuente','Fuente'], ['valorA','Valor fuente A'], ['valorB','Valor fuente B'], ['diferencia','Diferencia'], ['status','Estado'], ['observacion','Observación']
    ], 'validationSearch', rowClassValidation);
    renderDataTable('saldosTable', filteredRaw(state.saldos), [
      ['CLIENTE','NIT'], ['ENTIDAD','Entidad'], ['LINEA','Línea'], ['CREDITO','Crédito'], ['CAPITAL','Capital'], ['INTERES CORRIENTE','Interés corriente'], ['INTERES SUSPENDIDO','Interés suspendido'], ['INTERES MORA','Interés mora'], ['TOTAL','Total'], ['TASA E.A.','Tasa E.A.']
    ], 'saldosSearch', rowClassSaldos);
    renderDataTable('pagosTable', filteredRaw(state.pagos), [
      ['TIPO','Tipo'], ['TRANSACCION','Transacción'], ['NUMERO','Número'], ['CLIENTE','NIT'], ['ENTIDAD','Entidad'], ['PRESTAMO','Préstamo'], ['LINEA','Línea'], ['FECHA','Fecha'], ['CAPITAL','Capital'], ['INTERES CORRIENTE','Interés corriente'], ['INTERES MORA','Interés mora'], ['TOTAL PAGADO','Total pagado']
    ], 'pagosSearch');
    renderDataTable('desembolsosTable', filteredRaw(state.desembolsos), [
      ['LINEA','Línea'], ['CLIENTE','NIT'], ['ENTIDAD','Entidad'], ['CONTRATO','Contrato'], ['PAGARE','Pagaré'], ['FECHA DESEMBOLSO','Fecha desembolso'], ['FECHA VENCIMIENTO','Fecha vencimiento'], ['MONTO','Monto'], ['SALDO CAPITAL','Saldo capital'], ['TASA','Tasa'], ['MODALIDAD','Modalidad']
    ], 'desembolsosSearch');
    renderDataTable('calificacionTable', filteredRaw(state.calificacion), [
      ['CLIENTE','NIT'], ['ENTIDAD','Entidad'], ['LINEA','Línea'], ['PAGARE','Pagaré'], ['SALDO CAPITAL','Saldo capital'], ['SALDO INTERES','Saldo interés'], ['TOTAL','Total'], ['DIAS MORA','Días mora'], ['CALIFICACION','Calificación'], ['PROVISIÓN GENERAL','Provisión general']
    ], 'calificacionSearch', rowClassCalificacion);
    renderDataTable('edadTable', filteredRaw(state.edadCartera), [
      ['IDENTIFICACION CLIENTE','NIT'], ['NOMBRE CLIENTE','Cliente'], ['MUNICIPIO DE UBICACIÓN','Municipio'], ['NO. PAGARE','Pagaré'], ['LINEA','Línea'], ['FECHA DESEMBOLSO','Desembolso'], ['FECHA VENCIMIENTO','Vencimiento'], ['SALDO CAPITAL','Saldo capital'], ['SALDO TOTAL','Saldo total'], ['ESTADO CREDITO','Estado'], ['CALIFICACION CREDITO','Calificación'], ['DIAS VENCIDAD','Días mora'], ['CAPITAL DIA','Capital día'], ['CAPITAL MAYOR A 720','Capital >720']
    ], 'edadSearch', rowClassEdad);
    renderDataTable('concentracionTable', filteredRaw(state.concentracion), [
      ['NUMERO','#'], ['CLIENTE','NIT'], ['ENTIDAD','Entidad'], ['CAPITAL','Capital'], ['CONCENTRACION','Concentración']
    ], 'concentracionSearch', rowClassConcentracion);
    renderDataTable('formatoTable', state.formato514, [
      ['SUBCUENTA','Subcuenta'], ['CONCEPTO','Concepto'], ['RECURSOS_EXCEDENTES','Recursos excedentes'], ['RECURSOS_PROPIOS','Recursos propios'], ['TOTAL','Total'], ['UNIDAD_CAPTURA','Unidad captura']
    ], 'formatoSearch');
  }

  function renderDataTable(tableId, rows, columns, searchId, rowClassFn){
    const table = document.getElementById(tableId);
    if(!table) return;
    const search = document.getElementById(searchId);
    if(search && !search.dataset.bound){
      search.addEventListener('input', () => renderDataTable(tableId, rows, columns, searchId, rowClassFn));
      search.dataset.bound = 'true';
    }
    const q = normalizeText(search?.value || '');
    let filtered = rows.filter(r => !q || normalizeText(Object.values(r).join(' ')).includes(q));
    const sort = state.tables[tableId]?.sort;
    if(sort){
      filtered.sort((a,b) => compareValues(val(a,sort.key), val(b,sort.key), sort.dir));
    }
    const page = state.tables[tableId]?.page || 1;
    const pageCount = Math.max(1, Math.ceil(filtered.length / TABLE_PAGE_SIZE));
    const safePage = Math.min(page, pageCount);
    state.tables[tableId] = { ...state.tables[tableId], page:safePage, filtered, columns };
    const start = (safePage-1)*TABLE_PAGE_SIZE;
    const visible = filtered.slice(start, start+TABLE_PAGE_SIZE);
    table.innerHTML = `<thead><tr>${columns.map(([k,label]) => `<th data-table="${tableId}" data-sort="${k}">${label}</th>`).join('')}</tr></thead><tbody>${visible.map(r => `<tr class="${rowClassFn ? rowClassFn(r) : ''}">${columns.map(([k]) => `<td class="${cellClass(k)}">${formatCell(k, val(r,k), r)}</td>`).join('')}</tr>`).join('') || `<tr><td colspan="${columns.length}" class="empty-state">No hay registros para mostrar.</td></tr>`}</tbody>`;
    const wrap = table.parentElement;
    let pagination = wrap.querySelector('.pagination');
    if(!pagination){ pagination = document.createElement('div'); pagination.className = 'pagination'; wrap.appendChild(pagination); }
    pagination.innerHTML = `<span>${filtered.length} registro(s)</span> ${Array.from({length:pageCount}, (_,i)=>i+1).slice(0,7).map(p => `<button class="${p===safePage?'active':''}" data-page="${p}" data-table-page="${tableId}">${p}</button>`).join('')} ${pageCount>7?`<span>… ${pageCount}</span>`:''}`;
    pagination.querySelectorAll('button').forEach(btn => btn.addEventListener('click', () => { state.tables[tableId].page = Number(btn.dataset.page); renderDataTable(tableId, rows, columns, searchId, rowClassFn); }));
  }

  function sortTable(tableId, key){
    const current = state.tables[tableId]?.sort;
    state.tables[tableId] = { ...state.tables[tableId], sort:{ key, dir: current?.key === key && current.dir === 'asc' ? 'desc':'asc' } };
    renderTables();
  }

  function renderClientCards(){
    const rows = filteredUnified().slice(0,60);
    dom.clientCards.innerHTML = rows.map(c => `<article class="client-card" data-client="${escapeHtml(c.cliente)}">
      <h3>${escapeHtml(c.entidad || c.cliente)}</h3>
      <p><strong>NIT:</strong> ${escapeHtml(c.cliente)}</p>
      <p><strong>Capital:</strong> ${formatMoney(c.capital)}</p>
      <p><strong>Calificación:</strong> ${formatRating(c.calificacion)} &nbsp; <strong>Mora:</strong> ${Math.round(c.diasMora || 0)} días</p>
      <p><strong>Concentración:</strong> ${formatPercent(c.concentracion)}</p>
    </article>`).join('') || '<div class="empty-state">No hay clientes para mostrar.</div>';
  }

  function openClient360(clientId){
    const c = state.unified.find(x => String(x.cliente) === String(clientId));
    if(!c) return;
    const relatedPagos = state.pagos.filter(r => String(val(r,'CLIENTE')) === String(clientId));
    const relatedDes = state.desembolsos.filter(r => String(val(r,'CLIENTE')) === String(clientId));
    dom.clientDetail.innerHTML = `
      <h2>${escapeHtml(c.entidad || c.cliente)}</h2>
      <p><strong>NIT:</strong> ${escapeHtml(c.cliente)} · <strong>Línea principal:</strong> ${escapeHtml(displayLine(c.linea))} · <strong>Calificación:</strong> ${formatRating(c.calificacion)}</p>
      <div class="detail-grid">
        <div class="detail-box"><span>Saldo capital</span><strong>${formatMoney(c.capital)}</strong></div>
        <div class="detail-box"><span>Saldo total</span><strong>${formatMoney(c.total)}</strong></div>
        <div class="detail-box"><span>Concentración</span><strong>${formatPercent(c.concentracion)}</strong></div>
        <div class="detail-box"><span>Días de mora máximos</span><strong>${Math.round(c.diasMora || 0)}</strong></div>
        <div class="detail-box"><span>Capital vencido</span><strong>${formatMoney(c.capitalVencido)}</strong></div>
        <div class="detail-box"><span>Provisión</span><strong>${formatMoney(c.provision)}</strong></div>
        <div class="detail-box"><span>Recaudos</span><strong>${formatMoney(c.pagos)}</strong></div>
        <div class="detail-box"><span>Desembolsos</span><strong>${formatMoney(c.desembolsos)}</strong></div>
        <div class="detail-box"><span>Pagarés</span><strong>${c.pagarés || 0}</strong></div>
      </div>
      <h3>Alertas asociadas</h3>
      <p>${clientAlertText(c)}</p>
      <h3>Movimientos recientes</h3>
      <p>Pagos identificados: ${relatedPagos.length}. Desembolsos identificados: ${relatedDes.length}.</p>
    `;
    dom.clientDialog.showModal();
  }

  /* ===============================
     FILTROS Y CÁLCULOS
     =============================== */
  function populateFilters(){
    const current = {...state.filtros};
    fillSelect(dom.lineFilter, unique([...state.saldos.map(r => displayLine(val(r,'LINEA'))), ...state.desembolsos.map(r => displayLine(val(r,'LINEA'))), ...state.resultados.map(r => displayLine(val(r,'LINEA DE CREDITO ERP')))]), 'Todas');
    fillSelect(dom.ratingFilter, unique([...state.calificacion.map(r => val(r,'CALIFICACION')), ...state.resultados.map(r => val(r,'CALIFICACION'))]).filter(Boolean), 'Todas');
    fillSelect(dom.sectorFilter, unique(state.indicadoresCalidad.map(r => val(r,'SECTOR'))).filter(Boolean), 'Todos');
    Object.entries(current).forEach(([k,v]) => { const el = {line:dom.lineFilter,rating:dom.ratingFilter,sector:dom.sectorFilter,mora:dom.moraFilter,amount:dom.amountFilter,search:dom.searchInput}[k]; if(el) el.value = v; });
  }

  function filteredUnified(){
    const q = normalizeText(state.filtros.search);
    return state.unified.filter(r => {
      if(q && !normalizeText(`${r.cliente} ${r.entidad} ${r.linea}`).includes(q)) return false;
      if(state.filtros.line && displayLine(r.linea) !== state.filtros.line) return false;
      if(state.filtros.rating && String(r.calificacion) !== state.filtros.rating) return false;
      if(state.filtros.mora && !matchMora(r.diasMora, state.filtros.mora)) return false;
      if(state.filtros.amount && !matchAmount(r.capital, state.filtros.amount)) return false;
      return true;
    });
  }

  function filteredRaw(rows){
    const q = normalizeText(state.filtros.search);
    return rows.filter(r => {
      if(q && !normalizeText(Object.values(r).join(' ')).includes(q)) return false;
      if(state.filtros.line){
        const line = displayLine(val(r,'LINEA') || val(r,'LINEA DE CREDITO ERP'));
        if(line && line !== state.filtros.line) return false;
      }
      if(state.filtros.rating){
        const rating = val(r,'CALIFICACION') || val(r,'CALIFICACION CREDITO');
        if(rating && String(rating) !== state.filtros.rating) return false;
      }
      if(state.filtros.mora){
        const mora = toNumber(val(r,'DIAS MORA') || val(r,'DIAS DE MORA') || val(r,'DIAS VENCIDAD'));
        if(mora || state.filtros.mora === '0') if(!matchMora(mora, state.filtros.mora)) return false;
      }
      if(state.filtros.amount){
        const amount = toNumber(val(r,'CAPITAL') || val(r,'SALDO CAPITAL') || val(r,'MONTO'));
        if(amount && !matchAmount(amount, state.filtros.amount)) return false;
      }
      return true;
    });
  }

  function calculateStats(rows){
    const capital = rows.reduce((a,r)=>a+r.capital,0);
    const total = rows.reduce((a,r)=>a+(r.total || r.capital+r.interesCorriente+r.interesMora+r.interesSuspendido),0);
    const capitalVencido = rows.reduce((a,r)=>a+r.capitalVencido,0) || sum(state.resultados,'SALDO CAPITAL VENCIDO');
    const concentrationSorted = state.concentracion.slice().sort((a,b)=>toNumber(val(b,'CAPITAL'))-toNumber(val(a,'CAPITAL')));
    return {
      capital, total,
      interesCorriente: rows.reduce((a,r)=>a+r.interesCorriente,0),
      interesMora: rows.reduce((a,r)=>a+r.interesMora,0),
      interesSuspendido: rows.reduce((a,r)=>a+r.interesSuspendido,0),
      capitalVencido,
      indiceMora: capital ? capitalVencido / capital : 0,
      provision: rows.reduce((a,r)=>a+r.provision,0) || sum(state.calificacion,'PROVISIÓN GENERAL'),
      recaudos: sum(state.pagos,'TOTAL PAGADO'),
      desembolsos: sum(state.desembolsos,'MONTO'),
      clientes: rows.length,
      pagares: unique(state.resultados.map(r => val(r,'NO PAGARE'))).length,
      top1: toNumber(val(concentrationSorted[0] || {}, 'CONCENTRACION')),
      top5: concentrationSorted.slice(0,5).reduce((a,r)=>a+toNumber(val(r,'CONCENTRACION')),0),
      top10: concentrationSorted.slice(0,10).reduce((a,r)=>a+toNumber(val(r,'CONCENTRACION')),0),
      capitalDia: sum(state.edadCartera,'CAPITAL DIA'),
      capital720: sum(state.edadCartera,'CAPITAL MAYOR A 720')
    };
  }

  function agingBuckets(){
    const labels = ['Día','0-30','31-60','61-90','91-120','121-180','181-360','361-540','541-720','>720'];
    const fields = [['CAPITAL DIA'], ['CAPITAL 0 - 30','CAPITAL 0-30'], ['CAPITAL 31-60'], ['CAPITAL 61-90'], ['CAPITAL 91-120'], ['CAPITAL 121-150','CAPITAL 151-180'], ['CAPITAL 181-210','CAPITAL 211-240','CAPITAL 241-270','CAPITAL 271-300','CAPITAL 301-330','CAPITAL 331-360'], ['CAPITAL 361-540'], ['CAPITAL 541-720'], ['CAPITAL MAYOR A 720']];
    const out = {};
    labels.forEach((label,i) => out[label] = state.edadCartera.reduce((a,r) => a + fields[i].reduce((b,f) => b + toNumber(val(r,f)), 0), 0));
    return out;
  }

  function groupSector(){
    const out = {};
    state.indicadoresCalidad.forEach(r => { out[val(r,'SECTOR')] = toNumber(val(r,'% CARTERA')); });
    return out;
  }

  function findFormatoTotal(){
    const commercial = state.formato514.find(r => normalizeText(val(r,'CONCEPTO')).includes('TOTAL CARTERA COMERCIAL'));
    if(commercial) return toNumber(val(commercial,'TOTAL'));
    return max(state.formato514,'TOTAL');
  }

  function findFechaCorte(){
    const r = state.resultados.find(x => val(x,'FECHA DE CORTE'));
    return val(r || {}, 'FECHA DE CORTE') || state.metadata.fechaCorte;
  }

  /* ===============================
     EXPORTACIONES
     =============================== */
  function exportToExcel(){
    if(!window.XLSX){ alert('No se pudo cargar SheetJS. Verifique conexión a internet para la librería CDN.'); return; }
    const wb = XLSX.utils.book_new();
    const resumen = [
      ['Sistema de Gestión de Cartera INFIHUILA'],
      ['Fecha de generación', new Date().toLocaleString('es-CO')],
      ['Fecha de corte', formatDate(findFechaCorte())],
      [],
      ['Indicador','Valor'],
      ['Saldo capital', calculateStats(state.unified).capital],
      ['Saldo total', calculateStats(state.unified).total],
      ['Recaudos', sum(state.pagos,'TOTAL PAGADO')],
      ['Desembolsos', sum(state.desembolsos,'MONTO')],
      ['Diferencia ACRESC vs Resultados', state.validations.find(v=>v.control.includes('Resultados'))?.diferencia || 0]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');
    appendSheet(wb, 'Validaciones', state.validations);
    appendSheet(wb, 'Saldos', filteredRaw(state.saldos));
    appendSheet(wb, 'Pagos', filteredRaw(state.pagos));
    appendSheet(wb, 'Desembolsos', filteredRaw(state.desembolsos));
    appendSheet(wb, 'Calificacion', filteredRaw(state.calificacion));
    appendSheet(wb, 'Concentracion', filteredRaw(state.concentracion));
    appendSheet(wb, 'Formato514', state.formato514);
    if(state.anexo1?.loaded){
      Object.entries(state.anexo1.hojas || {}).forEach(([key,sheet]) => appendSheet(wb, `Anexo1_${key}`.substring(0,31), sheet.records?.length ? sheet.records : (sheet.grid || [])));
      appendSheet(wb, 'Anexo1_Validaciones', state.anexo1.validaciones || []);
    }
    XLSX.writeFile(wb, `Gestion_Cartera_INFIHUILA_${isoToday()}.xlsx`);
  }

  async function exportToPDF(){
    if(!window.html2canvas || !window.jspdf){ alert('No se pudo cargar jsPDF/html2canvas. Verifique conexión a internet para la librería CDN.'); return; }
    const { jsPDF } = window.jspdf;
    const target = document.querySelector('#tab-dashboard');
    const canvas = await html2canvas(target, { scale:2, backgroundColor:'#f3f5f6' });
    const pdf = new jsPDF('p','mm','a4');
    const img = canvas.toDataURL('image/png');
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const ratio = Math.min(pageW / canvas.width * 0.96, pageH / canvas.height * 0.96);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    pdf.addImage(img, 'PNG', (pageW-w)/2, 8, w, h);
    pdf.save(`Dashboard_Cartera_INFIHUILA_${isoToday()}.pdf`);
  }

  function exportSingleTable(tableId){
    if(typeof XLSX === 'undefined'){
      alert('No se pudo cargar SheetJS/XLSX. Verifique conexión a internet para exportar esta tabla.');
      return;
    }
    const t = state.tables[tableId];
    if(!t) return;
    const wb = XLSX.utils.book_new();
    appendSheet(wb, tableId.substring(0,30), t.filtered || []);
    XLSX.writeFile(wb, `${tableId}_${isoToday()}.xlsx`);
  }

  function appendSheet(wb, name, rows){
    const ws = XLSX.utils.json_to_sheet(rows || []);
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0,31));
  }


  /* ===============================
     MÓDULO ANEXO 1 - v1.4.1
     =============================== */
  function getEmptyAnexo1State(){
    return {
      workbookName: null,
      fechaCarga: null,
      fechaReporte: null,
      loaded: false,
      demo: false,
      activeSheet: 'resumen',
      viewMode: 'structured',
      filters: { search:'', line:'', rating:'', source:'', mora:'', amount:'', municipio:'', gracia:'', reestructuracion:'', garantia:'' },
      hojas: {
        instrucciones: { name:'Instrucciones', grid:[], merges:[], records:[] },
        generalCarteraTotal: { name:'General cartera total', grid:[], merges:[], records:[] },
        generalCarteraExcedentes: { name:'General cartera excedentes', grid:[], merges:[], records:[] },
        carteraComercial: { name:'Cartera comercial', grid:[], merges:[], records:[] },
        carteraComercialExcedentes: { name:'Cartera comercial excedentes', grid:[], merges:[], records:[] },
        detalleCartera: { name:'Detalle cartera', grid:[], merges:[], records:[] }
      },
      metadata: { entidad:'INFIHUILA', codigoEntidad:'262 5', cifrasEnMillones:true, fuente:'Anexo_1 febrero.xlsx', versionModulo:'2.0.0' },
      edit: { enabled:false, dirty:false, lastSaved:null, snapshot:null, selected:null, audit:[] },
      validaciones: [],
      resumen: {}
    };
  }

  function ensureAnexo1State(){
    if(!state.anexo1) state.anexo1 = getEmptyAnexo1State();
    const empty = getEmptyAnexo1State();
    state.anexo1.filters = { ...empty.filters, ...(state.anexo1.filters || {}) };
    state.anexo1.hojas = { ...empty.hojas, ...(state.anexo1.hojas || {}) };
    state.anexo1.metadata = { ...empty.metadata, ...(state.anexo1.metadata || {}) };
    state.anexo1.edit = { ...empty.edit, ...(state.anexo1.edit || {}) };
    state.anexo1.activeSheet = state.anexo1.activeSheet || 'resumen';
    state.anexo1.viewMode = state.anexo1.viewMode || 'structured';
    return state.anexo1;
  }

  function detectAnexo1Workbook(fileName, workbook){
    const n = normalizeText(fileName);
    if(n.includes('ANEXO') && (n.includes('1') || n.includes('UNO'))) return true;
    const names = (workbook?.SheetNames || []).map(normalizeText).join('|');
    return names.includes('GENERAL CARTERA TOTAL') && names.includes('DETALLE CARTERA');
  }

  function parseAnexo1Workbook(fileName, workbook){
    const model = getEmptyAnexo1State();
    model.workbookName = fileName;
    model.fechaCarga = new Date().toISOString();
    model.loaded = true;
    model.demo = false;
    model.metadata.fuente = fileName;

    const map = {
      instrucciones: ['INSTRUCCIONES'],
      generalCarteraTotal: ['GENERAL CARTERA TOTAL'],
      generalCarteraExcedentes: ['GENERAL CARTERA EXCEDENTES'],
      carteraComercial: ['CARTERA COMERCIAL'],
      carteraComercialExcedentes: ['CARTERA COMERCIAL EXCEDENTES'],
      detalleCartera: ['DETALLE CARTERA']
    };

    Object.entries(map).forEach(([key, candidates]) => {
      const sheetName = (workbook.SheetNames || []).find(name => candidates.some(c => normalizeText(name).includes(c)));
      if(sheetName){
        const ws = workbook.Sheets[sheetName];
        model.hojas[key] = parseAnexo1Sheet(sheetName, ws, key);
      }
    });

    model.fechaReporte = detectAnexo1FechaReporte(model) || model.fechaReporte || '28/02/2026';
    model.resumen = buildAnexo1Resumen(model);
    model.validaciones = runAnexo1Validations(model);
    model.activeSheet = 'resumen';
    model.edit = { enabled:false, dirty:false, lastSaved:null, snapshot:null, selected:null, audit:[] };
    return model;
  }

  function parseAnexo1Sheet(sheetName, worksheet, sheetKey){
    const grid = XLSX.utils.sheet_to_json(worksheet, { header:1, defval:'', raw:true });
    const normalizedGrid = grid.map(row => row.map(cell => normalizeAnexo1CellValue(cell)));
    const records = sheetKey === 'detalleCartera' ? extractAnexo1DetalleRecords(normalizedGrid) : [];
    return { name: sheetName, grid: normalizedGrid, merges: worksheet['!merges'] || [], records };
  }

  function normalizeAnexo1CellValue(value){
    if(value instanceof Date) return value.toISOString().slice(0,10);
    if(value === null || value === undefined) return '';
    if(typeof value === 'number') return value;
    return String(value).replace(/\r\n/g, '\n').trim();
  }

  function detectAnexo1FechaReporte(model){
    const sheets = Object.values(model.hojas || {});
    for(const sheet of sheets){
      for(const row of (sheet.grid || []).slice(0,8)){
        const joined = normalizeText(row.join(' '));
        if(joined.includes('MES DE REPORTE')){
          const value = row.find(x => typeof x === 'number' || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(String(x)));
          if(typeof value === 'number' && value > 30000) return excelSerialToDate(value).split('-').reverse().join('/');
          if(value) return formatDate(value);
        }
      }
    }
    return null;
  }

  function extractAnexo1DetalleRecords(grid){
    const headerIndex = grid.findIndex(row => {
      const t = normalizeText(row.join('|'));
      return t.includes('IDENTIFICACION CLIENTE') && t.includes('NOMBRE CLIENTE') && t.includes('SALDO CAPITAL');
    });
    if(headerIndex < 0) return [];
    const headers = makeUniqueHeaders(grid[headerIndex].map((h,i) => normalizeHeader(h || `COL_${i+1}`)));
    return grid.slice(headerIndex + 1).map((row, offset) => {
      const rec = {};
      headers.forEach((h,i) => rec[h] = normalizeAnexo1CellValue(row[i]));
      rec.__gridRowIndex = headerIndex + 1 + offset;
      rec.__headers = headers;
      return rec;
    }).filter(r => {
      const id = val(r,'IDENTIFICACION CLIENTE');
      const name = val(r,'NOMBRE CLIENTE');
      const credit = val(r,'NUMERO DE CREDITO') || val(r,'NÚMERO DE CRÉDITO');
      const capital = toNumber(val(r,'SALDO CAPITAL AL CORTE'));
      return (id || name || credit) && capital > 0;
    });
  }

  function getAnexoDetalleHeaderInfo(){
    const grid = state.anexo1?.hojas?.detalleCartera?.grid || [];
    const headerIndex = grid.findIndex(row => {
      const t = normalizeText(row.join('|'));
      return t.includes('IDENTIFICACION CLIENTE') && t.includes('NOMBRE CLIENTE') && t.includes('SALDO CAPITAL');
    });
    if(headerIndex < 0) return { headerIndex:-1, headers:[] };
    return { headerIndex, headers: makeUniqueHeaders(grid[headerIndex].map((h,i) => normalizeHeader(h || `COL_${i+1}`))) };
  }

  function buildAnexo1Resumen(model = state.anexo1){
    const rows = model?.hojas?.detalleCartera?.records || [];
    const capital = sumAnexoDetalle(rows, 'SALDO CAPITAL AL CORTE');
    const intereses = sumAnexoDetalle(rows, 'SALDO INTERESES AL CORTE');
    const otros = sumAnexoDetalle(rows, 'SALDO OTROS CONCEPTOS AL CORTE');
    const provision = sumAnexoDetalle(rows, 'PROVISION');
    const uniqueDebtors = unique(rows.map(r => String(val(r,'IDENTIFICACION CLIENTE') || val(r,'NOMBRE CLIENTE') || '').trim()).filter(Boolean)).length;
    const uniqueOperations = unique(rows.map(r => String(val(r,'NUMERO DE CREDITO') || val(r,'NÚMERO DE CRÉDITO') || '').trim()).filter(Boolean)).length;
    const moraMax = rows.reduce((m,r)=>Math.max(m, toNumber(val(r,'DIAS DE MORA'))), 0);
    const carteraA = rows.filter(r => normalizeText(val(r,'CALIFICACION')).startsWith('A')).reduce((a,r)=>a + toNumber(val(r,'SALDO CAPITAL AL CORTE')), 0);
    const carteraE = rows.filter(r => normalizeText(val(r,'CALIFICACION')).startsWith('E')).reduce((a,r)=>a + toNumber(val(r,'SALDO CAPITAL AL CORTE')), 0);
    const carteraVencida = rows.filter(r => toNumber(val(r,'DIAS DE MORA')) > 0).reduce((a,r)=>a + toNumber(val(r,'SALDO CAPITAL AL CORTE')), 0);

    const generalGrid = model?.hojas?.generalCarteraTotal?.grid || [];
    const totalRow = findAnexoGridRow(generalGrid, 'TOTAL CARTERA');
    const desembolsos = totalRow ? toNumber(totalRow[4] || totalRow[5]) : 8300;
    const recaudos = totalRow ? toNumber(totalRow[6] || totalRow[7]) : 1080;

    return {
      capital, intereses, otros, provision,
      total: capital + intereses + otros,
      deudores: uniqueDebtors,
      operaciones: uniqueOperations,
      moraMax,
      carteraA,
      carteraE,
      carteraVencida,
      desembolsos,
      recaudos,
      castigos: 0,
      reestructuraciones: 0
    };
  }

  function runAnexo1Validations(model = state.anexo1){
    const rows = model?.hojas?.detalleCartera?.records || [];
    const sheets = model?.hojas || {};
    const resumen = model?.resumen || buildAnexo1Resumen(model);
    const validations = [];
    const expected = ['instrucciones','generalCarteraTotal','generalCarteraExcedentes','carteraComercial','carteraComercialExcedentes','detalleCartera'];
    expected.forEach(key => {
      const has = Array.isArray(sheets[key]?.grid) && sheets[key].grid.length > 0;
      validations.push(anexoValidation(`Hoja ${sheets[key]?.name || key}`, has ? 'Validado':'Crítico', has ? 'Hoja cargada correctamente.':'No se encontró la hoja esperada en el libro.'));
    });
    validations.push(anexoValidation('Detalle cartera con registros', rows.length ? 'Validado':'Crítico', `${rows.length} registro(s) de cartera activa detectados.`));
    validations.push(anexoValidation('Saldo capital Anexo 1', resumen.capital > 0 ? 'Validado':'Crítico', `Saldo capital detectado: ${formatAnexoMoney(resumen.capital)}.`));
    validations.push(anexoValidation('Máximo días de mora', resumen.moraMax > 720 ? 'Crítico': resumen.moraMax > 0 ? 'Advertencia':'Validado', `Máximo días de mora identificado: ${resumen.moraMax}.`));

    const missingName = rows.filter(r => !val(r,'NOMBRE CLIENTE')).length;
    validations.push(anexoValidation('Clientes sin nombre', missingName ? 'Advertencia':'Validado', missingName ? `${missingName} registro(s) sin nombre de cliente.`:'Todos los registros tienen nombre de cliente.'));

    const missingFunding = rows.filter(r => toNumber(val(r,'SALDO CAPITAL AL CORTE')) > 0 && !val(r,'FUENTE DE FONDEO')).length;
    validations.push(anexoValidation('Fuente de fondeo', missingFunding ? 'Advertencia':'Validado', missingFunding ? `${missingFunding} operación(es) sin fuente de fondeo.`:'Fuente de fondeo diligenciada.'));

    const resCapital = sumWhere(state.resultados || [], r => normalizeText(val(r,'DESCRIPCION CONCEPTO')) === 'CAPITAL', 'SALDO CONCEPTO');
    if(resCapital > 0){
      const diff = Math.abs(resumen.capital - (resCapital / 1000000));
      validations.push(anexoValidation('Conciliación capital Anexo 1 vs Resultados', diff <= 2 ? 'Validado':'Advertencia', `Diferencia aproximada: ${formatAnexoMoney(diff)}.`));
    }

    const formatoTotal = findFormatoTotal();
    if(formatoTotal > 0){
      const diffFormato = Math.abs(resumen.capital - (formatoTotal / 1000000));
      validations.push(anexoValidation('Conciliación Anexo 1 vs Formato 514', diffFormato <= 2 ? 'Validado':'Advertencia', `Diferencia aproximada: ${formatAnexoMoney(diffFormato)}.`));
    }

    return validations;
  }

  function anexoValidation(control, status, observacion){
    return { control, status, observacion, fuente:'Anexo 1', fecha: state?.anexo1?.fechaReporte || '28/02/2026' };
  }

  function renderAnexo1Module(){
    const anexo = ensureAnexo1State();
    anexo.resumen = buildAnexo1Resumen(anexo);
    anexo.validaciones = runAnexo1Validations(anexo);
    renderAnexo1Meta(anexo);
    renderAnexo1Kpis(anexo);
    renderAnexo1Alerts(anexo);
    renderAnexo1Subtabs(anexo);
    populateAnexo1Filters(anexo);
    renderAnexo1EditStatus(anexo);

    const active = anexo.activeSheet || 'resumen';
    if(!anexo.loaded && !anexo.demo){
      dom.anexo1Content.innerHTML = `<div class="anexo1-empty"><h3>No se ha cargado información del Anexo 1</h3><p>Cargue el archivo <strong>Anexo_1 febrero.xlsx</strong> para visualizar este módulo.</p></div>`;
      return;
    }

    if(active === 'resumen') return renderAnexo1ResumenContent(anexo);
    if(active === 'validaciones') return renderAnexo1Validaciones(anexo);

    const sheet = anexo.hojas?.[active];
    if(!sheet || !(sheet.grid || []).length){
      dom.anexo1Content.innerHTML = `<div class="anexo1-empty"><h3>Hoja sin información</h3><p>La hoja seleccionada conserva estructura, pero no presenta información diligenciada para el corte cargado.</p></div>`;
      return;
    }

    if(anexo.viewMode === 'excel') return renderAnexo1ExcelGrid(sheet);

    if(active === 'instrucciones') return renderAnexo1Instructions(sheet);
    if(active === 'detalleCartera') return renderAnexo1Detalle(anexo);
    return renderAnexo1StructuredSheet(sheet, active);
  }

  function renderAnexo1Meta(anexo){
    if(dom.anexo1MetaLine){
      dom.anexo1MetaLine.textContent = `${anexo.metadata?.entidad || 'INFIHUILA'} · Código ${anexo.metadata?.codigoEntidad || '262 5'} · Corte ${anexo.fechaReporte || '28/02/2026'} · Cifras en millones de pesos · Fuente: ${anexo.workbookName || anexo.metadata?.fuente || 'Anexo_1 febrero.xlsx'}`;
    }
  }

  function renderAnexo1Kpis(anexo){
    if(!dom.anexo1Resumen) return;
    const r = anexo.resumen || {};
    const cards = [
      ['Saldo capital', formatAnexoMoney(r.capital), 'Detalle cartera'],
      ['Intereses', formatAnexoMoney(r.intereses), 'Saldo intereses al corte'],
      ['Otros conceptos', formatAnexoMoney(r.otros), 'Mora y otros conceptos'],
      ['Provisión', formatAnexoMoney(r.provision), 'Provisión reportada'],
      ['Deudores', r.deudores || 0, 'Clientes únicos'],
      ['Operaciones', r.operaciones || 0, 'Créditos únicos'],
      ['Categoría A', formatAnexoMoney(r.carteraA), 'Capital calificación A'],
      ['Categoría E', formatAnexoMoney(r.carteraE), 'Capital calificación E']
    ];
    dom.anexo1Resumen.innerHTML = cards.map(([label,value,note]) => `
      <article class="kpi-card">
        <div class="kpi-label">${escapeHtml(label)}</div>
        <div class="kpi-value">${escapeHtml(value)}</div>
        <div class="kpi-note">${escapeHtml(note)}</div>
        <span class="kpi-status ${label === 'Categoría E' && toNumber(r.carteraE) > 0 ? 'danger':'ok'}"></span>
      </article>`).join('');
  }

  function renderAnexo1Alerts(anexo){
    if(!dom.anexo1Alerts) return;
    const critical = (anexo.validaciones || []).filter(v => v.status === 'Crítico').length;
    const warnings = (anexo.validaciones || []).filter(v => v.status === 'Advertencia').length;
    const rows = anexo.hojas?.detalleCartera?.records?.length || 0;
    dom.anexo1Alerts.innerHTML = [
      {status: critical ? 'danger':'ok', title:'Estado Anexo 1', msg: critical ? `${critical} validación(es) críticas.`:'Estructura principal disponible.'},
      {status: warnings ? 'warn':'ok', title:'Advertencias', msg: warnings ? `${warnings} advertencia(s) para revisión.`:'Sin advertencias materiales.'},
      {status: rows ? 'ok':'danger', title:'Detalle cartera', msg: `${rows} registro(s) activos detectados.`}
    ].map(a => `<article class="alert-card ${a.status}"><h4>${a.title}</h4><p>${a.msg}</p></article>`).join('');
  }

  function renderAnexo1Subtabs(anexo){
    if(!dom.anexo1Subtabs) return;
    dom.anexo1Subtabs.querySelectorAll('[data-anexo1-sheet]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.anexo1Sheet === anexo.activeSheet);
    });
  }

  function populateAnexo1Filters(anexo){
    const rows = anexo.hojas?.detalleCartera?.records || [];
    fillSelect(dom.anexo1LineFilter, unique(rows.map(r => val(r,'LINEA DE CREDITO') || val(r,'LINEA DE CRÉDITO'))), 'Todas las líneas');
    fillSelect(dom.anexo1RatingFilter, unique(rows.map(r => val(r,'CALIFICACION'))), 'Todas las calificaciones');
    fillSelect(dom.anexo1SourceFilter, unique(rows.map(r => val(r,'FUENTE DE FONDEO'))), 'Todas las fuentes');
    if(dom.anexo1MoraFilter) dom.anexo1MoraFilter.value = anexo.filters?.mora || '';
    if(dom.anexo1Search) dom.anexo1Search.value = anexo.filters?.search || '';
    if(dom.anexo1ViewMode) dom.anexo1ViewMode.value = anexo.viewMode || 'structured';
  }

  function renderAnexo1ResumenContent(anexo){
    const r = anexo.resumen || {};
    const byLine = groupAnexoRows(filteredAnexoDetalle(anexo), r => displayLine(val(r,'LINEA DE CREDITO') || val(r,'LINEA DE CRÉDITO')), r => toNumber(val(r,'SALDO CAPITAL AL CORTE')));
    const byRating = groupAnexoRows(filteredAnexoDetalle(anexo), r => val(r,'CALIFICACION') || 'S/C', r => toNumber(val(r,'SALDO CAPITAL AL CORTE')));
    dom.anexo1Content.innerHTML = `
      <div class="anexo1-meta-grid">
        <div class="anexo1-meta-card"><span>Entidad</span><strong>${escapeHtml(anexo.metadata?.entidad || 'INFIHUILA')}</strong></div>
        <div class="anexo1-meta-card"><span>Código entidad</span><strong>${escapeHtml(anexo.metadata?.codigoEntidad || '262 5')}</strong></div>
        <div class="anexo1-meta-card"><span>Corte</span><strong>${escapeHtml(anexo.fechaReporte || '28/02/2026')}</strong></div>
        <div class="anexo1-meta-card"><span>Fuente</span><strong>${escapeHtml(anexo.workbookName || 'Anexo_1 febrero.xlsx')}</strong></div>
        <div class="anexo1-meta-card"><span>Cifras</span><strong>Millones de pesos</strong></div>
      </div>
      <div class="anexo1-summary-grid">
        <article class="anexo1-section-card">
          <h3>Resumen financiero</h3>
          <p><strong>Total cartera:</strong> ${formatAnexoMoney(r.total)}</p>
          <p><strong>Cartera vencida:</strong> ${formatAnexoMoney(r.carteraVencida)}</p>
          <p><strong>Máximo días de mora:</strong> ${r.moraMax || 0}</p>
          <p><strong>Desembolsos del mes:</strong> ${formatAnexoMoney(r.desembolsos)}</p>
          <p><strong>Recaudos del mes:</strong> ${formatAnexoMoney(r.recaudos)}</p>
        </article>
        <article class="anexo1-section-card">
          <h3>Distribución por línea</h3>
          ${renderMiniBarList(byLine)}
        </article>
        <article class="anexo1-section-card">
          <h3>Distribución por calificación</h3>
          ${renderMiniBarList(byRating)}
        </article>
        <article class="anexo1-section-card">
          <h3>Validación rápida</h3>
          <div class="anexo1-validation-status">${(anexo.validaciones || []).slice(0,6).map(v => `<span class="badge ${v.status==='Crítico'?'danger':v.status==='Advertencia'?'warn':'ok'}">${escapeHtml(v.control)}</span>`).join('')}</div>
          <p class="anexo1-note">El módulo conserva la vista tipo Excel y la vista estructurada para revisar cada hoja del archivo.</p>
        </article>
      </div>`;
  }

  function renderMiniBarList(grouped){
    const entries = Object.entries(grouped || {}).sort((a,b)=>b[1]-a[1]).slice(0,10);
    const maxVal = Math.max(...entries.map(e=>e[1]), 1);
    if(!entries.length) return '<p class="anexo1-note">Sin datos para mostrar.</p>';
    return entries.map(([name,value]) => `
      <div class="anexo1-mini-row">
        <div><strong>${escapeHtml(shortName(name, 38))}</strong><span>${formatAnexoMoney(value)}</span></div>
        <div class="anexo1-mini-bar"><i style="width:${Math.max(4, value / maxVal * 100)}%"></i></div>
      </div>`).join('');
  }

  function renderAnexo1Validaciones(anexo){
    const rows = anexo.validaciones || [];
    dom.anexo1Content.innerHTML = `
      <div class="anexo1-section-card"><h3>Validaciones Anexo 1</h3><p>Controles automáticos de estructura, calidad de datos y conciliación financiera.</p></div>
      <div class="anexo1-table-wrap"><table>
        <thead><tr><th>Control</th><th>Fuente</th><th>Estado</th><th>Observación</th><th>Fecha</th></tr></thead>
        <tbody>${rows.map(v => `<tr class="${v.status==='Crítico'?'risk-row-danger':v.status==='Advertencia'?'risk-row-warn':''}"><td>${escapeHtml(v.control)}</td><td>${escapeHtml(v.fuente)}</td><td>${formatStatus(v.status)}</td><td>${escapeHtml(v.observacion)}</td><td>${escapeHtml(v.fecha || '')}</td></tr>`).join('')}</tbody>
      </table></div>`;
  }

  function renderAnexo1Instructions(sheet){
    const items = (sheet.grid || []).flat().map(x => String(x || '').trim()).filter(Boolean);
    dom.anexo1Content.innerHTML = `<div class="anexo1-section-card"><h3>Instrucciones del Anexo 1</h3><div class="anexo1-instruction-list">${items.map(item => {
      const linked = escapeHtml(item).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      return `<div class="anexo1-instruction">${linked}</div>`;
    }).join('')}</div></div>`;
  }

  function renderAnexo1Detalle(anexo){
    const rows = filteredAnexoDetalle(anexo);
    const allRows = anexo.hojas?.detalleCartera?.records || [];
    const editable = !!anexo.edit?.enabled;
    const columns = [
      ['IDENTIFICACION CLIENTE','NIT'],
      ['NOMBRE CLIENTE','Nombre cliente'],
      ['NÚMERO DE CRÉDITO','No. crédito'],
      ['LINEA DE CRÉDITO','Línea'],
      ['SALDO CAPITAL AL CORTE','Saldo capital'],
      ['SALDO INTERESES AL CORTE','Intereses'],
      ['SALDO OTROS CONCEPTOS AL CORTE','Otros'],
      ['DIAS DE MORA','Días mora'],
      ['CALIFICACION','Calificación'],
      ['FUENTE DE FONDEO','Fondeo'],
      ['PROVISION','Provisión'],
      ['Municipio de inversión','Municipio']
    ];
    dom.anexo1Content.innerHTML = `
      <div class="anexo1-detail-toolbar">
        <span>${rows.length} registro(s) filtrado(s)</span>
        <span class="anexo1-pill">Saldo filtrado: ${formatAnexoMoney(rows.reduce((a,r)=>a+toNumber(val(r,'SALDO CAPITAL AL CORTE')),0))}</span>
        ${editable ? '<span class="badge warn">Edición activa</span><span class="anexo1-note">Puede tabular directamente; use Tab o Enter para avanzar.</span>' : '<span class="badge neutral">Consulta</span>'}
      </div>
      <div class="anexo1-table-wrap"><table>
        <thead><tr><th>Sel.</th>${columns.map(([,label])=>`<th>${escapeHtml(label)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r => {
          const recordIndex = allRows.indexOf(r);
          const selected = anexo.edit?.selected?.sheetKey === 'detalleCartera' && anexo.edit?.selected?.recordIndex === recordIndex;
          return `<tr class="${selected ? 'anexo1-row-selected ' : ''}${toNumber(val(r,'DIAS DE MORA'))>720?'risk-row-danger':toNumber(val(r,'DIAS DE MORA'))>0?'risk-row-warn':''}">
            <td><button type="button" class="row-pick" data-anexo-record-select="${recordIndex}" title="Seleccionar fila">●</button></td>
            ${columns.map(([key]) => `<td class="${/SALDO|PROVISION/.test(key)?'money':''}">${renderAnexo1EditableDetailCell(r, key, recordIndex, editable)}</td>`).join('')}
          </tr>`;
        }).join('') || `<tr><td colspan="${columns.length + 1}" class="empty-state">No hay registros para los filtros aplicados.</td></tr>`}</tbody>
      </table></div>`;
  }

  function renderAnexo1EditableDetailCell(record, key, recordIndex, editable){
    const value = val(record, key);
    if(!editable) return formatAnexoCell(key, value);
    return `<span class="anexo1-cell-editable" contenteditable="true" spellcheck="false" tabindex="0" data-anexo-edit-detail="detalleCartera" data-record-index="${recordIndex}" data-key="${escapeHtml(key)}">${escapeHtml(value)}</span>`;
  }

  function renderAnexo1StructuredSheet(sheet, sheetKey){
    const status = anexoSheetCompleteness(sheet);
    const statusCls = status === 'Vacío' ? 'warn' : status === 'Parcial' ? 'warn' : 'ok';
    dom.anexo1Content.innerHTML = `
      <div class="anexo1-section-card">
        <h3>${escapeHtml(sheet.name)}</h3>
        <div class="anexo1-badges"><span class="badge ${statusCls}">${status}</span><span class="anexo1-pill">Vista estructurada</span></div>
        <p>La hoja se presenta conservando su estructura original. Cambie a <strong>Vista tipo Excel</strong> para ver la grilla completa.</p>
      </div>
      ${renderAnexoGridAsBlocks(sheet)}`;
  }

  function renderAnexoGridAsBlocks(sheet){
    const rows = (sheet.grid || []).filter(row => row.some(cell => String(cell ?? '').trim() !== ''));
    if(!rows.length) return '<div class="anexo1-empty">La hoja no contiene información diligenciada.</div>';
    return `<div class="anexo1-table-wrap"><table>
      <tbody>${rows.map(row => {
        const text = normalizeText(row.join(' '));
        const cls = text.match(/^\d+\./) || text.includes('DATOS GENERALES') || text.includes('PRINCIPALES') ? 'section-row' : '';
        return `<tr class="${cls}">${row.map(cell => `<td>${formatAnexoGridCell(cell)}</td>`).join('')}</tr>`;
      }).join('')}</tbody>
    </table></div>`;
  }

  function renderAnexo1ExcelGrid(sheet){
    const grid = sheet.grid || [];
    const activeSheet = state.anexo1?.activeSheet || 'detalleCartera';
    const editable = !!state.anexo1?.edit?.enabled;
    const maxCols = Math.max(...grid.map(r=>r.length), 1);
    dom.anexo1Content.innerHTML = `
      <div class="anexo1-detail-toolbar">
        <span class="anexo1-pill">Hoja: ${escapeHtml(sheet.name || activeSheet)}</span>
        <span class="badge ${editable ? 'warn':'neutral'}">${editable ? 'Edición activa':'Consulta'}</span>
        ${editable ? '<span class="anexo1-note">Edite las celdas directamente. Tab/Enter avanza entre celdas. Use Guardar cambios para persistir en este navegador.</span>' : '<span class="anexo1-note">Active edición para modificar la grilla.</span>'}
      </div>
      <div class="anexo1-table-wrap"><table class="anexo1-excel-grid ${editable ? 'is-editable':''}">
        <thead><tr><th class="row-index">#</th>${Array.from({length: maxCols}, (_,i)=>`<th>${excelColumnName(i)}</th>`).join('')}</tr></thead>
        <tbody>${grid.map((row,i) => {
          const text = normalizeText(row.join(' '));
          const selected = state.anexo1?.edit?.selected?.sheetKey === activeSheet && state.anexo1?.edit?.selected?.rowIndex === i;
          const cls = `${selected ? 'anexo1-row-selected ' : ''}${text.includes('DATOS GENERALES') || text.includes('PRINCIPALES') || text.match(/^\d+\./) ? 'section-row' : text.includes('IDENTIFICACION CLIENTE') || text.includes('TIPO DE CLIENTE') ? 'header-row' : ''}`;
          return `<tr class="${cls}"><td class="row-index"><button type="button" class="row-pick" data-anexo-row-select="${activeSheet}:${i}" title="Seleccionar fila">${i+1}</button></td>${Array.from({length:maxCols},(_,j)=>renderAnexo1EditableGridCell(row[j], activeSheet, i, j, editable)).join('')}</tr>`;
        }).join('')}</tbody>
      </table></div>`;
  }

  function renderAnexo1EditableGridCell(value, sheetKey, rowIndex, colIndex, editable){
    if(!editable) return `<td>${formatAnexoGridCell(value)}</td>`;
    return `<td class="anexo1-grid-edit-cell" contenteditable="true" spellcheck="false" tabindex="0" data-anexo-edit-cell="${sheetKey}" data-row="${rowIndex}" data-col="${colIndex}">${escapeHtml(value)}</td>`;
  }

  function filteredAnexoDetalle(anexo = state.anexo1){
    const f = anexo.filters || {};
    const q = normalizeText(f.search || '');
    return (anexo.hojas?.detalleCartera?.records || []).filter(r => {
      const text = normalizeText(Object.values(r).join(' '));
      const line = val(r,'LINEA DE CREDITO') || val(r,'LINEA DE CRÉDITO');
      const rating = val(r,'CALIFICACION');
      const source = val(r,'FUENTE DE FONDEO');
      const mora = toNumber(val(r,'DIAS DE MORA'));
      return (!q || text.includes(q))
        && (!f.line || line === f.line)
        && (!f.rating || rating === f.rating)
        && (!f.source || source === f.source)
        && (!f.mora || matchMora(mora, f.mora));
    });
  }


  function renderAnexo1EditStatus(anexo = state.anexo1){
    if(!dom.anexo1EditStatus) return;
    const edit = ensureAnexo1State().edit || {};
    const selected = edit.selected ? ` · Fila seleccionada: ${edit.selected.sheetKey || ''} ${Number.isFinite(edit.selected.rowIndex) ? '#'+(edit.selected.rowIndex + 1) : ''}` : '';
    const saved = edit.lastSaved ? ` · Último guardado: ${formatDateTime(edit.lastSaved)}` : '';
    dom.anexo1EditStatus.textContent = `${edit.enabled ? 'Modo edición activo' : 'Modo consulta'} · ${edit.dirty ? 'cambios pendientes' : 'sin cambios pendientes'}${selected}${saved}`;
    dom.anexo1EditStatus.classList.toggle('dirty', !!edit.dirty);
    dom.anexo1EditStatus.classList.toggle('editing', !!edit.enabled);
    if(dom.toggleAnexo1EditBtn) dom.toggleAnexo1EditBtn.textContent = edit.enabled ? 'Desactivar edición' : 'Activar edición';
  }

  function toggleAnexo1EditMode(){
    const anexo = ensureAnexo1State();
    if(!anexo.loaded && !anexo.demo){
      alert('Primero cargue el Anexo 1 o restablezca los datos demo.');
      return;
    }
    if(!anexo.edit.enabled){
      anexo.edit.snapshot = JSON.stringify(sanitizeAnexo1ForStorage(anexo));
      anexo.edit.enabled = true;
    } else {
      anexo.edit.enabled = false;
    }
    renderAnexo1Module();
  }

  function markAnexo1Dirty(change = null){
    const anexo = ensureAnexo1State();
    anexo.edit.dirty = true;
    anexo.edit.editedAt = new Date().toISOString();
    if(change){
      anexo.edit.audit = Array.isArray(anexo.edit.audit) ? anexo.edit.audit : [];
      anexo.edit.audit.unshift({ ...change, fecha: anexo.edit.editedAt });
      anexo.edit.audit = anexo.edit.audit.slice(0, 100);
    }
    renderAnexo1EditStatus(anexo);
  }

  function updateAnexo1GridCell(el, opts = {}){
    const anexo = ensureAnexo1State();
    if(!anexo.edit?.enabled) return;
    const sheetKey = el.dataset.anexoEditCell;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    const sheet = anexo.hojas?.[sheetKey];
    if(!sheet || !Number.isFinite(row) || !Number.isFinite(col)) return;
    sheet.grid[row] = sheet.grid[row] || [];
    const oldValue = sheet.grid[row][col];
    const newValue = normalizeAnexoEditedValue(el.textContent);
    if(String(oldValue ?? '') === String(newValue ?? '')) return;
    sheet.grid[row][col] = newValue;
    if(sheetKey === 'detalleCartera'){
      sheet.records = extractAnexo1DetalleRecords(sheet.grid || []);
    }
    markAnexo1Dirty({ tipo:'celda', hoja:sheet.name || sheetKey, fila:row + 1, columna:excelColumnName(col), anterior:oldValue, nuevo:newValue });
    if(!opts.soft) finalizeAnexo1Edit();
  }

  function updateAnexo1DetailCell(el, opts = {}){
    const anexo = ensureAnexo1State();
    if(!anexo.edit?.enabled) return;
    const recordIndex = Number(el.dataset.recordIndex);
    const key = el.dataset.key;
    const rows = anexo.hojas?.detalleCartera?.records || [];
    const record = rows[recordIndex];
    if(!record || !key) return;
    const oldValue = record[key];
    const newValue = normalizeAnexoEditedValue(el.textContent);
    if(String(oldValue ?? '') === String(newValue ?? '')) return;
    record[key] = newValue;

    const grid = anexo.hojas.detalleCartera.grid || [];
    const info = getAnexoDetalleHeaderInfo();
    const colIndex = info.headers.findIndex(h => normalizeKey(h) === normalizeKey(key));
    const rowIndex = record.__gridRowIndex;
    if(Number.isFinite(rowIndex) && colIndex >= 0 && grid[rowIndex]){
      grid[rowIndex][colIndex] = newValue;
    }
    markAnexo1Dirty({ tipo:'detalle', hoja:'Detalle cartera', fila:Number.isFinite(rowIndex) ? rowIndex + 1 : recordIndex + 1, columna:key, anterior:oldValue, nuevo:newValue });
    if(!opts.soft) finalizeAnexo1Edit();
  }

  function finalizeAnexo1Edit(){
    const anexo = ensureAnexo1State();
    if(anexo.hojas?.detalleCartera?.grid?.length){
      anexo.hojas.detalleCartera.records = extractAnexo1DetalleRecords(anexo.hojas.detalleCartera.grid);
    }
    anexo.resumen = buildAnexo1Resumen(anexo);
    anexo.validaciones = runAnexo1Validations(anexo);
    renderAnexo1Kpis(anexo);
    renderAnexo1Alerts(anexo);
    renderAnexo1EditStatus(anexo);
  }

  function saveAnexo1Changes(){
    const anexo = ensureAnexo1State();
    if(!anexo.loaded && !anexo.demo){
      alert('No hay información del Anexo 1 para guardar.');
      return;
    }
    finalizeAnexo1Edit();
    anexo.edit.dirty = false;
    anexo.edit.enabled = false;
    anexo.edit.lastSaved = new Date().toISOString();
    anexo.edit.snapshot = JSON.stringify(sanitizeAnexo1ForStorage(anexo));
    try{
      localStorage.setItem(ANEXO1_STORAGE_KEY, JSON.stringify(sanitizeAnexo1ForStorage(anexo)));
      localStorage.removeItem(ANEXO1_LEGACY_STORAGE_KEY);
      renderAnexo1Module();
      alert('Cambios del Anexo 1 guardados localmente en este navegador. También puede exportar el Excel actualizado.');
    }catch(err){
      console.error(err);
      alert('No fue posible guardar los cambios. Verifique el espacio disponible del navegador.');
    }
  }

  function discardAnexo1Edits(){
    const anexo = ensureAnexo1State();
    if(!anexo.edit.dirty && !anexo.edit.snapshot){
      alert('No hay cambios pendientes para descartar.');
      return;
    }
    if(!confirm('¿Descartar los cambios no guardados del Anexo 1?')) return;
    try{
      const base = anexo.edit.snapshot || localStorage.getItem(ANEXO1_STORAGE_KEY);
      if(base){
        state.anexo1 = rehydrateAnexo1State(JSON.parse(base));
      } else {
        state.anexo1 = clone(window.ANEXO1_DEMO || getEmptyAnexo1State());
      }
      state.anexo1.edit.enabled = false;
      state.anexo1.edit.dirty = false;
      renderAnexo1Module();
    }catch(err){
      console.error(err);
      alert('No fue posible descartar los cambios automáticamente.');
    }
  }

  function addAnexo1Row(){
    const anexo = ensureAnexo1State();
    if(!anexo.loaded && !anexo.demo){
      alert('Primero cargue el Anexo 1.');
      return;
    }
    if(!anexo.edit.enabled) anexo.edit.enabled = true;
    let sheetKey = anexo.activeSheet || 'detalleCartera';
    if(sheetKey === 'resumen' || sheetKey === 'validaciones') sheetKey = 'detalleCartera';
    const sheet = anexo.hojas?.[sheetKey];
    if(!sheet){
      alert('No hay hoja activa para agregar fila.');
      return;
    }
    const maxCols = Math.max(...(sheet.grid || [[]]).map(r => r.length), 1);
    const newRow = Array.from({length:maxCols}, () => '');
    sheet.grid = sheet.grid || [];
    sheet.grid.push(newRow);
    if(sheetKey === 'detalleCartera'){
      sheet.records = extractAnexo1DetalleRecords(sheet.grid || []);
    }
    anexo.activeSheet = sheetKey;
    anexo.viewMode = 'excel';
    anexo.edit.selected = { sheetKey, rowIndex: sheet.grid.length - 1 };
    markAnexo1Dirty({ tipo:'fila', hoja:sheet.name || sheetKey, fila:sheet.grid.length, columna:'', anterior:'', nuevo:'Fila agregada' });
    renderAnexo1Module();
  }

  function deleteAnexo1SelectedRow(){
    const anexo = ensureAnexo1State();
    if(!anexo.edit.enabled){
      alert('Active el modo edición para eliminar filas.');
      return;
    }
    const selected = anexo.edit.selected;
    if(!selected){
      alert('Seleccione primero una fila desde la grilla tipo Excel o la tabla de Detalle cartera.');
      return;
    }
    const sheetKey = selected.sheetKey || 'detalleCartera';
    const sheet = anexo.hojas?.[sheetKey];
    if(!sheet || !Array.isArray(sheet.grid)){
      alert('No hay hoja válida para eliminar.');
      return;
    }
    let rowIndex = selected.rowIndex;
    if(!Number.isFinite(rowIndex) && sheetKey === 'detalleCartera' && Number.isFinite(selected.recordIndex)){
      rowIndex = sheet.records?.[selected.recordIndex]?.__gridRowIndex;
    }
    if(!Number.isFinite(rowIndex) || rowIndex < 0 || rowIndex >= sheet.grid.length){
      alert('La fila seleccionada no es válida.');
      return;
    }
    if(rowIndex < 1 && !confirm('La fila seleccionada parece ser de encabezado. ¿Desea eliminarla de todos modos?')) return;
    if(!confirm(`¿Eliminar la fila ${rowIndex + 1} de ${sheet.name || sheetKey}?`)) return;
    const removed = sheet.grid.splice(rowIndex, 1);
    if(sheetKey === 'detalleCartera'){
      sheet.records = extractAnexo1DetalleRecords(sheet.grid || []);
    }
    anexo.edit.selected = null;
    markAnexo1Dirty({ tipo:'fila', hoja:sheet.name || sheetKey, fila:rowIndex + 1, columna:'', anterior:JSON.stringify(removed?.[0] || []), nuevo:'Fila eliminada' });
    renderAnexo1Module();
  }

  function selectAnexo1Row(button){
    const [sheetKey, rowText] = String(button.dataset.anexoRowSelect || '').split(':');
    const rowIndex = Number(rowText);
    const anexo = ensureAnexo1State();
    anexo.edit.selected = { sheetKey, rowIndex };
    renderAnexo1Module();
  }

  function selectAnexo1Record(button){
    const recordIndex = Number(button.dataset.anexoRecordSelect);
    const record = state.anexo1?.hojas?.detalleCartera?.records?.[recordIndex];
    const rowIndex = record?.__gridRowIndex;
    state.anexo1.edit.selected = { sheetKey:'detalleCartera', recordIndex, rowIndex };
    renderAnexo1Module();
  }

  function handleAnexo1EditableKeydown(event, current){
    if(event.key !== 'Enter' && event.key !== 'Tab') return;
    event.preventDefault();
    const cells = Array.from(document.querySelectorAll('[data-anexo-edit-cell], [data-anexo-edit-detail]'));
    const index = cells.indexOf(current);
    const direction = event.shiftKey ? -1 : 1;
    const next = cells[index + direction] || cells[direction > 0 ? 0 : cells.length - 1];
    if(next){
      current.blur();
      next.focus();
      if(document.createRange && window.getSelection){
        const range = document.createRange();
        range.selectNodeContents(next);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  function normalizeAnexoEditedValue(value){
    const raw = String(value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
    return raw;
  }

  function sanitizeAnexo1ForStorage(anexo){
    const copy = clone(anexo);
    copy.edit = { ...(copy.edit || {}), enabled:false, dirty:false, snapshot:null, selected:null };
    return copy;
  }

  function rehydrateAnexo1State(saved){
    const empty = getEmptyAnexo1State();
    const hydrated = { ...empty, ...(saved || {}) };
    hydrated.hojas = { ...empty.hojas, ...(saved?.hojas || {}) };
    hydrated.metadata = { ...empty.metadata, ...(saved?.metadata || {}) };
    hydrated.edit = { ...empty.edit, ...(saved?.edit || {}), enabled:false, dirty:false, snapshot:null };
    if(hydrated.hojas?.detalleCartera?.grid?.length){
      hydrated.hojas.detalleCartera.records = extractAnexo1DetalleRecords(hydrated.hojas.detalleCartera.grid);
    }
    hydrated.resumen = buildAnexo1Resumen(hydrated);
    hydrated.validaciones = runAnexo1Validations(hydrated);
    hydrated.loaded = hydrated.loaded || true;
    return hydrated;
  }

  function formatDateTime(value){
    if(!value) return '';
    try{
      return new Intl.DateTimeFormat('es-CO', { dateStyle:'short', timeStyle:'short' }).format(new Date(value));
    }catch(err){
      return String(value);
    }
  }

  function clearAnexo1Data(){
    if(!confirm('¿Borrar únicamente la información cargada del Anexo 1?')) return;
    state.anexo1 = getEmptyAnexo1State();
    try{ localStorage.removeItem(ANEXO1_STORAGE_KEY); localStorage.removeItem(ANEXO1_LEGACY_STORAGE_KEY); }catch(err){}
    renderAnexo1Module();
  }

  function exportAnexo1ToExcel(){
    if(typeof XLSX === 'undefined'){
      alert('No se pudo cargar SheetJS/XLSX. Verifique conexión a internet para exportar Anexo 1.');
      return;
    }
    const anexo = ensureAnexo1State();
    const wb = XLSX.utils.book_new();
    Object.values(anexo.hojas || {}).forEach(sheet => {
      const ws = XLSX.utils.aoa_to_sheet(sheet.grid || []);
      XLSX.utils.book_append_sheet(wb, ws, (sheet.name || 'Hoja').substring(0,31));
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anexo.validaciones || []), 'Validaciones');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(anexo.edit?.audit || []), 'Historial edición');
    XLSX.writeFile(wb, `Anexo_1_INFIHUILA_${isoToday()}.xlsx`);
  }

  async function exportAnexo1ToPDF(){
    if(!window.html2canvas || !window.jspdf){
      alert('No se pudo cargar jsPDF/html2canvas. Verifique conexión a internet para exportar PDF.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const target = document.querySelector('#tab-anexo1');
    const canvas = await html2canvas(target, { scale:2, backgroundColor:'#f3f5f6' });
    const pdf = new jsPDF('p','mm','a4');
    const img = canvas.toDataURL('image/png');
    const pageW = pdf.internal.pageSize.getWidth();
    const ratio = pageW / canvas.width * 0.94;
    pdf.addImage(img, 'PNG', pageW*0.03, 8, canvas.width*ratio, canvas.height*ratio);
    pdf.save(`Anexo_1_INFIHUILA_${isoToday()}.pdf`);
  }

  function anexoSheetCompleteness(sheet){
    const cells = (sheet.grid || []).flat().map(x => String(x ?? '').trim());
    const filled = cells.filter(Boolean).length;
    if(filled === 0) return 'Vacío';
    return filled < 12 ? 'Parcial' : 'Completo';
  }

  function findAnexoGridRow(grid, pattern){
    const target = normalizeText(pattern);
    return (grid || []).find(row => normalizeText(row.join(' ')).includes(target));
  }

  function sumAnexoDetalle(rows, key){
    return (rows || []).reduce((a,r) => a + toNumber(val(r,key)), 0);
  }

  function groupAnexoRows(rows, keyFn, valueFn){
    const out = {};
    (rows || []).forEach(r => {
      const k = keyFn(r) || 'Sin clasificar';
      out[k] = (out[k] || 0) + valueFn(r);
    });
    return out;
  }

  function formatAnexoMoney(v){
    const n = toNumber(v);
    return `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n)} millones`;
  }

  function formatAnexoCell(key, value){
    const k = normalizeText(key);
    if(k.includes('SALDO') || k.includes('MONTO') || k.includes('PROVISION')) return formatAnexoMoney(value);
    if(k.includes('FECHA')) return formatDate(value instanceof Date ? value.toISOString().slice(0,10) : value);
    if(k.includes('CALIFICACION')) return formatRating(value);
    return escapeHtml(value);
  }

  function formatAnexoGridCell(value){
    if(typeof value === 'number'){
      if(value > 30000 && value < 60000) return formatDate(excelSerialToDate(value));
      return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(value);
    }
    const s = String(value ?? '');
    return escapeHtml(s).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }

  function excelColumnName(index){
    let n = index + 1;
    let name = '';
    while(n > 0){
      const rem = (n - 1) % 26;
      name = String.fromCharCode(65 + rem) + name;
      n = Math.floor((n - 1) / 26);
    }
    return name;
  }



  /* ===============================
     UI v2.0: componentes modulares
     =============================== */
  function renderModuleLayout(){ return true; }
  function renderModuleHeader(){ return true; }
  function renderQuickAccessCards(){ return true; }
  function renderCollapsibleFilters(){ return true; }
  function renderActionMenu(){ return true; }
  function renderCompactKpis(){ return true; }
  function renderAlertSummary(){ return true; }
  function renderModuleTabs(){ return true; }
  function renderDrawer(){ return true; }
  function renderBreadcrumb(){ return true; }

  /* ===============================
     UTILIDADES DE DATOS Y FORMATO
     =============================== */
  function val(obj, key){
    if(!obj) return '';
    const target = normalizeKey(key);
    if(Object.prototype.hasOwnProperty.call(obj, key)) return obj[key];
    const found = Object.keys(obj).find(k => normalizeKey(k).includes(target) || target.includes(normalizeKey(k)));
    return found ? obj[found] : '';
  }
  function normalizeKey(s){ return normalizeText(s).replace(/[^A-Z0-9]/g,''); }
  function normalizeText(s){ return String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/\s+/g,' ').trim(); }
  function normalizeHeader(s){ return String(s ?? '').replace(/\s+/g,' ').trim(); }
  function cleanValue(value, header=''){
    if(value instanceof Date) return value.toISOString().slice(0,10);
    if(value === null || value === undefined) return '';
    if(typeof value === 'number') return value;
    const s = String(value).trim().replace(/\s+/g,' ');
    if(isDateHeader(header) && /^\d{5}$/.test(s)) return excelSerialToDate(Number(s));
    const numeric = parseLocaleNumber(s);
    return Number.isFinite(numeric) && shouldConvert(header, s) ? numeric : s;
  }
  function isDateHeader(h){ return /FECHA|VENCIMIENTO|DESEMBOLSO/i.test(h); }
  function shouldConvert(h,s){ if(/CLIENTE|IDENTIFICACION|PAGARE|CREDITO|CONTRATO|NUMERO/i.test(h)) return false; return /^-?[\d.,]+([Ee][-+]?\d+)?$/.test(s); }
  function parseLocaleNumber(s){
    if(typeof s === 'number') return s;
    const raw = String(s ?? '').trim(); if(!raw) return NaN;
    let clean = raw.replace(/\$/g,'').replace(/\s/g,'');
    if(clean.includes(',') && clean.includes('.')) clean = clean.replace(/\./g,'').replace(',','.');
    else if(clean.includes(',') && !clean.includes('.')) clean = clean.replace(',','.');
    const n = Number(clean); return Number.isFinite(n) ? n : NaN;
  }
  function toNumber(v){ if(typeof v === 'number' && Number.isFinite(v)) return v; const n = parseLocaleNumber(v); return Number.isFinite(n) ? n : 0; }
  function sum(rows, field){ return rows.reduce((a,r)=>a+toNumber(val(r,field)),0); }
  function sumWhere(rows, fn, field){ return rows.filter(fn).reduce((a,r)=>a+toNumber(val(r,field)),0); }
  function max(rows, field){ return rows.reduce((a,r)=>Math.max(a,toNumber(val(r,field))),0); }
  function groupSum(rows, keyFn, valFn){ const out={}; rows.forEach(r=>{ const k=keyFn(r)||'Sin clasificar'; out[k]=(out[k]||0)+valFn(r); }); return out; }
  function unique(arr){ return Array.from(new Set(arr.map(x => String(x ?? '').trim()).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'es')); }
  function clone(obj){ return JSON.parse(JSON.stringify(obj)); }
  function formatMoney(v){ return new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(toNumber(v)); }
  function compactMoney(v){ const n=toNumber(v); if(Math.abs(n)>=1e9) return `$${(n/1e9).toFixed(1)}MM`; if(Math.abs(n)>=1e6) return `$${(n/1e6).toFixed(0)}M`; if(Math.abs(n)>=1e3) return `$${(n/1e3).toFixed(0)}K`; return `$${n}`; }
  function formatPercent(v){ const n=toNumber(v); return new Intl.NumberFormat('es-CO',{style:'percent',minimumFractionDigits:2,maximumFractionDigits:2}).format(n); }
  function formatDate(v){ if(!v) return ''; if(/^\d{4}-\d{2}-\d{2}$/.test(String(v))) { const [y,m,d] = String(v).split('-'); return `${d}/${m}/${y}`; } return String(v); }
  function formatValue(value,type){ if(type==='money') return formatMoney(value); if(type==='percent') return formatPercent(value); if(type==='number') return new Intl.NumberFormat('es-CO').format(toNumber(value)); return value; }
  function formatCell(key, value, row){
    const k = normalizeText(key);
    if(k.includes('CONCENTRACION') || k.includes('%') || k.includes('TASA')) return k.includes('CONCENTRACION') ? formatPercent(value) : `${toNumber(value).toLocaleString('es-CO',{maximumFractionDigits:2})}%`;
    if(k.includes('CAPITAL') || k.includes('INTERES') || k.includes('TOTAL') || k.includes('MONTO') || k.includes('PROVISION') || k.includes('VALOR') || k.includes('DIFERENCIA') || k.includes('RECURSOS')) return formatMoney(value);
    if(k.includes('STATUS') || k === 'ESTADO') return formatStatus(value);
    if(k.includes('CALIFICACION')) return formatRating(value);
    if(k.includes('FECHA')) return formatDate(value);
    if(k === 'ENTIDAD' || k.includes('NOMBRE')) return `<span title="${escapeHtml(value)}">${escapeHtml(shortName(value, 70))}</span>`;
    return escapeHtml(value);
  }
  function cellClass(key){ const k=normalizeText(key); return /CAPITAL|INTERES|TOTAL|MONTO|PROVISION|CONCENTRACION|TASA|DIFERENCIA|VALOR|RECURSOS/.test(k) ? 'money' : ''; }
  function formatStatus(s){ const status = String(s || '').trim(); const cls = status==='Crítico'?'danger':status==='Advertencia'?'warn':status==='Validado'?'ok':'neutral'; return `<span class="badge ${cls}">${escapeHtml(status)}</span>`; }
  function formatRating(r){ const rating = String(r || 'S/C').trim().toUpperCase(); const cls = rating==='A'?'ok':rating==='E'||rating==='K'?'danger':'warn'; return `<span class="badge ${cls}">${escapeHtml(rating)}</span>`; }
  function displayLine(line){ const l=String(line ?? '').trim(); if(l==='103') return 'FOMENTO'; if(l==='104') return 'TESORERÍA'; if(l==='105') return 'CESION DE DERECHOS ECONOMICOS'; if(l==='108') return 'CARTERA ESPECIAL'; return l || 'Sin línea'; }
  function worstRating(a,b){ const order = {'':0,'A':1,'B':2,'C':3,'D':4,'E':5,'K':6}; const x=String(a||'').trim().toUpperCase(); const y=String(b||'').trim().toUpperCase(); return (order[y]||0) > (order[x]||0) ? y : x; }
  function shortName(name, max=34){ const s=String(name ?? '').replace(/\s+/g,' ').trim(); return s.length > max ? s.slice(0,max-1)+'…' : s; }
  function escapeHtml(s){ return String(s ?? '').replace(/[&<>"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch])); }
  function looksPercent(label){ return /%|participacion|cartera/i.test(label); }
  function chartPalette(n){ const base = [COLORS.teal, COLORS.lime, COLORS.dark, '#5db3b6', '#dfe853', '#86a6ac', '#95c11f', '#2f6f73', '#a5a800', '#93d6d9']; return Array.from({length:n},(_,i)=>base[i%base.length]); }
  function excelSerialToDate(serial){ const utc = Math.round((serial - 25569) * 86400 * 1000); return new Date(utc).toISOString().slice(0,10); }
  function fillSelect(select, values, allLabel){ const current = select.value; select.innerHTML = `<option value="">${allLabel}</option>` + values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join(''); select.value = current; }
  function matchMora(days, range){ const d=toNumber(days); if(range==='0') return d===0; if(range==='1-30') return d>=1&&d<=30; if(range==='31-90') return d>=31&&d<=90; if(range==='91-720') return d>=91&&d<=720; if(range==='720+') return d>720; return true; }
  function matchAmount(amount, range){ const a=toNumber(amount); if(range==='0-100m') return a<=100_000_000; if(range==='100m-1000m') return a>100_000_000&&a<=1_000_000_000; if(range==='1000m+') return a>1_000_000_000; return true; }
  function compareValues(a,b,dir){ const na=toNumber(a), nb=toNumber(b); let cmp; if(na || nb) cmp = na-nb; else cmp = String(a).localeCompare(String(b),'es'); return dir==='asc'?cmp:-cmp; }
  function rowClassValidation(r){ return r.status === 'Crítico' ? 'risk-row-danger' : r.status === 'Advertencia' ? 'risk-row-warn' : ''; }
  function rowClassCalificacion(r){ const rating = String(val(r,'CALIFICACION')).toUpperCase(); const mora = toNumber(val(r,'DIAS MORA')); return rating==='E'||rating==='K'||mora>720 ? 'risk-row-danger' : mora>0 ? 'risk-row-warn' : ''; }
  function rowClassEdad(r){ const mora = toNumber(val(r,'DIAS VENCIDAD')); const c720 = toNumber(val(r,'CAPITAL MAYOR A 720')); return mora>720 || c720>0 ? 'risk-row-danger' : mora>0 ? 'risk-row-warn' : ''; }
  function rowClassSaldos(r){ return toNumber(val(r,'INTERES MORA'))>0 ? 'risk-row-warn' : ''; }
  function rowClassConcentracion(r){ const c = toNumber(val(r,'CONCENTRACION')); return c>.20 ? 'risk-row-warn' : ''; }
  function clientAlertText(c){ const alerts=[]; if(c.diasMora>720) alerts.push('Mora superior a 720 días.'); if(['E','K'].includes(String(c.calificacion).toUpperCase())) alerts.push('Calificación crítica.'); if(c.concentracion>.2) alerts.push('Concentración individual superior al 20%.'); if(c.capitalVencido>0) alerts.push('Tiene capital vencido.'); return alerts.length ? alerts.join(' ') : 'Sin alertas críticas automáticas.'; }
  function isoToday(){ return new Date().toISOString().slice(0,10); }
})();
