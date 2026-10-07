/**
 * Registro NectarLab · Google Apps Script
 * Universidad Surcolombiana · Programa de Ingeniería Agroindustrial
 *
 * Recibe los registros de uso de NectarLab (ingresos, lotes producidos y sesiones),
 * los guarda en la hoja «registros» y los entrega al panel docente.
 * También guarda la configuración que define el docente (precios y desbloqueo de turnos).
 *
 * SECRET debe ser idéntico a DOCENTE_CODE en index.html.
 */
const SECRET = 'NECTAR-2026';

const COLS = ['fecha','tipo','planta','version','modalidad','equipo','nombre1','codigo1','nombre2','codigo2','grupo',
  'turno','producto','intento','estrellas','puntos','prediccion','valor_real','prediccion_ok','inocuidad_ok','norma_ok',
  'cliente_ok','eficiencia_ok','fallas','costo_kg','tiempo_turno_s','tiempo_activo_total_s','tiempo_sesion_s','variables'];

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName('registros');
  if (!sh) {
    sh = ss.insertSheet('registros');
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    // códigos y fechas como texto para que Sheets no los transforme
    sh.getRange('A:A').setNumberFormat('@');
    sh.getRange('H:H').setNumberFormat('@');
    sh.getRange('J:J').setNumberFormat('@');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.tipo === 'config') {
      if (d.secret !== SECRET) return json_({ok: false, error: 'clave'});
      PropertiesService.getScriptProperties().setProperty('config', JSON.stringify(d.config || {}));
      return json_({ok: true});
    }
    if (d.tipo === 'reset') {
      if (d.secret !== SECRET) return json_({ok: false, error: 'clave'});
      const sh = hoja_();
      if (sh.getLastRow() > 1) sh.deleteRows(2, sh.getLastRow() - 1);
      return json_({ok: true});
    }
    hoja_().appendRow(COLS.map(c => (d[c] === undefined || d[c] === null) ? '' : String(d[c])));
    return json_({ok: true});
  } catch (err) {
    return json_({ok: false, error: String(err)});
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.tipo === 'config') {
    return json_(JSON.parse(PropertiesService.getScriptProperties().getProperty('config') || '{}'));
  }
  if (p.tipo === 'registros') {
    if (p.key !== SECRET) return json_({error: 'clave'});
    const v = hoja_().getDataRange().getValues();
    const h = v.shift();
    return json_(v.map(r => Object.fromEntries(h.map((k, i) => [k, r[i] instanceof Date ? r[i].toISOString() : r[i]]))));
  }
  return json_({ok: true, app: 'Registro NectarLab'});
}
