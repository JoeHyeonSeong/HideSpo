
const actorNum=5;
let whiteList = [];
let movieData;
let blockPower;
try {
    chrome.storage.sync.get(['whiteList', 'movieDatas', 'blockPower'],
        items => {
            whiteList = (typeof items.whiteList == "undefined") ? [] : items.whiteList;
            movieData = (typeof items.movieDatas == "undefined") ? [] : items.movieDatas;
            blockPower = (typeof items.blockPower == "undefined") ? 1 : items.blockPower;

            //console.log(items);
        });
}
catch {
    console.log('fail to load data');
}
const url = chrome.runtime.getURL('datas/wordindex.json');
let wordindex;
fetch(url)
    .then((response) => response.json()) //assuming file contains json
    .then((json) => wordindex = json);

const nounUrl = chrome.runtime.getURL('datas/nouns.json');
let nouns;
fetch(nounUrl)
    .then((response) => response.json()) //assuming file contains json
    .then((json) =>{ nouns = new Set(json.data);});

chrome.tabs.onActivated.addListener(
    function (tabId) {
        //console.log("activate")
        let url;
        chrome.tabs.executeScript(tabId.tabId,
            { code: "document.domain" },
            function (results) {
                chrome.runtime.lastError;
                try {
                    url = results[0];
                    iconCheck(url);
                }
                catch {
                    iconCheck(undefined);
                }
            });


    }

);

chrome.tabs.onUpdated.addListener(function
    (tabId, changeInfo, tab) {
      // read changeInfo data and do something with it (like read the url)
      if (changeInfo.url) {
        // do something here
  
      }
    }
  );

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    //console.log('sender');
    //console.log(sender);
    if (request.message === "whiteListAdd") {
        //console.log("add");
        //console.log(request.url);
        let url = request.url;
        //console.log(url)
        addWhiteList(url);
        sendWhiteList_popup(url);
        sendWhiteList_content();
    }
    else if (request.message === "whiteListDelete") {
        //console.log("delete");
        let url = request.url;
        deleteWhiteList(url);
        sendWhiteList_popup(url);
        sendWhiteList_content();
    }
    else if (request.message === "whiteListCheck") {
        //console.log('check');
        let url = request.url;
        sendWhiteList_popup(url);
    } else if (request.message === "whiteListCheck_content") {
        sendWhiteList_content();
    } else if (request.message === "getMovieData") {
        updateContentScript();
    } else if (request.message === 'setMovieData') {
        let newData = request.movieData;
        if (request.add) {
            newData = trimRole(newData);
        }
        movieData = newData;
        chrome.storage.sync.set({ 'movieDatas': movieData });
        updateContentScript();
    } else if (request.message === 'blockPowerChange') {
        blockPower = request.blockPower;
        chrome.storage.sync.set({ 'blockPower': blockPower });
        updateContentScript();
    } else if (request.message === 'nlpCheck') {
        let result=await spoilerCheck(request.data);
        //console.log(request.data)
        //console.log(result)
        chrome.tabs.sendMessage(sender.tab.id,
            {
                message: 'nlpReply',
                isSpoiler: result,
                nodeNum:request.nodeNum
            });
    }else if(request.message === 'wordExist'){
        chrome.runtime.sendMessage({
            message: 'wordExistReply',
            exist: wordExist(word),
        });
    }
});

function trimRole(newData){
    let movie=newData[newData.length-1];
    let actors=[];
    //console.log(movie);
    for (let a of movie.actor.slice(0, actorNum)) {
        actors.push(a);
    }
    for (let a of movie.actor.slice(actorNum)) {
        if (!wordExist(a) && isNaN(a)) {
            actors.push(a);
        }
    }
    //console.log(actors);
    movie.actor = actors;
    return newData;
}

function sendWhiteList_content() {
    
    chrome.tabs.query({ active: true }, function (tabs) {
        //console.log(tabs)
        for(tab of tabs){
            //console.log(tab);
            let url=trimUrl(tab.url);
            //console.log(url);
            chrome.tabs.sendMessage(tab.id,
                {
                    message: 'whiteList',
                    onWhiteList: isOnWhiteList(url)
                });
            iconCheck(url)
        }
        /*
           chrome.tabs.executeScript(
            { code: "document.domain" },
            function (results) {
                chrome.runtime.lastError;
                console.log(results)
                if (results == undefined)
                    return;
                let url = results[0];
                chrome.tabs.sendMessage(tabs[0].id,
                    {
                        message: 'whiteList',
                        onWhiteList: isOnWhiteList(url)
                    });
                iconCheck(url)
            });
            */
    });

    
}

function sendWhiteList_popup(trimUrl) {
    chrome.runtime.sendMessage({
        message: 'whiteList',
        onWhiteList: isOnWhiteList(trimUrl)
    });
}

function updateContentScript() {
    chrome.runtime.sendMessage({
        message: 'getMovieDataReply',
        movieData: movieData,
        blockPower: blockPower
    });
    chrome.tabs.query({ active: true }, function (tabs) {
        for(let tab of tabs){
            //console.log(tabs);
            if (tab) { // Sanity check
                chrome.tabs.sendMessage(tab.id,
                    {
                        message: 'getMovieDataReply',
                        movieData: movieData,
                        blockPower: blockPower
                    });
            }
        }
    });
}

function iconCheck(url) {
    if(url==undefined){
        chrome.browserAction.setIcon({ path: "images/icon16.png" });
    }
    else{
        let onWhiteList = isOnWhiteList(url);
        if (onWhiteList)
            chrome.browserAction.setIcon({ path: "images/icon16.png" });
        else
            chrome.browserAction.setIcon({ path: "images/icon_green16.png" });
    }
}

function addWhiteList(url) {
    whiteList = whiteList.concat(url);
    chrome.storage.sync.set({ 'whiteList': whiteList });

    iconCheck(url);
}


function deleteWhiteList(url) {

    whiteList = whiteList.filter(info => info !== url);
    chrome.storage.sync.set({ 'whiteList': whiteList });
    iconCheck(url);
}

function trimUrl(url) {
    let i = 0;
    let cnt = 0;
    let second;
    for (; i < url.length; i++) {
        if (url[i] === '/') {
            cnt++;
            if (cnt === 2)
                second = i;
            if (cnt === 3)
                return url.substring(second+1, i);
        }
    }
    return url;
}

function isOnWhiteList(url) {
    //console.log(whiteList)
    for (wh of whiteList) {
        if (wh === url) {
            return true;
        }
    }
    return false;
}

async function spoilerCheck(str) {
    let requestUrl = "http://158.247.209.101:5000/predict"
    let data={contents:str}
    let response = await fetch(requestUrl, {
        method: 'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(data)
    })

    if (response.ok) {
        let json = await response.json();
        return json['output'];
    }
    else{
        return false;//서버 응답 없으면 다 스포 아님
    }
}

function wordExist(word) {
    return nouns.has(word);
}