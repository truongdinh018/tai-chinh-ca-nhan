/**
 * Copy this into Google Apps Script bound to your spreadsheet
 * (Extensions → Apps Script), then Deploy → Web app:
 *   - Execute as: Me
 *   - Who has access: Anyone
 *
 * Optional: set SCRIPT property SYNC_TOKEN and pass the same value
 * in the app as webhook token.
 */

const TEMPLATE = `/**
 * Tài chính cá nhân — sync webhook
 * Deploy: Deploy → New deployment → Web app → Anyone
 */
var SHEET_MAP = {
  assets: 'assets',
  transactions: 'transactions',
  salary: 'salary',
  debts: 'debts',
  tool_results: 'tool_results',
};

function _tokenOk(e) {
  var expected = PropertiesService.getScriptProperties().getProperty('SYNC_TOKEN');
  if (!expected) return true;
  var got = (e && e.parameter && e.parameter.token) || '';
  try {
    var headers = e.headers || {};
    got = got || headers['X-Sync-Token'] || headers['x-sync-token'] || '';
  } catch (err) {}
  return got === expected;
}

function doGet(e) {
  if (!_tokenOk(e)) return _json({ ok: false, message: 'unauthorized' });
  var action = (e.parameter && e.parameter.action) || 'export';
  if (action === 'export') {
    return _json({
      ok: true,
      assets: _readSheet(SHEET_MAP.assets),
      transactions: _readSheet(SHEET_MAP.transactions),
      salary: _readSheet(SHEET_MAP.salary),
      debts: _readSheet(SHEET_MAP.debts),
    });
  }
  return _json({ ok: true, message: 'pong' });
}

function doPost(e) {
  if (!_tokenOk(e)) return _json({ ok: false, message: 'unauthorized' });
  var body = {};
  try { body = JSON.parse(e.postData.contents); } catch (err) {
    return _json({ ok: false, message: 'invalid json' });
  }
  var action = body.action || '';
  if (action === 'ping') return _json({ ok: true, message: 'pong' });
  if (action === 'upsert_all') {
    if (body.assets) _writeSheet(SHEET_MAP.assets, body.assets);
    if (body.transactions) _writeSheet(SHEET_MAP.transactions, body.transactions);
    if (body.salary) _writeSheet(SHEET_MAP.salary, body.salary);
    if (body.debts) _writeSheet(SHEET_MAP.debts, body.debts);
    return _json({ ok: true, message: 'upserted' });
  }
  if (action === 'append_tool_result') {
    var sh = _ensureSheet(SHEET_MAP.tool_results, ['created_at', 'tool_id', 'input_json', 'output_json']);
    sh.appendRow([
      body.created_at || new Date().toISOString(),
      body.tool_id || '',
      JSON.stringify(body.input || {}),
      JSON.stringify(body.output || {}),
    ]);
    return _json({ ok: true, message: 'appended' });
  }
  return _json({ ok: false, message: 'unknown action' });
}

function _json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _ensureSheet(name, headers) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(headers);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(headers);
  }
  return sh;
}

function _readSheet(name) {
  var ss = SpreadsheetApp.getActive();
  var sh = ss.getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  var values = sh.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var r = 1; r < values.length; r++) {
    var row = {};
    var empty = true;
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c];
      if (!key) continue;
      var v = values[r][c];
      if (v !== '' && v != null) empty = false;
      row[key] = v;
    }
    if (!empty) out.push(row);
  }
  return out;
}

function _writeSheet(name, rows) {
  if (!rows || !rows.length) {
    _ensureSheet(name, ['id']);
    return;
  }
  var headers = Object.keys(rows[0]);
  var sh = _ensureSheet(name, headers);
  sh.clear();
  sh.getRange(1, 1, 1, headers.length).setValues([headers]);
  var data = rows.map(function (row) {
    return headers.map(function (h) { return row[h] == null ? '' : row[h]; });
  });
  if (data.length) sh.getRange(2, 1, data.length + 1, headers.length).setValues(data);
}
`

export const APPS_SCRIPT_SOURCE = TEMPLATE
