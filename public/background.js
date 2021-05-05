
const actorNum=10;
let whiteList = [];
let movieData;
let blockPower;
let serverUrl="http://158.247.209.101:5000";
let nlpCheckMap=new Map();
let nlpCheckSendSet = new Set();
let isSpoilerSet;
let noSpoilerSet;
let userReportMap;

try {
    chrome.storage.sync.get(['whiteList', 'movieDatas', 'blockPower', 'isSpoilerSet', 'noSpoilerSet', 'userReportMap'],
        items => {
            whiteList = (typeof items.whiteList == "undefined") ? [] : items.whiteList;
            movieData = (typeof items.movieDatas == "undefined") ? [] : items.movieDatas;
            blockPower = (typeof items.blockPower == "undefined") ? 1 : items.blockPower;
            isSpoilerSet = (typeof items.isSpoilerSet == "undefined") ? [] : items.isSpoilerSet;
            noSpoilerSet = (typeof items.noSpoilerSet == "undefined") ? [] : items.noSpoilerSet;
            userReportMap = (typeof items.userReportMap == "undefined") ? [] : items.userReportMap;

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
clickHandler = function (onclickData, tab) {
    console.log(onclickData);
    console.log(tab);

    chrome.tabs.sendMessage(tab.id, {
        "message": "spoilerReportPopup",
        "data": onclickData.selectionText
    },{"frameId":onclickData.frameId});
}

chrome.contextMenus.create({
    "title":"스포일러 신고",
    "contexts":["selection"],
    "type":"normal",
    "onclick" : clickHandler
})


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
            for (const [i, v] of request.userReport.entries()) {
                report(i, v);
            }
            userReportMap = [];
        } else {
            addDataToMap(request.deletedMovie);
        }
        movieData = newData;
        chrome.storage.sync.set({ 'isSpoilerSet': isSpoilerSet });
        chrome.storage.sync.set({ 'noSpoilerSet': noSpoilerSet });
        chrome.storage.sync.set({ 'userReportMap': userReportMap });
        chrome.storage.sync.set({ 'movieDatas': movieData });
        updateContentScript();
    } else if (request.message === 'blockPowerChange') {
        blockPower = request.blockPower;
        chrome.storage.sync.set({ 'blockPower': blockPower });
        updateContentScript();
    } else if (request.message === 'nlpCheck') {
        spoilerCheck(request,sender.tab.id);

    } else if (request.message === 'wordExist') {
        chrome.runtime.sendMessage({
            message: 'wordExistReply',
            exist: wordExist(word),
        });
    } else if (request.message === "report") {
        report(request.data, request.isSpoiler);
    } else if (request.message === "setCache") {
        nlpCheckMap.set(request.data, request.isSpoiler);
    }
});

function sendNlpReply(tabId, isSpoiler, title, nodeNum, data, originData) {
    chrome.tabs.sendMessage(tabId,
        {
            message: 'nlpReply',
            isSpoiler: isSpoiler,
            title: title,
            nodeNum: nodeNum,
            data: data,
            originData: originData
        });
}

function addDataToSet(isSpoiler, originData, title) {
    if (isSpoiler) {
        isSpoilerSet.push([title, originData]);
        chrome.storage.sync.set({ 'isSpoilerSet': isSpoilerSet });
    }
    else {
        noSpoilerSet.push([title, originData]);
        chrome.storage.sync.set({ 'noSpoilerSet': noSpoilerSet });
    }
}

function addDataToMap(deletedMovie) {
    let number = 2;                                     //사용자에게 물어볼 문구 숫자/2
    let spoCount = 0;
    if (isSpoilerSet.length < number)                   //질문 숫자보다 적을린 없지만 그냥 제한 걸어둠
        number = isSpoilerSet.length;
    if (noSpoilerSet.length < number)
        number = noSpoilerSet.length;
    for (let [i, isSpo] of isSpoilerSet.sort(() => Math.random() - 0.5).entries()) {
        
        if (deletedMovie.filter(info => info == isSpo[0]).length) {
            if (spoCount < number) {
                userReportMap.push(isSpo[1]);
                spoCount++;
            }
            if (i == isSpoilerSet.length-1) {
                isSpoilerSet = [];       
            }
        }
    }  
    for (let [i, noSpo] of noSpoilerSet.sort(() => Math.random() - 0.5).entries()) {
        if (deletedMovie.filter(info => info == noSpo[0]).length) {
            if (spoCount < number * 2) {
                userReportMap.push(noSpo[1]);
                spoCount++;
            }
            if (i == noSpoilerSet.length - 1) {
                noSpoilerSet = [];
            }
        }
    }
    while (userReportMap.sort(() => Math.random() - 0.5).length > number * 2) {
        userReportMap.pop();
    }
    
    //chrome.storage.sync.set({ 'noSpoilerSet': noSpoilerSet });
}

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
        console.log(a);
        insertKeyword(actors, a[0]);
        for (let role of a[1]) {
            if (!wordExist(role)&&role.length>1) {
                insertKeyword(actors, role);
                let splitted = role.split(" ");
                if (splitted.length > 1&&!wordExist(splitted[0])&&splitted[0].length>1)
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
        for(tab of tabs){
            let url=trimUrl(tab.url);
            chrome.tabs.sendMessage(tab.id,
                {
                    message: 'whiteList',
                    onWhiteList: isOnWhiteList(url)
                });
            iconCheck(url)
        }
    });
}

function sendWhiteList_popup(trimUrl) {
    chrome.runtime.sendMessage({
        message: 'whiteList',
        onWhiteList: isOnWhiteList(trimUrl)
    });
}

function updateContentScript() {
    console.log(userReportMap);
    chrome.runtime.sendMessage({
        message: 'getMovieDataReply',
        movieData: movieData,
        blockPower: blockPower,
        userReportMap: userReportMap
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

async function spoilerCheck(request,tabId) {
    let result;
    if (nlpCheckMap.has(request.data)) {//캐시에 있음
        result = nlpCheckMap.get(request.data);
        sendNlpReply(tabId, result, request.title, request.nodeNum, request.data, request.originData);
        addDataToSet(result, request.originData, request.title);      
    }
    else if (!nlpCheckSendSet.has(request.data)){//서버에 이걸 보내지 않았으면 서버에서 호출
        nlpCheckSendSet.add(request.data);//서버에 보냈다고 체크
        let requestUrl = serverUrl + "/predict"
        let data = { contents: request.data }

        fetch(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(res => res.json())
        .then(function (response) {
            let result=response['output'];
            nlpCheckMap.set(request.data, result);
            console.log(result);
            sendNlpReply(tabId, result, request.title, request.nodeNum, request.data, request.originData);
            addDataToSet(result, request.originData, request.title);
        })
        .catch(error => console.log("server not response..."));
    }
}

async function report(str, isSpoiler) {

    let requestUrl = serverUrl + "/report";
    let data = { text: str, isSpoiler: isSpoiler }
    fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
}

function wordExist(word) {
    return nouns.has(word);
}