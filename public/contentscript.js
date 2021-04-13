var movieData;
var level = -1;
var movieDataLength = -1;
var whiteListChecker;
var nodeMap = new Map();
var nodeCount = 0;
let attachObserver=false;

String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}

shouldReplaceText = function (node,text) {
    var titleSpoiler = false;
    var actorSpoiler = false;
    var directorSpoiler = false;
    var isSpoiler = false;
    if (text.indexOf("http") == 0)
        return false;
    text = text.replaceAll('↵', "").trim();
    if (text.length == 0)
        return false;
    text = text.replaceAll("\n", " ");
    var replacedText = text;
    //there is no letter or number in the text
    for (let movie of movieData) {
        //keyword exact math
        //title
        for (let title of movie.title) {
            if (replacedText.indexOf(title) != -1)
                titleSpoiler=true;
            replacedText = replacedText.replaceAll(title, "타이틀")
        }
        //actor
        for (let actor of movie.actor) {
            if (replacedText.indexOf(actor) != -1)
                actorSpoiler = true;
            replacedText = replacedText.replaceAll(actor, "배우")
        }
        for (let director of movie.director) {
            if (replacedText.indexOf(director) != -1)
                directorSpoiler = true;
            replacedText = replacedText.replaceAll(director, "감독")
        }

    }
    switch (level) {
        case 1:
            if (actorSpoiler || titleSpoiler || directorSpoiler) {
                nodeMap.set(nodeCount, node);
                //console.log(text)
                chrome.runtime.sendMessage({
                    message: 'nlpCheck',
                    data: replacedText,
                    originData: text,
                    nodeNum:nodeCount
                });
                nodeCount++;
                break;
            }
        case 2:
            if (titleSpoiler)
                isSpoiler = true;
            break;

        case 3:
            if (actorSpoiler || directorSpoiler||titleSpoiler)
                isSpoiler = true;
        default:
            break;

    }
    return isSpoiler;
}

spoCheck = function (node) {
    let fontSize=-1;
    let allText=true;
    if (movieData.length <= 0)
        return 0;
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node) {
        return 0;
    }
    if (node.nodeName.toLowerCase() === "#text") {
        let text = node.textContent;
        text = text.replace(/\u200B/g, '');
        if (text.length==0)
            fontSize = 0;
        else
            fontSize = window.getComputedStyle(node.parentElement).fontSize;
        //console.log(node.textContent+" "+fontSize);
    }
    if (replaceDivIsEnabled(node, node.nodeName)) {
        let childList = [];
        for (let child of node.childNodes) {
            //console.log(child);
            if (child.nodeName == "#comment")
                continue;
            //1
            let childFontSize = spoCheck(child);
            //console.log(child.textContent+" "+childFontSize+" "+child.nodeName);
            if(fontSize!=childFontSize||childFontSize==0){
                //2
                if(fontSize!=-1)//init
                    allText=false;
                let replace = shouldReplaceText(node,combineListStr(childList));
                if (replace){
                    for(spoChild of childlist){
                        blurBlock(spoChild);
                    }
                }
                //new list
                fontSize = childFontSize;
                childList = [];
                if (childFontSize == 0)
                    allText = false;
                else
                    childList.push(child);
            }
            else {
                fontSize = childFontSize;
                childList.push(child);
            }
        }
        if(!allText){
            let replace = shouldReplaceText(node, combineListStr(childList));
            if (replace) {
                for (spoChild of childlist) {
                    blurBlock(spoChild);
                }
            }
        }
    }
    else {
        fontSize = 0;
    }
    if (!allText)
        fontSize=0;
    return fontSize;
}

combineListStr=function(childList){
    let str=""
    for(child of childList){
        str+=child.textContent+" ";
    }
    return str;
}

replaceDivIsEnabled = function (node, nodeName) {

    if ((nodeName == "#text") && (node.textContent.replaceAll('↵', "").trim().length == 0)) {
        return false;
    }

    var toLowerNodeName = nodeName.toLowerCase();

    if (toLowerNodeName == "head" ||
        toLowerNodeName == "noscript" ||
        toLowerNodeName == "script" ||
        toLowerNodeName == "style" ||
        toLowerNodeName == "time" ||
        toLowerNodeName == "meta" ||
        toLowerNodeName == "svg" ||
        toLowerNodeName == "path" ||
        toLowerNodeName == "button" ||
        toLowerNodeName == "input"
    ) {
        return false;
    }
    if (node.parentElement) {
        var toLowerParentElementLocalName = node.parentElement.localName.toLowerCase();
        return toLowerParentElementLocalName !== "head" &&
            toLowerParentElementLocalName !== "noscript" &&
            toLowerParentElementLocalName !== "script" &&
            toLowerParentElementLocalName !== "style" &&
            toLowerParentElementLocalName !== "time";
    }
}

