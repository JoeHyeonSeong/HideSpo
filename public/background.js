
const start = async function () {
    const model = await tf.loadLayersModel('./datas/spoilerModel/model.json');
    return model;
}

const model = start();
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

            console.log(items);
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
    .then((json) => nouns = json);

chrome.tabs.onUpdated.addListener(
    function (tabId, changeInfo, tab) {
        console.log('update');
        let url;
        chrome.tabs.executeScript(tabId.tabId,
            { code: "document.domain" },
            function (results) {
                url = results[0];
                iconCheck(url);
            });
    }
);

chrome.tabs.onActivated.addListener(
    function (tabId, changeInfo, tab) {
        console.log('activate');
        let url;
        console.log(tabId);
        chrome.tabs.executeScript(tabId.tabId,
            { code: "document.domain" },
            function (results) {
                url = results[0];
                iconCheck(url);
            });
    }

);

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    console.log('sender');
    console.log(sender);
    if (request.message === "whiteListAdd") {
        console.log("add");
        console.log(request.url);
        let url = request.url;
        addWhiteList(url);
        sendWhiteList_popup(url);
        sendWhiteList_content();
    }
    else if (request.message === "whiteListDelete") {
        console.log("delete");
        let url = request.url;
        deleteWhiteList(url);
        sendWhiteList_popup(url);
        sendWhiteList_content();
    }
    else if (request.message === "whiteListCheck") {
        console.log('check');
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
        let isSpoiler=await spoilerCheck(request.data);
        chrome.tabs.sendMessage(sender.tab.id,
            {
                message: 'nlpReply',
                isSpoiler: isSpoiler,
                data: request.data,
                nodeNumber: request.nodeNumber,
                nodeType: request.nodeType
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
    console.log(movie);
    for(let a of movie.actor.slice(0,actorNum)){
        actors.push(a);
    }
    for(let a of movie.actor.slice(actorNum)){
        let words=a.split(' ');
        let combine="";
        for(let w of words){
            if(!wordExist(w)){
                combine=combine+" "+w;
            }
        }
        combine=combine.trim();
        if(combine!="")
            actors.push(combine.trim());
    }
    console.log(actors);
    movie.actor=actors;
    return newData;
}
function sendWhiteList_content() {

    chrome.tabs.query({ active: true }, function (tabs) {
        let url;
        chrome.tabs.executeScript(
            { code: "document.domain" },
            function (results) {
                url = results[0];
                chrome.tabs.sendMessage(tabs[0].id,
                    {
                        message: 'whiteList',
                        onWhiteList: isOnWhiteList(url)
                    });
            });

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

function iconCheck(url) {
    console.log('urlChange!');
    let onWhiteList = isOnWhiteList(url);
    if (onWhiteList)
        chrome.browserAction.setIcon({ path: "images/icon16.png" });
    else
        chrome.browserAction.setIcon({ path: "images/icon_green16.png" });
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
    for (; i < url.length; i++) {
        if (url[i] === '/') {
            cnt++;
            if (cnt === 3)
                return url.substring(0, i);
        }
    }
    return url;
}

function isOnWhiteList(url) {
    for (wh of whiteList) {
        if (wh === url) {
            return true;
        }
    }
    return false;
}

async function spoilerCheck(str) {
    let words = await preprocess(str);
    return nlpCheck(words);
}

async function preprocess(str) {
    let response = await fetch("https://open-korean-text-api.herokuapp.com/tokenize?text=" + str);
    if (response.ok) {
        let json = await response.json();
        let words = [];
        for (let token of json.tokens) {
            let split = token.split(/:|\(/);
            let blockPumsa = ['Punctuation', 'Foreign', 'Alpha', 'URL', "ScreenName", "Josa"];
            if (!blockPumsa.includes(split[1])) {
                let newWord = split[0];
                if (split[1] == 'Noun')
                    newWord = properNounLabel(split[0])
                words.push(newWord);
            }
        }
        return words;
    }
    return null;
}

function properNounLabel(word) {
    for (let info of movieData) {
        if (info.title.trim() == word)
            return "<타이틀>";
        for (let director of info.director){
            if (director.trim() == word)
                return "<감독>";
        }
        for (let actor of info.actor){
            if (actor.trim() == word)
                return "<배우>";
        }
    }
    return word;
}

async function nlpCheck(words) {
    console.log(words);
    const max_len = 41;
    var indexArr = new Array(max_len).fill(0);
    var isSpoiler=false;
    //------------wordindex ġȯ--------------
    for (var i in words) {
        if (wordindex[words[i]] != undefined) {
            indexArr[i] = wordindex[words[i]];
        } else {
            indexArr[i] = 1;
        }
    }
    //----------model load and predict--------
    await model.then(function (res) {

        const shape = [1, max_len];
        const example = tf.tensor(indexArr, shape);
        //example.print();

        const prediction = res.predict(example);
        //console.log(prediction);//prediction�� Tensor info
        const tensorData = prediction.dataSync();
        console.log(tensorData[1]);
        if (tensorData[1] > 0.5) {
            isSpoiler=true;
        } else {
            isSpoiler=false;
        }
    }, function (err) {
        console.log('Model Loading Error!');
    });
    return isSpoiler;
}

function wordExist(word) {
    console.log(word);
    console.log(wordindex[word]);
    return nouns.data.find(element=>word==element) != undefined;
}