// HTTP REQUESTS -----------------------------------------------------------
// Sends a GET request with a token
function httpGet(url) {
  return new Promise((resolve, reject) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        resolve(xmlHttp.responseText);
      } else if (xmlHttp.readyState == 4) {
        reject({status: 'FAIL'});
      } 
    }
    chrome.storage.local.get('token', function(data) {
      if (data.token) {
        xmlHttp.open("GET", url, true);
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xmlHttp.send();
      } else {
        reject();
      }
    });
  })
}

// Sends a POST request without a token
function httpPost(url, payload) {
  return new Promise((resolve, reject) => {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
      console.error('changed: ', xmlHttp.readyState, xmlHttp.status);
      if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
        resolve(JSON.parse(xmlHttp.responseText));
      } else if (xmlHttp.readyState == 4) {
        console.error('bad: ', xmlHttp.status)
        reject({status: 'FAIL'});
      }
    }
    chrome.storage.local.get('token', function(data) {
      if (data.token) {
        xmlHttp.open("POST", url, true);
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        xmlHttp.send(JSON.stringify(payload));
      } else {
        reject();
      }
    })
  })
}

// GET PASSWORD ------------------------------------------------------------

// Get the password for the current site
function getCurrentSitePassword(cleanURL) {
  return new Promise(async (resolve, reject) => {
    chrome.storage.local.get('url', (data) => {
      if (data.url) {
        requestEncrypted(`http://${data.url}:8080/manager/${cleanURL}`).then(
          ({username, password}) => {
            chrome.storage.local.set({username});
            chrome.storage.local.set({password});
            resolve();
          }
        ).catch(e => console.error('Unable to request ', JSON.stringify(e)));
      } else {
        reject();
      }
    });
  })
}


// When the tab loads, look for password inputs
chrome.webNavigation.onCompleted.addListener(() => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0] && tabs[0].url && !tabs[0].url.includes('chrome://')) {
      // Clear username/password storage
      chrome.storage.local.set({username: null});
      chrome.storage.local.set({password: null});
      // Save active site
      let cleanURL = tabs[0].url.split('//').pop().split('/')[0];
      chrome.storage.local.set({savedSite: cleanURL});
      // Capture data to offer to save
      chrome.tabs.executeScript(
        tabs[0].id,
        {
          file: 'captureData.js'
        }
      );
      // Save current tab url for use in injected script
      getCurrentSitePassword(cleanURL).then(() => {
        // Inject script to find password inputs
        chrome.tabs.executeScript(
          tabs[0].id,
          {
            file: 'findPassword.js'
          }
        );
      })//.catch(e => console.error('Unable to get password', e));
    }
  });
});

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

// CRYPTION FUNCTIONS ---------------------------------------------------------

async function sendEncrypted(address, data) {
  // 1) Get fresh key pair for message
  const { publicKey } = await createKeyPair();

  // 2) Try get Public key from server
  const response = await initiateHandshake(publicKey, address);

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
    return await httpPost(address, payload);
  } else {
    return;
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
    const aesIV = await RSADecrypt(privateKey, hex2ab(response.aesIV)).catch(e => console.error('try dec: ', e));

    // 5) Decrypt server response
    return new Promise((resolve, reject) => {
      const decrypted = {};
      const keys = Object.keys(response.aesData);
      keys.map((key, index) => {
        AESDecrypt(aesKey, aesIV, response.aesData[key]).then((data) => {
          decrypted[key] = data;
          if (index === keys.length - 1) {
            resolve(decrypted);
          }
        }).catch((error) => {
          console.error('Error decrypting: ', error);
          reject({});
        });
      });
    });
  } else {
    return {status: 'FAIL'};
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
  return await httpPost(address, payload);
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
  )
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