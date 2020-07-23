// WARNING MESSAGE ---------------------------------------------------------

// Show error message
function showError(message, hide) {
  let warning = document.getElementById('Warning');
  if (hide) {
    warning.style.display = 'none';
  } else {
    warning.style.display = 'block';
    warning.innerHTML = message;

    // Hide after 3 seconds
    setTimeout(() => {
      warning.style.display = 'none';
    }, 3000);
  }
}

// Hide error warning on start
showError('', true);

// HTTP REQUESTS -----------------------------------------------------------

// Sends a GET request with a token
function httpGet(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        } else if (xmlHttp.status === 401 || xmlHttp.status === 403) {
          onAccessChange('Please Request Access Again', true);
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('GET Request Failed: ' + xmlHttp.status);
        }  
    }
    chrome.storage.local.get('token', function(data) {
      if (data.token) {
        xmlHttp.open("GET", url, true);
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xmlHttp.send();
      } else {
        showError('GET: No Access Token');
      }
    });
}

// Sends a POST request without a token
function httpPostNoToken(url, payload, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('No Server Response: ' + xmlHttp.status);
        } 
    }
    xmlHttp.open("POST", url, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify(payload));
}

// Sends a POST request without a token
function httpPostNoTokenPromise(url, payload) {
  return new Promise((resolve, reject) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          resolve(JSON.parse(xmlHttp.responseText));
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('No Server Response: ' + xmlHttp.status);
          reject({status: 'FAIL'});
        } 
    }
    xmlHttp.open("POST", url, true);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify(payload));
  })
}

// Sends a POST request with a token
function httpPost(url, payload, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        } else if (xmlHttp.status === 401 || xmlHttp.status === 403) {
          onAccessChange('Please Request Access Again', true);
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('POST Request Failed: ' + xmlHttp.status);
        } 
    }
    chrome.storage.local.get('token', function(data) {
      if (data.token) {
        xmlHttp.open("POST", url, true);
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlHttp.send(JSON.stringify(payload));
      } else {
        showError('POST: No Access Token');
      }
    });
}

// SERVER STATUS -----------------------------------------------------------

// Check if the server is on
function checkServer(url, app) {
  let serverStatus = app
  ? document.getElementById('AppStatus')
  : document.getElementById('ServerStatus');
  httpGet(url, (response) => {
    if (response) {
      serverStatus.style.backgroundColor = 'green';
      serverStatus.innerHTML = "Server Online"
      return true;
    }
    serverStatus.style.backgroundColor = '#FF6933';
    serverStatus.innerHTML = "Server Offline"
    return false;
  });
};

// PREFILL DATA ------------------------------------------------------------

// Autofill fields if data in storage
chrome.storage.local.get('url', function(data) {
  let url = document.getElementById('Url');
  if (data.url) {
    url.value = data.url;
    // Check if server is live
    checkServer(`http://${data.url}:8080/`);
    checkServer(`http://${data.url}:8080/`, true);
    // setInterval(() => {
    //   checkServer(`http://${data.url}:8080/`);
    // }, 5000)
  }
});
chrome.storage.local.get('localUsername', function(data) {
  let LocalUsername = document.getElementById('LocalUsername');
  if (data.localUsername) {
    LocalUsername.value = data.localUsername;
  }
});
chrome.storage.local.get('token', function(data) {
  let accessStatus = document.getElementById('AccessStatus');
  if (data.token && data.token !== 'REVOKED') {
    accessStatus.innerHTML = "Access Granted";
    accessStatus.style.backgroundColor  = "green";
    Setup.style.display = 'none';
    Main.style.display = 'flex';
  } else {
    document.getElementById('RevokeAccess').style.display = 'none';
  }
});

