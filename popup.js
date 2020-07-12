// Async request
function httpGetAsync(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    chrome.storage.sync.get('accessToken', function(data) {
      xmlHttp.open("GET", url, true); // true for asynchronous
      xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.accessToken);
      xmlHttp.send();
    });
}

function httpPostAsync(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(xmlHttp.responseText);
    }
    xmlHttp.open("POST", url, true); // true for asynchronous
    //xmlHttp.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xmlHttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xmlHttp.send(JSON.stringify({ username: document.getElementById('username').value }));
}

let login = document.getElementById('login');
let loginStatus = document.getElementById('loginStatus');
let changeColor = document.getElementById('changeColor');
let text = document.getElementById('urlText');
text.innerHTML = "Awaiting response";

chrome.storage.sync.get('color', function(data) {
    changeColor.style.backgroundColor = data.color;
    changeColor.setAttribute('value', data.color);
});



login.onclick = function(element) {
  let url = document.getElementById('url');
  loginStatus.innerHTML = "Waiting for reponse on device";
  httpPostAsync(`${url.value}/auth/login`, (response) => {
    const token = JSON.parse(response);
    if (token.accessToken) {
      loginStatus.innerHTML = token.accessToken;
      chrome.storage.sync.set(token);
    } else if (token.access) {
      loginStatus.innerHTML = token.access;
    } else {
      loginStatus.innerHTML = 'No Response'
    }
  });
};

/*
var inputs = document.getElementsByTagName("input");
Array.prototype.slice.call(inputs).forEach(function(input) {
  if (input.type === 'password') {
    input.value = 'password';
  }
});
*/

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