chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        // read changeInfo data and do something with it
        // like send the new url to contentscripts.js
        console.log(changeInfo);
        if (changeInfo.url) {
            chrome.tabs.executeScript({file:'contentscript.js'});
            chrome.tabs.sendMessage(tabId, {
                message: 'urlChange',
                url: changeInfo.url
            })
        }
    }
);