// Get new login info
function getLoginInfo() {
  chrome.storage.local.get('savedPassword', function(password) {
    chrome.storage.local.get('savedUsername', function(username) {
      chrome.storage.local.get('savedSite', function(site) {
        let showSave = document.getElementById('ShowSave');
        if (site.savedSite) {
          let savedSite = document.getElementById('SavedSite');
          savedSite.value = site.savedSite;
        }
        if (username.savedUsername) {
          let savedUsername = document.getElementById('SavedUsername');
          savedUsername.value = username.savedUsername;
          showSave.style.display = 'block';
        }
        if (password.savedPassword ) {
          let savedPassword = document.getElementById('SavedPassword');
          savedPassword.value = password.savedPassword;
          showSave.style.display = 'block';
        }
      })
    })
  })
}

// Try get on first load
getLoginInfo();

// Otherwise listen for changes
chrome.storage.onChanged.addListener(() => {
  getLoginInfo();
})

// PAGE SWAPPING -----------------------------------------------------------

// Swap Between Pages
let showMain = document.getElementById('ShowMain');
let showSetup = document.getElementById('ShowSetup');
let showGenerate = document.getElementById('ShowGenerate');
let showSave = document.getElementById('ShowSave');
let goBacks = document.getElementsByClassName('GoBack');
let main = document.getElementById('Main');
let setup = document.getElementById('Setup');
let generate = document.getElementById('Generate');
let savedData = document.getElementById('SavedData');

function showPage(page) {
  main.style.display = 'none';
  setup.style.display = 'none';
  generate.style.display = 'none';
  savedData.style.display = 'none';
  page.style.display = 'flex';
}

// Swap to Main
showMain.onclick = function() {
  showPage(main);

  // Save settings
  let url = document.getElementById('Url').value;
  chrome.storage.local.set({url});
  let localUsername = document.getElementById('LocalUsername').value;
  chrome.storage.local.set({localUsername});
};

// Swap to Generator
showGenerate.onclick = function() {
  showPage(generate);
};

// Swap to Saved Data
showSave.onclick = function() {
  let savedPassword = document.getElementById('SavedPassword');
  if (savedPassword.value === "No Password Available") {
    savedPassword.type = 'text';
  }
  showPage(savedData);
};

// Swap to Setup
showSetup.onclick = function() {
  showPage(setup);
};

// Swap to Main
Array.prototype.slice.call(goBacks).forEach((goBack) => {
  goBack.onclick = function() {
    showPage(main);
  };
});

// REQUEST ACCESS ---------------------------------------------------------

// Get access permission from device
let requestAccess = document.getElementById('RequestAccess');
let accessStatus = document.getElementById('AccessStatus');

// Send POST request and await response
requestAccess.onclick = function() {
  requestAccess.blur();
  let url = document.getElementById('Url').value;
  let LocalUsername = document.getElementById('LocalUsername').value;
  accessStatus.innerHTML = "Waiting for reponse on device";
  httpPostNoToken(`https://${url}:8080/auth/login`, {username: LocalUsername}, (response) => {
    const token = JSON.parse(response);
    if (token && token.accessToken) {
      accessStatus.innerHTML = "Access Granted";
      accessStatus.style.backgroundColor  = "green";
      onAccessChange("Server Online");
      chrome.storage.local.set({token: token.accessToken});
      document.getElementById('RevokeAccess').style.display = 'block';
    } else if (token && token.access) {
      accessStatus.innerHTML = token.access;
    } else {
      accessStatus.innerHTML = 'No Response, please try again'
    }
  });
};
// REVOKE ACCESS ----------------------------------------------------------

// Revoke the extension's access to passwords
let revokeAccess = document.getElementById('RevokeAccess');

function onAccessChange(message, revoke) {
  if (revoke) {
    chrome.storage.local.set({token: 'REVOKED'});
    revokeAccess.style.display = 'none';
  }
  accessStatus.innerHTML = message;
  accessStatus.style.backgroundColor  =  revoke ? '#FF6933' : 'green';
  let serverStatus = document.getElementById('ServerStatus');
  serverStatus.innerHTML = message;
  serverStatus.style.backgroundColor  = revoke ? '#FF6933' : 'green';
  let appStatus = document.getElementById('AppStatus');
  appStatus.innerHTML = message;
  appStatus.style.backgroundColor  = revoke ? '#FF6933' : 'green';
}

