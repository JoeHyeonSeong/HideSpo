
const actorNum=10;
let whiteList = [];
let movieData;
let blockPower;
let serverUrl="http://158.247.209.101:5000";
let nlpCheckMap=new Map();

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
clickHandler = function(e) {
    console.log(e);
}

chrome.contextMenus.create({
    "title":"스포일러 신고",
    "contexts":["page", "selection", "image", "link"],
    "onclick" : clickHandler
})

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
        let result;
        if (nlpCheckMap.has(request.data))
            result = nlpCheckMap.get(request.data);
        else{
            result = await spoilerCheck(request.data);
            nlpCheckMap.set(request.data, result);
        }
        //console.log(request.data)
        //console.log(result)
        console.log(result);
        chrome.tabs.sendMessage(sender.tab.id,
            {
                message: 'nlpReply',
                isSpoiler: result,
                nodeNum: request.nodeNum,
                data: request.data,
                originData: request.originData
            });
    }else if(request.message === 'wordExist'){
        chrome.runtime.sendMessage({
            message: 'wordExistReply',
            exist: wordExist(word),
        });
    }else if(request.message==="report"){
        await report(request.data,request.isSpoiler);
    }
});

function trimRole(newData) {
    console.log(newData)
    let movie = newData[newData.length - 1];
    //title
    let titles = [];
    insertKeyword(titles, movie.title);
    titles.push(movie.title.split(/ |:/)[0]);
    titles.sort((a, b) => { return b.length - a.length });
    console.log(titles);
    movie.title=titles;
    //actor
    let actors = [];
    for (let a of movie.actor.slice(0, actorNum)) {
        insertKeyword(actors, a[0]);
        for (let role of a[1]) {
            if (!wordExist(role) && isNaN(role)) {
                insertKeyword(actors, role);
                let splitted = role.split(" ");
                if (splitted.length > 1&&!wordExist(splitted[0]) && isNaN(splitted[0]))
                    actors.push(splitted[0]);
            }
        }
    }
    actors.sort((a, b) => { return b.length - a.length });
    console.log(actors);
    movie.actor = actors;
    return newData;
}

function insertKeyword(list, keyword) {
    list.push(keyword);
    let trimmed = keyword.replaceAll(" ", "");
    if (trimmed != keyword)
        list.push(trimmed);
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
    let requestUrl = serverUrl+"/predict"
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

async function report(str, isSpoiler) {

    let requestUrl = serverUrl + "/report";
    let data = { text: str, isSpoiler: isSpoiler }
    nlpCheckMap.set(str, isSpoiler);
    await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
}

function wordExist(word) {
    return nouns.has(word);
}