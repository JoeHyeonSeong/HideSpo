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

shouldReplaceText = function (node) {
    var titleSpoiler = false;
    var actorSpoiler = false;
    var directorSpoiler = false;
    var text = node.data;
    var isSpoiler = false;
    if (text.indexOf("http") == 0)
        return false;
    text = text.replaceAll('↵', "").trim();
    if (text.length == 0)
        return false;

    text = text.replaceAll("\n", " ");
    //there is no letter or number in the text
    for (let movie of movieData) {
        //title
        if (text.indexOf(movie.title) != -1)
            titleSpoiler = true;
        text = text.replaceAll(movie.title, "타이틀")
        //actor
        for (let actor of movie.actor) {
            if (text.indexOf(actor) != -1)
                actorSpoiler = true;
            text = text.replaceAll(actor, "배우")
        }
        for (let director of movie.director) {
            if (text.indexOf(director) != -1)
                directorSpoiler = true;
            text = text.replaceAll(director, "감독")
        }
    }
    switch (level) {
        case 1:
            if (actorSpoiler || titleSpoiler || directorSpoiler) {
                if (text == "타이틀" || text == "감독" || text == "배우")
                    break;
                nodeMap.set(nodeCount, node);

                chrome.runtime.sendMessage({
                    message: 'nlpCheck',
                    data: text,
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
    if (movieData.length <= 0)
        return;
    let textContent=node.textContent;
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node||textContent=="") {
        return;
    }
    if (replaceDivIsEnabled(node, node.nodeName)) {
        for (let child of node.childNodes) {

            //NOTE: sometimes the nodename is lowercase
            if (child === undefined)
                continue;
            var toLowerchildNodeName = child.nodeName.toLowerCase();
            //a sometimes contains inner elements, so we have to start with A replacement
            if (toLowerchildNodeName === "#text") {
                var replace = shouldReplaceText(child);
                if (replace)
                    blurBlock(child);
            } else {
                //check if already marked
                //NOTE: we don't call it on the created div
                spoCheck(child);
            }
        }
    }
}

replaceDivIsEnabled = function (node, nodeName) {

    if ((nodeName == "#text") && (node.data.replaceAll('↵', "").trim().length == 0)) {
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

blurBlock = function (textNode) {
    if(textNode.parentElement.className=="swal-text")
        return;
    let elementToReplace = findTargetParent(textNode);
    let blurText = "filter:blur(0.6em)";
    let styleText=elementToReplace.getAttribute("style");
    if (styleText==null||styleText != blurText) {
        elementToReplace.style.filter="blur(0.6em)";
        elementToReplace.spoilerText=textNode.data;
        elementToReplace.addEventListener("click", clickEventWrapper, false);
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
            yes: { text: "예", value: true },
            no: { text: "아니오", value: false }
        },
        icon:"warning",
    }).then(
        (value) => {
            if (value) {
                node.style.filter = "";
                node.removeEventListener("click", clickEventWrapper, false);
                spoilerPopUp(node.spoilerText);
            }

        }
    )
}

function spoilerPopUp(text) {
    swal({
        title: "스포일러가 포함되어 있습니까?",
        text:text,
        buttons: {
            yes: { text: "예", value: "yes" },
            no: { text: "아니오", value: "no" }
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
                data: text,
                isSpoiler: isSpoiler
            });
        }
    )
}

findTargetParent = function (start) {
    let cur = start;
    while (cur.parentElement != undefined) {
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
    }

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
        if (request.isSpoiler && node != undefined) {
            let nodename = node.nodeName.toLowerCase();
            if (nodename == "a" || nodename == "#text")
                blurBlock(node);
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

//console.log("cur");