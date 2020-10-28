let whiteList=[];
let onWhiteList=false;
try {
    chrome.storage.sync.get(['whiteList'],
        items => {
            whiteList = (typeof items.whiteList == "undefined") ? [] : items.whiteList;
            console.log(whiteList);
        });
}
catch {
    console.log('fail to load data');
}

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        try {
            chrome.tabs.getSelected(null, tabs => {
                urlChange(trimUrl(tabs.url));
            });
        }
        catch {
            console.log("fail to access");
        }
    }
);

chrome.tabs.onActivated.addListener(
    function (activeInfo) {
        try {
            chrome.tabs.getSelected(null, tabs => {
                urlChange(trimUrl(tabs.url));
            });
        }
        catch {
            console.log('fail to access');
        }
    }
);

chrome.runtime.onMessage.addListener( function(request,sender,sendResponse)
{
    console.log(request);
    if( request.message === "whiteListAdd" )
    {
        console.log("add");
        addWhiteList(trimUrl(request.url));
    }
    else if( request.message === "whiteListDelete" )
    {
        console.log("delete");
        deleteWhiteList(trimUrl(request.url));
    }
    else if(request.message==="whiteListCheck"){
        console.log('check');
        urlChange(trimUrl(request.url));
    }
});

function urlChange(url) {
    let newOnWhiteList = isOnWhiteList(url);
    console.log(newOnWhiteList);
    if (onWhiteList != newOnWhiteList) {
        onWhiteList = newOnWhiteList;
        if (onWhiteList)
            chrome.browserAction.setIcon({ path: "images/icon_green16.png" });
        else
            chrome.browserAction.setIcon({ path: "images/icon16.png" });
    }
    if(!onWhiteList){
        chrome.tabs.executeScript({ file: 'contentscript.js' });
    }
    chrome.runtime.sendMessage({
        message: 'whiteList',
        onWhiteList: onWhiteList
    });
}

function addWhiteList(url) {
    whiteList = whiteList.concat(url);
    chrome.storage.sync.set({ 'whiteList': whiteList });
    urlChange(url);
}


function deleteWhiteList(url) {

    whiteList = whiteList.filter(info => info !== url);
    chrome.storage.sync.set({ 'whiteList': whiteList });
    urlChange(url);
}

function trimUrl(url){
    let i = 0;
    let cnt = 0;
    for (; i < url.length; i++) {
        if (url[i] === '/') {
            cnt++;
            if (cnt === 3)
                return url.substring(0,i);
        }
    }
    return url;
}

function isOnWhiteList(url) {
    console.log('target '+url);
    for (wh of whiteList) {
        console.log(wh);
        if (wh === url){
            console.log('match!');
            return true;
        }
    }
    return false;
}