blurBlock = function (node) {
    if (node.parentElement.className=="swal-text")
        return;
    node = findTargetParent(node);
    let blurText = "blur(6px)";
    if(node.isBlurred==undefined){
        node.isBlurred=true;
        node.style.filter = blurText;
        node.addEventListener("click", clickEventWrapper, false);
    }
}

clickEventWrapper=function(event){
    openBlurred(event, event.currentTarget);
}

openBlurred = function (event, node) {
    event.preventDefault();
    event.stopPropagation();
    //let removeBlur=confirm("스포일러일 가능성이 있습니다.\n정말 차단을 해제하시겠습니까?");
    swal({
        title: "정말 차단을 해제하시겠습니까?",
        text:"스포일러일 가능성이 있습니다.",
        buttons: {
            yes: { text: "O", value: true },
            no: { text: "X", value: false }
        },
        icon:"warning",
    }).then(
        (value) => {
            if (value) {
                
                chrome.runtime.sendMessage({
                    message: 'setCache',
                    data: node.spoilerText,
                    isSpoiler: false
                });
                
                node.style.filter = "";
                node.removeEventListener("click", clickEventWrapper, false);
                spoilerPopUp(node.originData,node.spoilerText);
            }
        }
    )
}

function spoilerPopUp(text,maskedText) {
    swal({
        title: "스포일러가 포함되어 있습니까?",
        text:text,
        buttons: {
            yes: { text: "O", value: "yes" },
            no: { text: "X", value: "no" },
            cancelButton: { text: "취소", value: "cancel" },
        },
        icon: "info",
    }).then(
        (value) => {
            let isSpoiler = null;
            if (value == "yes")
                isSpoiler = true;
            else if (value == "no")
                isSpoiler = false;
            else
                return;
            chrome.runtime.sendMessage({
                message: 'report',
                data: maskedText,
                isSpoiler: isSpoiler
            });
        }
    )
}

findTargetParent = function (start) {
    let cur = start;
    /*while (cur.parentElement != undefined) {
        if(cur.style&&cur.style.position=="absolute")
            return cur;
        let parentNode = cur.parentElement
        let siblingNodes = parentNode.childNodes;
        if (cur.nodeName == "LI")
            return cur;
        for (n of siblingNodes) {
            if (n != cur &&
                n.className == cur.className &&
                n.nodeName == cur.nodeName &&
                n.id == cur.id &&
                n.childNodes.length > 0) {
                return cur;
            }
        }
        cur = parentNode;
    }*/

    let result= start;
    if(result.nodeName=="#text")
        result=result.parentElement;
    return result;
}

AttachBlockObserver = function () {
    if(attachObserver)
        return;
    attachObserver=true;
    if (movieData ==undefined)
        return;
    spoCheck(document.body);
    
    let observer = new MutationObserver(function (mutations, observer) {
        for (mutation of mutations) {
            for (added of mutation.addedNodes) {
                spoCheck(added);
            }
        }
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document, {
        subtree: true,
        childList:true
        //...
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.message === 'getMovieDataReply') {
        movieData = request.movieData;
        /*
        if (movieDataLength > movieData.length || (movieData.length == 0 && movieDataLength == 1))
            window.location.reload();
        if (level != request.blockPower && level != -1) {

            window.location.reload();
        }
        */
        level = request.blockPower;
        if (request.onWhiteList == false || (request.onWhiteList == undefined && whiteListChecker == false)) {

            if (movieDataLength < movieData.length) {
                AttachBlockObserver();
            }
        }
        movieDataLength = movieData.length;
    }

    if (request.message === "whiteList") {
        if (request.onWhiteList && whiteListChecker == false) {
            whiteListChecker = request.onWhiteList;
            window.location.reload();
        }
        else if (!request.onWhiteList) {
            whiteListChecker = true;
            AttachBlockObserver();
        }
        whiteListChecker = request.onWhiteList;
    }
    if (request.message == 'nlpReply') {
        let node = nodeMap.get(request.nodeNum);
        //console.log(request.originData);
        //console.log(request.isSpoiler);
        if (request.isSpoiler) {
            if (node != undefined) {
                console.log(Date.now() - startTime);
                node.originData=request.originData;
                node.spoilerText=request.data;
                blurBlock(node);
            }

        }
    }
})

chrome.runtime.sendMessage({
    message: 'getMovieData',
    node:document.body
});

chrome.runtime.sendMessage({
    message: 'whiteListCheck_content'
});
startTime=Date.now();
//console.log("cur");