// Remove JWT Token from storage
revokeAccess.onclick = function() {
  onAccessChange("Access Permission Required", true);
}

// SAVE PASSWORD -----------------------------------------------------------

// Save password on request
let savePassword = document.getElementById('SavePassword');

// Send POST request with data
savePassword.onclick = function() {
  savePassword.blur();
  let website = document.getElementById('SavedSite').value;
  let username = document.getElementById('SavedUsername').value;
  let password = document.getElementById('SavedPassword').value;
  let appStatus = document.getElementById('AppStatus');
  appStatus.innerHTML = "Waiting For App";
  let payload = {website,username,password};
  let url = document.getElementById('Url').value;
  httpPost(`https://${url}:8080/manager`, payload, (res) => {
    const response = JSON.parse(res);
    if (response && response.status === 'OK') {
      appStatus.style.backgroundColor = 'green';
      appStatus.innerHTML = "Password Saved";
      // Clear saved data and hide button
      chrome.storage.local.set({savedSite: null});
      chrome.storage.local.set({savedUsername: null});
      chrome.storage.local.set({savedPassword: null});
      let showSave = document.getElementById('ShowSave');
      showSave.style.display = 'none';
      setTimeout(() => {
        appStatus.innerHTML = "Server Online";
      }, 3000);
    }
  })
}

// COPY DATA ---------------------------------------------------------------

// Copy inputs on first press
function onCopyToClipboard(id) {
  let element = document.getElementById(id);
  element.onfocus = function() {
    element.select();
    element.setSelectionRange(0, 99999);
    document.execCommand("copy");
    let value = element.value;
    let type = element.type;
    element.style.textAlign = 'center';
    element.type = 'text';
    element.value = "COPIED!";
    setTimeout(() => {
      element.style.textAlign = 'left';
      element.type = type;
      element.value = value;
    }, 1000);
    if (element.readOnly) {
      element.blur();
    }
  }
}

// Set listeners
onCopyToClipboard('SavedUsername');
onCopyToClipboard('SavedPassword');
onCopyToClipboard('NewPassword');

// HIDE PASSWORD -----------------------------------------------------------

function onChangePassword(id) {
  let element = document.getElementById(id);
  element.onfocus = function() {
    element.type = 'text';
  }
  element.onblur = function() {
    console.log('blur')
    if (element.value !== "No Password Available") {
      element.type = 'password';
    }
  }
}

// Set listeners
onChangePassword('SavedPassword');

// GENERATE PASSWORD -------------------------------------------------------

// Create a random password
let generatePassword = document.getElementById('GeneratePassword');
let special = document.getElementById('Special');
let specialCharacters = document.getElementById('SpecialCharacters');

// Activate special characters if text
specialCharacters.oninput = function () {
  if (specialCharacters.value.length > 0) {
    special.checked = true;
  } else {
    special.checked = false;
  }
};

// Add special characters as value
special.onclick = function() {
  if (special.checked) {
    specialCharacters.value = specialCharacters.placeholder;
  } else {
    specialCharacters.value = "";
  }
};

// Create an array to store the password then display it
generatePassword.onclick = function() {
  // Get criteria
  let maxLength = document.getElementById('MaxLength').value;
  let uppercase = document.getElementById('Uppercase').value;
  let lowercase = document.getElementById('Lowercase').value;
  let specialCharacters = document.getElementById('SpecialCharacters').value;
  let charactersAmount = document.getElementById('CharactersAmount').value;

  // Generate random numbers
  let arrayOfNums = new Uint32Array(maxLength ? Math.floor(maxLength / 10) : 10);
  window.crypto.getRandomValues(arrayOfNums);
  let array = new String(arrayOfNums).replace(/,/g, '').split('');

  // Create array to track which indices have changes
  let repeats = [];

  // Keep array equal to max length
  const spaceLeft = () => (repeats.length < maxLength - 1);

  // Get a random integer in a range
  const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Add value to array, increase repeats
  const addToArray = (value) => {
    let index = getRandomInt(0,array.length - 1);
    if (repeats.find((i) => i === index) !== undefined) {
      repeats = repeats.sort();
      index = repeats[repeats.length - 1] + 1;
    }
    array[index] = value;
    repeats.push(index);
  }

  // Apply criteria
  if (maxLength) {
    array = array.slice(0, maxLength);
  }
  if (uppercase) {
    for (var i = 0; (i < uppercase && spaceLeft()); i++) {
      addToArray(String.fromCharCode(65 + getRandomInt(0,25)));
    }
  }
  if (lowercase) {
    for (var i = 0; (i < lowercase && spaceLeft()); i++) {
      addToArray(String.fromCharCode(97 + getRandomInt(0,25)));
    }
  }
  if (specialCharacters) {
    for (var i = 0; (i < charactersAmount && spaceLeft()); i++) {
      let character = getRandomInt(0,specialCharacters.length - 1);
      addToArray(specialCharacters[character]);
    }
  }

  // Display
  let newPassword = document.getElementById('NewPassword');
  newPassword.value = array.join('');
  generatePassword.blur();
}

