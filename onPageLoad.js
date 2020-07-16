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

// GET PASSWORD ------------------------------------------------------------

// Get the password for the current site
function getCurrentSitePassword(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var activeTabURL = tabs[0].url;
    let cleanURL = activeTabURL.split('//').pop().split('/')[0];
    chrome.storage.sync.get('url', function(data) {
      httpGet(`http://${data.url}:8080/manager/${cleanURL}`, (res) => {
        const response = JSON.parse(res);
        if (response && response.status === 'OK') {
          chrome.storage.sync.set({username: response.data.username});
          chrome.storage.sync.set({password: response.data.password});
          callback();
        }
      });
    });
  });
}


// When the tab loads, look for password inputs
chrome.webNavigation.onCompleted.addListener(function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0].url && !tabs[0].url.includes('chrome://')) {
      // Clear username/password storage
      chrome.storage.sync.set({username: null});
      chrome.storage.sync.set({password: null});
      // Save current tab url for use in injected script
      getCurrentSitePassword(function() {
        // Inject script to find password inputs
        chrome.tabs.executeScript(
          tabs[0].id,
          {
            file: 'findPassword.js'
          }
        );
      });
    }
  });
});