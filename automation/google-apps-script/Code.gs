const INBOX_HEADERS = [
  'Received At','Channel','Brand','Sender ID','Sender Name','Contact','Message','Intent','Priority','Status',
  'Assigned To','Consent','Follow-up At','Qualified','Client / Member ID','Source Event ID','Thread URL','Notes'
];
const UNKNOWN_HEADERS = [
  'Received At','Channel','Brand Guess','Question','Sender ID','Frequency','Status','Suggested Answer','Approved By','Added to Library'
];
const LOG_HEADERS = ['Timestamp','Event ID','Channel','Action','Result','HTTP Status','Duration ms','Error','Retry Count'];

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function property_(name) {
  return PropertiesService.getScriptProperties().getProperty(name) || '';
}

function constantTimeEqual_(left, right) {
  left = String(left || '');
  right = String(right || '');
  if (left.length !== right.length) return false;
  var mismatch = 0;
  for (var i = 0; i < left.length; i++) mismatch |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return mismatch === 0;
}

function spreadsheet_() {
  var id = property_('FMB_AUTOMATION_SHEET_ID');
  if (!id) throw new Error('FMB_AUTOMATION_SHEET_ID is not configured in Script Properties.');
  return SpreadsheetApp.openById(id);
}

function requireSheet_(book, name, headers) {
  var sheet = book.getSheetByName(name);
  if (!sheet) throw new Error('Required sheet is missing: ' + name);
  var current = sheet.getRange(1, 1, 1, headers.length).getDisplayValues()[0];
  if (current.join('|') !== headers.join('|')) throw new Error('Header mismatch in sheet: ' + name);
  return sheet;
}

function clean_(value, maxLength) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength || 5000);
}

function isDuplicate_(sheet, sourceEventId) {
  if (!sourceEventId || sheet.getLastRow() < 2) return false;
  return Boolean(
    sheet.getRange(2, 16, sheet.getLastRow() - 1, 1)
      .createTextFinder(sourceEventId)
      .matchEntireCell(true)
      .findNext()
  );
}

function appendLog_(sheet, event, action, result, status, durationMs, error, retryCount) {
  sheet.appendRow([
    new Date(), clean_(event.sourceEventId, 300), clean_(event.channel, 50), action, result,
    status || '', durationMs || 0, clean_(error, 1000), retryCount || 0
  ]);
}

function appendUnknown_(sheet, event) {
  var frequency = 1;
  if (sheet.getLastRow() >= 2) {
    var existing = sheet.getRange(2, 4, sheet.getLastRow() - 1, 1)
      .createTextFinder(clean_(event.message, 10000))
      .matchEntireCell(true)
      .findNext();
    if (existing) {
      var frequencyCell = sheet.getRange(existing.getRow(), 6);
      frequencyCell.setValue(Number(frequencyCell.getValue() || 1) + 1);
      return;
    }
  }
  sheet.appendRow([
    event.receivedAt || new Date(), clean_(event.channel, 50), clean_(event.brand, 100), clean_(event.message, 10000),
    clean_(event.senderId, 300), frequency, 'New', '', '', 'No'
  ]);
}

function appendEvent_(event) {
  var started = Date.now();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var book = spreadsheet_();
    var inbox = requireSheet_(book, 'Inbox', INBOX_HEADERS);
    var unknown = requireSheet_(book, 'Unknown Questions', UNKNOWN_HEADERS);
    var log = requireSheet_(book, 'Automation Log', LOG_HEADERS);

    if (isDuplicate_(inbox, clean_(event.sourceEventId, 300))) {
      appendLog_(log, event, 'deduplicate', 'duplicate_ignored', 200, Date.now() - started, '', 0);
      return {ok: true, duplicate: true, eventId: event.sourceEventId};
    }

    inbox.appendRow([
      event.receivedAt || new Date(), clean_(event.channel, 50), clean_(event.brand, 100), clean_(event.senderId, 300),
      clean_(event.senderName, 300), clean_(event.contact, 500), clean_(event.message, 10000), clean_(event.intent, 100),
      clean_(event.priority, 30), clean_(event.status || 'Needs Review', 50), clean_(event.assignedTo, 100),
      clean_(event.consent, 100), event.followUpAt || '', clean_(event.qualified || 'Pending', 30),
      clean_(event.clientMemberId, 300), clean_(event.sourceEventId, 300), clean_(event.threadUrl, 1200), clean_(event.notes, 2000)
    ]);

    if (event.unknown || event.intent === 'unknown_question' || event.brand === 'Unknown') appendUnknown_(unknown, event);
    appendLog_(log, event, 'ingest', 'stored_for_human_review', 200, Date.now() - started, '', 0);

    return {ok: true, duplicate: false, eventId: event.sourceEventId, humanReviewOnly: true};
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  try {
    var request = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var expected = property_('FMB_AUTOMATION_SECRET');
    if (!expected || !constantTimeEqual_(request.ingestSecret, expected)) return jsonOutput_({ok:false,error:'Unauthorized'});
    if (!request.event || typeof request.event !== 'object') return jsonOutput_({ok:false,error:'event is required'});
    delete request.ingestSecret;
    return jsonOutput_(appendEvent_(request.event));
  } catch (error) {
    try {
      var book = spreadsheet_();
      var log = requireSheet_(book, 'Automation Log', LOG_HEADERS);
      appendLog_(log, {}, 'ingest', 'error', 500, 0, error.message || String(error), 0);
    } catch (_) {}
    return jsonOutput_({ok:false,error:clean_(error.message || String(error),500)});
  }
}

function doGet() {
  try {
    var book = spreadsheet_();
    requireSheet_(book, 'Inbox', INBOX_HEADERS);
    requireSheet_(book, 'Unknown Questions', UNKNOWN_HEADERS);
    requireSheet_(book, 'Automation Log', LOG_HEADERS);
    return jsonOutput_({ok:true,service:'FMB Automation Hub Sheet Receiver',humanReviewOnly:true});
  } catch (error) {
    return jsonOutput_({ok:false,error:clean_(error.message || String(error),500)});
  }
}

function verifyAutomationHubSetup() {
  var response = JSON.parse(doGet().getContent());
  Logger.log(JSON.stringify(response));
  return response;
}
