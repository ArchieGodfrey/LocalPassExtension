// HTTP REQUESTS -----------------------------------------------------------

// Sends a GET request with a token
function httpGet(url, callback)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() { 
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
          callback(xmlHttp.responseText);
        }
    }
    chrome.storage.local.get('token', function(data) {
      if (data.token) {
        xmlHttp.open("GET", url, true);
        xmlHttp.setRequestHeader('Authorization', 'Bearer ' + data.token);
        xmlHttp.send();
      }
    });
}

// GET PASSWORD ------------------------------------------------------------

// Get the password for the current site
function getCurrentSitePassword(cleanURL, callback) {
  chrome.storage.local.get('url', function(data) {
    httpGet(`http://${data.url}:8080/manager/${cleanURL}`, (res) => {
      const response = JSON.parse(res);
      if (response && response.status === 'OK') {
        chrome.storage.local.set({username: response.data.username});
        chrome.storage.local.set({password: response.data.password});
        callback();
      }
    });
  });
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
      getCurrentSitePassword(cleanURL, () => {
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