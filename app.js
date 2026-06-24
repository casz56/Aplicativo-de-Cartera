/* Sistema de Gestión de Cartera INFIHUILA
   HTML5 + JavaScript + CSS. Prototipo sin backend.
   Módulos internos: parsers, validators, charts, tables, exports, utils. */
(() => {
  'use strict';

  const COLORS = {
    lime: '#ccd400', teal: '#00757a', dark: '#004651', ok: '#16a34a', warn: '#f59e0b', danger: '#dc2626', gray: '#5c6670', pale: '#edf7f7'
  };

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
    filtros: { search:'', line:'', rating:'', sector:'', mora:'', amount:'' },
    metadata: { fechaCorte:'2026-02-28', archivosCargados: [], fechaCarga: new Date().toISOString(), version: '1.0.0', demo: true },
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
    initializeState();
    renderAll();
  }

  function cacheDom(){
    ['fileInput','dropZone','sourceMode','loadedFiles','fechaCorte','overallHealth','kpiGrid','alertGrid','validationGrid',
     'searchInput','lineFilter','ratingFilter','sectorFilter','moraFilter','amountFilter','clearFiltersBtn','resetBtn','exportExcelBtn','exportPdfBtn',
     'tabs','helpBtn','helpDialog','closeHelp','clientDialog','closeClient','clientDetail','clientCards','fullscreenBtn'].forEach(id => dom[id] = document.getElementById(id));
  }

  function bindEvents(){
    dom.fileInput.addEventListener('change', e => handleFiles(e.target.files));
    dom.dropZone.addEventListener('dragover', e => { e.preventDefault(); dom.dropZone.classList.add('drag'); });
    dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('drag'));
    dom.dropZone.addEventListener('drop', e => { e.preventDefault(); dom.dropZone.classList.remove('drag'); handleFiles(e.dataTransfer.files); });
    dom.searchInput.addEventListener('input', e => updateFilter('search', e.target.value));
    dom.lineFilter.addEventListener('change', e => updateFilter('line', e.target.value));
    dom.ratingFilter.addEventListener('change', e => updateFilter('rating', e.target.value));
    dom.sectorFilter.addEventListener('change', e => updateFilter('sector', e.target.value));
    dom.moraFilter.addEventListener('change', e => updateFilter('mora', e.target.value));
    dom.amountFilter.addEventListener('change', e => updateFilter('amount', e.target.value));
    dom.clearFiltersBtn.addEventListener('click', clearFilters);
    dom.resetBtn.addEventListener('click', resetDemo);
    dom.exportExcelBtn.addEventListener('click', exportToExcel);
    dom.exportPdfBtn.addEventListener('click', exportToPDF);
    dom.tabs.addEventListener('click', e => { if(e.target.matches('.tab')) switchTab(e.target.dataset.tab); });
    document.body.addEventListener('click', e => {
      const exportBtn = e.target.closest('[data-export-table]');
      if(exportBtn) exportSingleTable(exportBtn.dataset.exportTable);
      const sortable = e.target.closest('th[data-sort]');
      if(sortable) sortTable(sortable.dataset.table, sortable.dataset.sort);
      const client = e.target.closest('[data-client]');
      if(client) openClient360(client.dataset.client);
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
  }

  function renderStatus(){
    dom.fechaCorte.textContent = formatDate(findFechaCorte());
    dom.sourceMode.textContent = state.metadata.demo ? 'Demo validado con fuentes anexas' : 'Archivos cargados por el usuario';
    dom.loadedFiles.textContent = state.metadata.demo ? '9 fuentes base' : `${state.metadata.archivosCargados.length} archivo(s)`;
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
    Object.assign(state, {
      pagos: clone(window.DEMO_DATA.pagos), desembolsos: clone(window.DEMO_DATA.desembolsos), calificacion: clone(window.DEMO_DATA.calificacion),
      concentracion: clone(window.DEMO_DATA.concentracion), edadCartera: clone(window.DEMO_DATA.edadCartera), saldos: clone(window.DEMO_DATA.saldos),
      indicadoresCalidad: clone(window.DEMO_DATA.indicadoresCalidad), formato514: clone(window.DEMO_DATA.formato514), resultados: clone(window.DEMO_DATA.resultados)
    });
    state.metadata = { fechaCorte:'2026-02-28', archivosCargados: [], fechaCarga: new Date().toISOString(), version:'1.0.0', demo:true };
    clearFilters();
  }

  /* ===============================
     PARSERS: lectura Excel en browser
     =============================== */
  async function handleFiles(fileList){
    const files = Array.from(fileList || []);
    if(!files.length) return;
    const loaded = [];
    const failed = [];
    for(const file of files){
      try{
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type:'array', cellDates:true, raw:false });
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
    dom.kpiGrid.innerHTML = cards.map(([label,value,note,type,status]) => `
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
