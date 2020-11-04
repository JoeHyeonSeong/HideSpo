let whiteList=[];
let onWhiteList=false;
let movieData;
let blockPower;
try {
    chrome.storage.sync.get(['whiteList','movieDatas','blockPower'],
        items => {
            whiteList = (typeof items.whiteList == "undefined") ? [] : items.whiteList;
            movieData=(typeof items.movieDatas == "undefined") ? [] : items.movieDatas;
            blockPower=(typeof items.blockPower == "undefined") ? 1 : items.blockPower;
            
            console.log(items);
        });
}
catch {
    console.log('fail to load data');
}

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        if (changeInfo.status == 'complete') {
            try {
                chrome.tabs.getSelected(null, tabs => {
                    urlChange(trimUrl(tabs.url,true));
                });
            }
            catch {
                console.log("fail to access");
            }
        }
    }
);

chrome.tabs.onActivated.addListener(
    function (tabId, changeInfo, tab) {
        try {
            chrome.tabs.getSelected(null, tabs => {
                urlChange(trimUrl(tabs.url,false));
            });
        }
        catch {
            console.log("fail to access");
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
    }else if(request.message==="getMovieData"){
        updateContentScript();
    }else if(request.message==='setMovieData'){
        movieData=request.movieData;
        chrome.storage.sync.set({ 'movieDatas': movieData });
        updateContentScript();
    }else if(request.message==='blockPowerChange'){
        blockPower=request.blockPower;
        chrome.storage.sync.set({'blockPower':blockPower});
        updateContentScript();
    }
});

function updateContentScript(){
    chrome.runtime.sendMessage({
        message: 'getMovieDataReply',
        movieData: movieData,
        blockPower: blockPower
    });
    chrome.tabs.query({ active: true}, function (tabs) {
        var currTab = tabs[0];
        console.log(tabs);
        if (currTab) { // Sanity check
            chrome.tabs.sendMessage(currTab.id,
                {
                    message: 'getMovieDataReply',
                    movieData: movieData,
                    blockPower: blockPower
                });
        }
    });
}

function urlChange(url,excute) {
    let newOnWhiteList = isOnWhiteList(url);
    if (onWhiteList != newOnWhiteList) {
        onWhiteList = newOnWhiteList;
        if (onWhiteList)
            chrome.browserAction.setIcon({ path: "images/icon16.png" });
        else
            chrome.browserAction.setIcon({ path: "images/icon_green16.png" });
    }
    if(!onWhiteList&&excute){
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
    urlChange(url,true);
}


function deleteWhiteList(url) {

    whiteList = whiteList.filter(info => info !== url);
    chrome.storage.sync.set({ 'whiteList': whiteList });
    urlChange(url,true);
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