// HELPER FUNCTIONS -------------------------------------------------------------

/**
 * Convert ArrayBuffer to string
 * @param {ArrayBuffer} buf buffer to convert
 */
function ab2str(buf) {
  return window.btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}

/**
 * Convert string to ArrayBuffer
 * @param {string} str string to convert
 */
function str2ab(str) {
  const bin = window.atob(str);
  const buf = new ArrayBuffer(bin.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = bin.length; i < strLen; i++) {
    bufView[i] = bin.charCodeAt(i);
  }
  return buf;
}

/**
 * Converts ArrayBuffer to hex encoded string
 * @param {*} buf buffer to convert
 * @param {*} isArray whether the buffer is an array
 */
function ab2Hex(buf, isArray = false) {
  return [...(isArray ? buf : new Uint8Array(buf))]
      .map(b => b.toString (16).padStart (2, "0"))
      .join("");
}

/**
 * Converts hex encoded string to ArrayBuffer
 * @param {*} hex string to convert
 */
function hex2ab(hex) {
  var view = new Uint8Array(hex.length / 2)
  for (var i = 0; i < hex.length; i += 2) {
    view[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return view.buffer
}

console.log(sendEncrypted('http://localhost:3000', {test: 'test message length test'}));

console.log(requestEncrypted('http://localhost:3000'));

// CRYPTION FUNCTIONS ---------------------------------------------------------

async function sendEncrypted(address, data) {
  // 1) Get fresh key pair for message
  const { publicKey } = await createKeyPair();

  // 2) Try get Public key from server
  const response = await initiateHandshake(publicKey, address);
  console.log('reponse: ', response);
  // If reponse contains key
  if (response.status === 'OK') {
    // 3) Import server Public Key into usable format
    const serverPublicKey = await importPublicKey(response);

    // 4) Create new AES key and encrypt message
    const { exportedAESKey, encrypted, ivString } = await initiateAESEncrypt(data);

    // 5) Encrypt AES key and IV with external Public key
    const encryptedAESKey = await RSAEncrypt(serverPublicKey, exportedAESKey);
    const encryptedIV = await RSAEncrypt(serverPublicKey, ivString);
    
    // 6) Prepare payload
    const payload = {encrypted, iv: encryptedIV, aesKey: encryptedAESKey}

    // 7) Send to server
    return await httpPostNoTokenPromise(address, payload);
  } else {
    showError('Unable to get server public key');
    return undefined;
  }
}

async function requestEncrypted(address) {
  // 1) Get fresh key pair for message
  const { publicKey, privateKey } = await createKeyPair();

  // 2) Try get response from server
  const response = await initiateHandshake(publicKey, address);
  
  // If reponse is OK
  if (response.status === 'OK') {
    // 3) Extract AES key from response
    const aesKey = await extractAESKey(privateKey, response);

    // 4) Decrypt iv from response
    const aesIV = await RSADecrypt(privateKey, hex2ab(response.aesIV));
    console.log('decrypted: ', aesIV);

    // 5) Decrypt server response
    const decrypted = {};
    Object.keys(response.aesData).forEach(async(key) => {
      decrypted[key] = await AESDecrypt(aesKey, aesIV, response.aesData[key]);
    });
    return decrypted;
  } else {
    showError('Unable to get server public key');
    return undefined;
  }
}

async function extractAESKey(privateKey, { aesKey }) {
  // 1) Decrypt server AES Key using Private key
  const serverAESKey = await RSADecrypt(privateKey, str2ab(aesKey));

  // 2) Return AES key as a usable format
  return await importAESKey(serverAESKey);
}

async function initiateHandshake(publicKey, address) {
  // 1) Prepare public key for exporting
  const key = await exportPublicKey(publicKey);

  // 2) Create payload
  const payload = {key};

  // 3) Send to server and await response
  return await httpPostNoTokenPromise(address, payload);
}

// AES CRYPTION --------------------------------------------------------------

async function AESEncrypt(key, iv, message) {
  // 1) Convert string to ArrayBuffer
  let encoded = new TextEncoder().encode(message);
  const encryptedData = await window.crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    key,
    encoded
  );
  // 3) Return both buffers converted to hex strings 
  return ab2Hex(encryptedData);
}

async function AESDecrypt(aesKey, aesIV, aesData) {
  // 1) Convert data into 16 bit buffers
  const dataBuffer = hex2ab(aesData);

  // 2) Decrypt data then convert buffer to string
  return window.atob(ab2str(await window.crypto.subtle.decrypt(
    {
      name: "AES-CBC",
      iv: aesIV,
    },
    aesKey,
    dataBuffer
  )));
}

async function generateAESKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-CBC",
      length: 256
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function generateAESiv() {
  const iv = window.crypto.getRandomValues(new Uint8Array(16));
  const ivString = ab2Hex(iv, true);
  return { iv, ivString }
}

function importAESKey(rawKey) {
  return window.crypto.subtle.importKey(
    "raw",
    rawKey,
    "AES-CBC",
    true,
    ["encrypt", "decrypt"]
  );
}

async function exportAESKey(key) {
  // 1) Create new AES key
  const exported = await window.crypto.subtle.exportKey(
    "raw",
    key
  );
  // 2) Convert buffer to string
  return ab2str(exported);
}

async function initiateAESEncrypt(data) {
  // 1) Generate new AES key
  const aesKey = await generateAESKey();

  // 2) Generate IV to use in encryption
  const { iv, ivString } = await generateAESiv();

  // 3) Encrypt message with AES key
  const encrypted = {};
  Object.keys(data).forEach(async(key) => {
    encrypted[key] = await AESEncrypt(aesKey, iv, data[key]);
  });

  // 4) Convert key into usable format
  const exportedAESKey = await exportAESKey(aesKey);

  // 5) Return key and message
  return { exportedAESKey, encrypted, ivString }
}

// RSA CRYPTION --------------------------------------------------------------

async function RSAEncrypt(key, message) {
  // 1) Convert string to buffer
 let encoded = new TextEncoder().encode(message);
 // 2) Encrypt buffer then return string
 return ab2str(await window.crypto.subtle.encrypt(
    {
      name: "RSA-OAEP"
    },
    key,
    encoded
  ))
}

async function RSADecrypt(key, encoded) {
  return await window.crypto.subtle.decrypt(
    {
      name: "RSA-OAEP",
    },
    key,
    encoded
  );
}

async function createKeyPair() {
  return await window.crypto.subtle.generateKey(
    {
    name: "RSA-OAEP",
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"]
  );
}

async function importPublicKey({ publicKey }) {
  // 1) Convert from a binary string to an ArrayBuffer
  const keyBuffer = str2ab(publicKey);
  // 2) Return key in a usable format
  return await window.crypto.subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256"
    },
    true,
    ["encrypt"]
  );
}

async function exportPublicKey(key) {
  const exported = await window.crypto.subtle.exportKey(
    "spki",
    key
  );
  return `-----BEGIN PUBLIC KEY-----\n${ab2str(exported)}\n-----END PUBLIC KEY-----`;
}
