/**
 * MoorSafe website forms -> Google Sheet + email notification.
 *
 * SETUP (about 5 minutes):
 * 1. Create a new Google Sheet (name it "MoorSafe leads").
 * 2. In the Sheet: Extensions -> Apps Script. Delete the sample code and paste this whole file.
 * 3. Change NOTIFY below to the email that should receive a message for every submission.
 * 4. Click Deploy -> New deployment -> type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Click Deploy and approve the permissions Google asks for.
 * 5. Copy the "Web app URL" (it starts with https://script.google.com/macros/s/...).
 * 6. Paste it into site.config.json as "formEndpoint", rebuild, and push.
 *
 * If you ever edit this script, use Deploy -> Manage deployments -> Edit -> New version,
 * otherwise the website keeps using the old code.
 */
const NOTIFY = 'support@moorsafe.org'; // <- who gets an email for each submission
const SHEET_NAME = 'Leads';

const HEADERS = ['Time', 'Type', 'Intent', 'Name', 'Email', 'Phone', 'Role', 'Organization', 'Boat / harbor', 'Message', 'Wants updates'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const c = data.customer || {};
    if (!c.email) return reply({ ok: false, error: 'no email' }); // ignore junk posts

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
    }
    sheet.appendRow([
      new Date(), data.type || '', data.intent || '', c.name || '', c.email || '', c.phone || '',
      c.role || '', c.organization || '', c.harbor || '', c.message || '', c.updates === 'yes' ? 'yes' : '',
    ]);

    const subject = 'MoorSafe website: ' + (data.intent || (data.type === 'pro' ? 'Harbormaster / mooring pro inquiry' : data.type === 'info-packet' ? 'Info packet request' : 'New submission'));
    const body = Object.keys(c).filter(k => c[k]).map(k => k + ': ' + c[k]).join('\n');
    MailApp.sendEmail({ to: NOTIFY, replyTo: c.email, subject: subject, body: body });

    return reply({ ok: true });
  } catch (err) {
    return reply({ ok: false, error: String(err) });
  }
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
