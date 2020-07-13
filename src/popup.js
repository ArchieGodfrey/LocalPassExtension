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

/*let changeColor = document.getElementById('changeColor');
let text = document.getElementById('urlText');
text.innerHTML = "Awaiting response";

chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});

/*
var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach(function(input) {
  if (input.type === 'password') {
    input.value = 'password';
  }
});


changeColor.onclick = function(element) {
  let url = document.getElementById('url');
  text.innerHTML = "Waiting for reponse";
  httpGetAsync(`${url.value}/manager/passwords`, (response) => {
    text.innerHTML = "Password available for site: " + response;
    let password = response;
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.executeScript(
          tabs[0].id,
          {code: 'var inputs = document.getElementsByTagName("input"); Array.prototype.slice.call(inputs).forEach(function(input) { if (input.type === "password") { input.value = "'+password+'";}});'});
    });
  });
};

/*changeColor.onclick = function(element) {
  let color = element.target.value;
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.executeScript(
        tabs[0].id,
        {code: 'document.body.style.backgroundColor = "' + color + '";'});
  });*/
// SERVER STATUS -----------------------------------------------------------

// Check if the server is on
function checkServer(url) {
  let serverStatus = document.getElementById('ServerStatus');
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
    checkServer(`http://${data.url}:8080/`)
  }
});
chrome.storage.sync.get('username', function(data) {
  let username = document.getElementById('Username');
  if (data.username) {
    username.value = data.username;
  }
});
chrome.storage.sync.get('token', function(data) {
  let accessStatus = document.getElementById('AccessStatus');
  if (data.token && data.token !== 'REVOKED') {
    accessStatus.innerHTML = "Access Granted";
    accessStatus.style.backgroundColor  = "green";
    Setup.style.display = 'none';
    Main.style.display = 'flex';
  }
});

// PAGE SWAPPING -----------------------------------------------------------

// Swap Between Pages
let showMain = document.getElementById('ShowMain');
let showSetup = document.getElementById('ShowSetup');
let scrollMain = document.getElementById('ScrollMain');
let showGenerate = document.getElementById('ShowGenerate');
let main = document.getElementById('Main');
let setup = document.getElementById('Setup');
let generate = document.getElementById('Generate');

// Swap to Setup
showMain.onclick = function() {
  main.style.display = 'flex';
  setup.style.display = 'none';
  generate.style.display = 'none';

  // Save settings
  let url = document.getElementById('Url').value;
  chrome.storage.sync.set({url});
  let username = document.getElementById('Username').value;
  chrome.storage.sync.set({username});
};

// Swap to Main
showSetup.onclick = function() {
  main.style.display = 'none';
  setup.style.display = 'flex';
  generate.style.display = 'none';
};

// Swap to Main
scrollMain.onclick = function() {
  main.style.display = 'flex';
  setup.style.display = 'none';
  generate.style.display = 'none';
};

// Swap to Generator
showGenerate.onclick = function() {
  main.style.display = 'none';
  setup.style.display = 'none';
  generate.style.display = 'flex';
};

// REQUEST ACCESS ---------------------------------------------------------

// Get access permission from device
let requestAccess = document.getElementById('RequestAccess');
let accessStatus = document.getElementById('AccessStatus');

// Send POST request and await response
requestAccess.onclick = function() {
  let url = document.getElementById('Url').value;
  let username = document.getElementById('Username').value;
  accessStatus.innerHTML = "Waiting for reponse on device";
  httpPostNoToken(`http://${url}:8080/auth/login`, {username}, (response) => {
    const token = JSON.parse(response);
    if (token && token.accessToken) {
      accessStatus.innerHTML = "Access Granted";
      accessStatus.style.backgroundColor  = "green";
      chrome.storage.sync.set({token: token.accessToken});
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

// Remove JWT Token from storage
revokeAccess.onclick = function() {
  chrome.storage.sync.set({token: 'REVOKED'});
  accessStatus.innerHTML = "Access Permission Required";
  accessStatus.style.backgroundColor  = "#FF6933"; 
}
// GET PASSWORD ------------------------------------------------------------

// Get the password for the current site
function getCurrentSitePassword() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTabURL = tabs[0].url;
    let cleanURL = activeTabURL.split('//').pop().split('/')[0];
    let url = document.getElementById('Url').value;
    document.getElementById('SavedSite').value = cleanURL;
    httpGet(`http://${url}:8080/manager/${cleanURL}`, (res) => {
      const response = JSON.parse(res);
      if (response && response.status === 'OK') {
        let savedSite = document.getElementById('SavedSite');
        savedSite.value = response.data.website;
        let savedUsername = document.getElementById('SavedUsername');
        savedUsername.readOnly = false;
        savedUsername.value = response.data.username;
        let savedPassword = document.getElementById('SavedPassword');
        savedPassword.readOnly = false;
        savedPassword.type = "password";
        savedPassword.value = response.data.password;
      } else {
        showError('Password Not Found');
      }
    });
  });
}

// Call on first load
getCurrentSitePassword();

// Get password on request
let getPassword = document.getElementById('GetPassword');

// Send a GET request to the server
getPassword.onclick = function() {
  getCurrentSitePassword();
};

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
      let serverStatus = document.getElementById('ServerStatus');
      serverStatus.style.backgroundColor = 'green';
      serverStatus.innerHTML = "Password Saved";
      setTimeout(() => {
        serverStatus.innerHTML = "Server Online";
      }, 3000);
    }
  })
}

// COPY DATA ---------------------------------------------------------------

// Copy inputs on first press
function onCopyToClipboard(id) {
  let element = document.getElementById(id);
  element.onfocus = function() {
    if (!element.readOnly) {
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
    } else {
      element.blur();
    }
  }
}

// Set listeners
onCopyToClipboard('SavedUsername');
onCopyToClipboard('SavedPassword');

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
  let special = document.getElementById('Special').value;

  // Generate random numbers
  let arrayOfNums = new Uint32Array(maxLength ? Math.ceil(maxLength / 10) : 3);
  window.crypto.getRandomValues(arrayOfNums);
  let array = new String(arrayOfNums).replace(/,/g, '').split('');

  // Apply criteria
  if (maxLength) {
    array = array.slice(0, maxLength);
  }
  if (uppercase) {
    function getRandomInt(min, max) {
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    let repeats = [];
    for (var i = 0; (i < uppercase && i < maxLength); i++) {
      let index = getRandomInt(0,array.length - 1);
      if (repeats.find((i) => i === index) !== undefined) {
        repeats = repeats.sort();
        index = repeats[repeats.length - 1] + 1;
      }
      console.log(repeats, index);
      array[index] = String.fromCharCode(65 + getRandomInt(0,25));
      repeats.push(index);
    }
  }
  if (special) {
    
  }

  // Display
  let newPassword = document.getElementById('NewPassword');
  newPassword.innerHTML = array.join('');
}