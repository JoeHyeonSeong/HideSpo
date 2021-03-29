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

shouldReplaceText = function (node, textNode) {
    var titleSpoiler = false;
    var actorSpoiler = false;
    var directorSpoiler = false;
    var text = textNode.textContent;// node.data 를 textContent로 바꿈
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
        return false;
    let textContent=node.textContent;
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node||textContent=="") {
        return false;
    }
    if (replaceDivIsEnabled(node, node.nodeName)) {
        var childCount = 0;
        var tempTag = "";                   //같은 태그의 형제들을 가지고있는지 확인하기 위한 임시 변수
        var checkPlural = false;            //노드 자식들의 복수인지 아닌지 체크하기위한 변수
        var checkChildWithText = false;     //노드 자식들이 text노드 포함되어있는지 확인, checktext로 반환된 값을 상위로 올려줌
        var checkText = false;              //text노드인지 확인
        var checkIfDivided = false;         //분할되었는지 확인
        var wrapper = document.createElement("div");
        var checkRemoveChild = false;
        for (let child of node.childNodes) {
            var toLowerchildNodeName = child.nodeName.toLowerCase();
            //NOTE: sometimes the nodename is lowercase
            if (child === undefined)
                continue;
            if (toLowerchildNodeName == "#comment")
                continue;       
            childCount++;
            if (childCount == 1) {
                tempTag = toLowerchildNodeName;
                checkPlural = true;
            } else {
                if (tempTag != toLowerchildNodeName && toLowerchildNodeName != "#text" && tempTag != "#text")                    
                    checkPlural = false;
                if (toLowerchildNodeName != "#text")
                    tempTag = toLowerchildNodeName;
            }
            
            if (toLowerchildNodeName === "#text") {
                if (child.textContent.replace(/(\s*)/g, "") != "")
                    checkText = true;
                var oldNode = child.cloneNode(false);
                wrapper.appendChild(oldNode);
                if (childCount == node.childNodes.length && childCount != 1) {
                    wrapper.normalize();
                    checkText = false;
                    if (wrapper.textContent.replace(/(\s*)/g,"") != "") {
                        //console.log("_________");
                        //console.log(wrapper.textContent);
                        var replace = shouldReplaceText(child,wrapper);
                        wrapper = document.createElement("div");
                        /*if (replace)
                            blurBlock(child);*/
                    }
                }
            } else {
                //NOTE: we don't call it on the created div
                if (spoCheck(child))
                    checkChildWithText = true;
            }
        }
        if (checkPlural && checkChildWithText) {
            for (let child of node.childNodes) {
                if (child === undefined)
                    continue;
                if (child.nodeName.toLowerCase() == "#comment")
                    continue;
                var oldNode = child.cloneNode(true);
                wrapper.appendChild(oldNode);
                var spaceNode = document.createTextNode(' ');

                if ((child.textContent.replace(/(\s*)/g, "") == "" || child.textContent.length == 1) || (wrapper.textContent.length > 100)) {
                    if (wrapper.textContent.length > 100) {
                        wrapper.removeChild(oldNode);
                        checkRemoveChild = true;
                    }
                    if (wrapper.textContent.replace(/(\s*)/g, "").length > 1) {
                        checkIfDivided = true;
                        //console.log("_________");
                        //console.log(wrapper.textContent);
                        var replaceDivided = shouldReplaceText(node, wrapper);
                        /*if (replaceDivided)
                            blurBlock(node);*/
                    }
                    wrapper = document.createElement("div");
                } else {
                    wrapper.appendChild(spaceNode);
                }
                if (checkRemoveChild) {
                    checkRemoveChild = false;
                    wrapper.appendChild(oldNode);
                }
            }
            if (!checkIfDivided) {
                if (childCount > 1) {
                    if (wrapper.textContent.replace(/(\s*)/g, "") != "") {
                        //console.log("_________");
                        //console.log(node.textContent);
                        var replaceConcat = shouldReplaceText(node, node);
                        /*if (replaceConcat)
                            blurBlock(node);*/
                    }
                } else {
                    checkText = true;
                }
            }
        } 
        return checkText;
    }
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

blurBlock = function (node, text) {
    if (node.parentElement.className=="swal-text")
        return;
    let elementToReplace = findTargetParent(node);
    let blurText = "filter:blur(0.6em)";
    let styleText=elementToReplace.getAttribute("style");
    if (styleText==null||styleText != blurText) {
        elementToReplace.style.filter="blur(0.6em)";
        elementToReplace.spoilerText = text
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
            yes: { text: "O", value: true },
            no: { text: "X", value: false }
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
            yes: { text: "O", value: "yes" },
            no: { text: "X", value: "no" }
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
            //if (nodename == "a" || nodename == "#text")
            console.log(Date.now() - startTime);
            console.log(request.data);
            blurBlock(node, request.data);
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