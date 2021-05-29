var movieData;
var blockPower = -1;
var nodeMap = new Map();
var nodeCount = 0;
let attachObserver=false;
let cutLen=70;

String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}

///해당 문장에 영화 키워드가 있는지 확인하고 스포일러 정도에 따라 가려야할지 결정
///만약 1단계라면 백그라운드에 판별 요청
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
    let targetTitle;
    var replacedText = text;
    //there is no letter or number in the text
    for (let movie of movieData) {
        //keyword exact math
        //title
        for (let title of movie.title) {
            if (replacedText.indexOf(title) != -1){
                titleSpoiler=true;
                targetTitle = movie.title;
            }
            replacedText = replacedText.replaceAll(title, "타이틀")
        }
        //actor
        for (let actor of movie.actor) {
            if (replacedText.indexOf(actor) != -1){
                actorSpoiler = true;
                targetTitle = movie.title;
            }
            replacedText = replacedText.replaceAll(actor, "배우")
        }
        for (let director of movie.director) {
            if (replacedText.indexOf(director) != -1){
                directorSpoiler = true;
                targetTitle = movie.title;
            }
            replacedText = replacedText.replaceAll(director, "감독")
        }
    }
    if (blockPower == "1") {
        if (actorSpoiler || titleSpoiler || directorSpoiler) {
            nodeMap.set(nodeCount, node);
            chrome.runtime.sendMessage({
                message: 'nlpCheck',
                title:targetTitle,
                data: replacedText,
                originData: text,
                nodeNum: nodeCount
            });
            nodeCount++;
        }
    }
    else if (blockPower == "2") {
        if (titleSpoiler) {
            isSpoiler = true;
        }
    }
    else if (blockPower == "3") {
        if (actorSpoiler || directorSpoiler || titleSpoiler)
            isSpoiler = true;
    }


    
    return [isSpoiler, replacedText];
}

maskToMovieInfo=function(text){
    text = text.replaceAll("\n", " ");
    for (let movie of movieData) {
        //keyword exact match
        //title
        for (let title of movie.title) {
            text = text.replaceAll(title, "타이틀")
        }
        //actor
        for (let actor of movie.actor) {
            text = text.replaceAll(actor, "배우")
        }
        //director
        for (let director of movie.director) {
            text = text.replaceAll(director, "감독")
        }

    }
    return text;
}

///각 돔오브젝트에 대해 재귀적으로 내려가며 가려야할지 판단
///문장 범위 판단
spoCheck = function (node) {
    let fontSize=-1;
    let allText=true;
    let text=node.textContent;
    let borderWidth = "0px";
    if (movieData.length <= 0)
        return 0;
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node) {
        return 0;
    }
    //borderWidth구하기
    try {
        childStyle = window.getComputedStyle(node);
        borderWidth = childStyle.getPropertyValue('border-width');
    } catch { }
    if(borderWidth!="0px")
        fontSize=0;

    if (node.nodeName.toLowerCase() === "#text") {
        text = text.replace(/\u200B/g, '');
        if (text.length == 0)
            fontSize = 0;
        else{
            try {
                fontSize = window.getComputedStyle(node.parentElement).fontSize;
            }
            catch {
                fontSize = 0;
            }
        }
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
            //묶는거 멈추기
            if (fontSize != childFontSize || childFontSize == 0) {
                //2
                if (fontSize != -1)//fontSize가 초기값이 아님
                    allText=false;
                let replace= shouldReplaceText(node,combineListStr(childList));
                if (replace[0]){
                        blurBlock(node,text,replace[1]);
                }
                //new list
                fontSize = childFontSize;
                childList = [];
                if (childFontSize == 0)
                    allText = false;
                else
                    childList.push(child);
            }//추가
            else {
                fontSize = childFontSize;
                childList.push(child);
            }
        }
        if(!allText){
            let replace = shouldReplaceText(node, combineListStr(childList));
            if (replace[0]) {
                blurBlock(node,text,replace[1]);
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

///돔오브젝트 리스트의 텍스트를 합침
combineListStr=function(childList){
    let str=""
    for(child of childList){
        str+=child.textContent+" ";
    }
    return str;
}

///???
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

///node를 블러처리함
blurBlock = function (node,originalText,maskedText) {
    if (node.parentElement.className=="swal-text")
        return;
    node = findTargetParent(node);
    node.originData=originalText;
    node.spoilerText=maskedText;
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

///블러 해제할지 팝업창
openBlurred = function (event, node) {
    event.preventDefault();
    event.stopPropagation();
    //let removeBlur=confirm("스포일러일 가능성이 있습니다.\n정말 차단을 해제하시겠습니까?");
    swal({
        title: "정말 차단을 해제하시겠습니까?",
        text:"스포일러일 가능성이 있습니다.",
        buttons: {
            yes: { text: "확인", value: true },
            cancelButton: { text: "취소", value: false },
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

///스포일러가 포함되어있는지 팝업창으로 물어봄
///text는 보여질 데이터
///maskedText는 서버에 전송할 데이터
function spoilerPopUp(text,maskedText) {
    if(text.length>cutLen)
        text=text.substring(0,cutLen)+"...";
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

///start를 가려야할때 적절히 가릴 상위의 노드를 찾음
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
                //n.id == cur.id &&
                n.childNodes.length==cur.childNodes.length) {
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

///반응형에 대응하기 위해 돔 오브젝트 바뀌면 스포일러 체크하도록 이벤트 추가함
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
        blockPower = request.blockPower;
    }

    if (request.message === "whiteList") {
        if (!request.onWhiteList) {
            AttachBlockObserver();
        }
    }
    if (request.message == 'nlpReply') {
        let node = nodeMap.get(request.nodeNum);
        //console.log(request.originData);
        //console.log(request.isSpoiler);
        if (request.isSpoiler) {
            if (node != undefined) {
                console.log(Date.now() - startTime);
                blurBlock(node,request.originData,request.data);
            }

        }
    }
    if (request.message == 'spoilerReportPopup') {
        spoilerPopUp(request.data,maskToMovieInfo(request.data));
    }
})

///백그라운드에 영화 데이터 요청
chrome.runtime.sendMessage({
    message: 'getMovieData',
    node:document.body
});

///백그라운드에 화이트리스트 데이터 요청
chrome.runtime.sendMessage({
    message: 'whiteListCheck_content'
});
startTime=Date.now();
//console.log("cur");