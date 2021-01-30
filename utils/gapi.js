

const {google}         = require('googleapis');
const fs               = require('fs');
const readline         = require('readline')
const SCOPES           = ['https://www.googleapis.com/auth/spreadsheets'];
const TOKEN_PATH       = 'token.json';
const CREDENTIALS_PATH = 'credentials.json'

function authenticateAndAppend(data) {
  // Google API connectivity stuff
  console.log("===== READING GAPI ======");

  // Load client secrets from a local file.
  fs.readFile(CREDENTIALS_PATH, (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Google Sheets API.
    authorize(JSON.parse(content), data, appendToSheet);
  });
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 * 
 * @return returns the token-authenticated oauth2Client
 */
function authorize(credentials, data, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(data, oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

async function appendToSheet(data, auth) {
  const sheets = google.sheets({version: 'v4', auth});
  // TODO promises or error handling for gapi
  // TODO change spreadsheet ID
  console.log("===== APPENDING " + JSON.stringify(data) + "To Google sheets ");
  await sheets.spreadsheets.values.append({
    spreadsheetId: "1AP5dh6SOhpVB-CQwbMeLiSkr5NEEEiIKvcohevEZUH8",
    range: "Sheet1!A:A",
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      "majorDimension": "ROWS",
      "values": [Object.values(data)]
  },
  })
  console.log("===== APPEND COMPLETE =====");
}

module.exports = { authenticateAndAppend }