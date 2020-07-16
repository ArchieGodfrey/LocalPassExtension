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
        } else if (xmlHttp.status === 401) {
          onRevokeAccess('Please Request Access Again')
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('GET Request Failed: ' + xmlHttp.status);
        }  
    }
    chrome.storage.sync.get('token', function(data) {
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

// Sends a POST request with a token
function httpPost(url, payload, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        } else if (xmlHttp.status !== 0 && xmlHttp.status != 200) {
          showError('POST Request Failed: ' + xmlHttp.status);
        } 
    }
    chrome.storage.sync.get('token', function(data) {
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
chrome.storage.sync.get('url', function(data) {
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
chrome.storage.sync.get('localUsername', function(data) {
  let LocalUsername = document.getElementById('LocalUsername');
  if (data.localUsername) {
    LocalUsername.value = data.localUsername;
  }
});
chrome.storage.sync.get('token', function(data) {
  let accessStatus = document.getElementById('AccessStatus');
  if (data.token && data.token !== 'REVOKED') {
    accessStatus.innerHTML = "Access Granted";
    accessStatus.style.backgroundColor  = "green";
    document.getElementById('RevokeAccess').style.display = 'none';
    Setup.style.display = 'none';
    Main.style.display = 'flex';
  }
});
chrome.storage.sync.get('savedPassword', function(password) {
  chrome.storage.sync.get('savedUsername', function(username) {
    chrome.storage.sync.get('savedSite', function(site) {
      if (site.savedSite) {
        let savedSite = document.getElementById('SavedSite');
        savedSite.value = site.savedSite;
      }
      if (username.savedUsername) {
        let savedUsername = document.getElementById('SavedUsername');
        savedUsername.value = username.savedUsername;
      }
      if (password.savedPassword ) {
        let savedPassword = document.getElementById('SavedPassword');
        savedPassword.value = password.savedPassword;
        let showSave = document.getElementById('ShowSave');
        showSave.style.display = 'block';
      }
    })
  })
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
  chrome.storage.sync.set({url});
  let localUsername = document.getElementById('LocalUsername').value;
  chrome.storage.sync.set({localUsername});
};

// Swap to Generator
showGenerate.onclick = function() {
  showPage(generate);
};

// Swap to Saved Data
showSave.onclick = function() {
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
  httpPostNoToken(`http://${url}:8080/auth/login`, {username: LocalUsername}, (response) => {
    const token = JSON.parse(response);
    if (token && token.accessToken) {
      accessStatus.innerHTML = "Access Granted";
      accessStatus.style.backgroundColor  = "green";
      chrome.storage.sync.set({token: token.accessToken});
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

function onRevokeAccess(message) {
  chrome.storage.sync.set({token: 'REVOKED'});
  accessStatus.innerHTML = message;
  accessStatus.style.backgroundColor  = "#FF6933";
  serverStatus.innerHTML = message;
  serverStatus.style.backgroundColor  = "#FF6933";
  document.getElementById('RevokeAccess').style.display = 'none';
}

// Remove JWT Token from storage
revokeAccess.onclick = function() {
  onRevokeAccess("Access Permission Required");
}

// SAVE PASSWORD -----------------------------------------------------------

// Save password on request
let savePassword = document.getElementById('SavePassword');

// Send POST request with data
savePassword.onclick = function() {
  let website = document.getElementById('SavedSite').value;
  let username = document.getElementById('SavedUsername').value;
  let password = document.getElementById('SavedPassword').value;
  let payload = {website,username,password};
  let url = document.getElementById('Url').value;
  httpPost(`http://${url}:8080/manager`, payload, (res) => {
    const response = JSON.parse(res);
    if (response && response.status === 'OK') {
      let appStatus = document.getElementById('AppStatus');
      appStatus.style.backgroundColor = 'green';
      appStatus.innerHTML = "Password Saved";
      // Clear saved data
      chrome.storage.sync.set({savedSite: null});
      chrome.storage.sync.set({savedUsername: null});
      chrome.storage.sync.set({savedPassword: null});
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

// FORM TRIGGER ------------------------------------------------------------

