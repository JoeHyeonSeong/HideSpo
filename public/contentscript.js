
    REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME = "data-replacer-element-marker"

    REPLACE_NEEDED_ATTRIBUTE_NAME = "data-replace-needed"

    ATTRIBUTE_FOR_SPONONO = "attribute-for-sponono"
    ORIGINAL_STYLE_ATTRIBUTE_NAME = "data-original-style"
    ORIGINAL_WIDTH_ATTRIBUTE_NAME = "data-original-width"
    ORIGINAL_HEIGHT_ATTRIBUTE_NAME = "data-original-height"
    REPLACE_TEXT_ATTRIBUTE_NAME = "data-replace-text"
    TEXT_FORMATTING_ELEMENTS = ["B", "EM", "I", "SMALL", "STRONG", "SUB", "SUP", "INS", "DEL", "MARK"]
    NOT_TEXT_FORMATTING_ELEMENTS_STRING = ":not(b):not(em):not(i):not(small):not(strong):not(sub):not(sup):not(ins):not(del):not(mark)"
    NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP = /[^ㄱ-ㅎ가-힣a-z0-9]/
    ONLY_NUMBER = /[0-9]/
    NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP = "[^ㄱ-ㅎ가-힣a-z0-9]?"
    NUMBER_OR_LETTER_OUTSIDE_REG_EXP = /[ㄱ-ㅎ가-힣a-z0-9]/

    skipElementsFromRenderReplaceDivBecauseItHasBeenRestored = []

TABLE_TEXT = "<table data-replacer-element-marker='true'" +
    "class='blockingAreaForSponono'" +
    "style='all: unset !important;" +
    "text-transform: initial !important;" +
    "line-height: 16px !important;" +
    "width: #elementToReplaceWidth#px !important;" +
    "height: #elementToReplaceHeight#px !important;" +
    "color: white !important;" +
    "font-size: 12px !important;" +
    "font-family: Arial !important;" +
    "font-weight: bold !important;" +
    "padding: 5px !important;" +
    "background-color: #backgroundColor# !important;" +
    "border-radius: 4px !important;" +
    "display: inline-block !important;" +
    "position: relative !important;" +
    "cursor: default !important;" +
    "z-index: 10 !important;'>" +
    "<tr style='all: unset !important;" +
    "vertical-align: middle !important;'>" +
    "<td style='all: unset !important;" +
    "vertical-align: middle !important;'>" +
    "<span title='#title#' " +
    "style='all: unset !important;" +
    "font-size: 12px !important;" +
    "display: block !important; " +
    "padding-left: 5px !important;" +
    "text-overflow: ellipsis !important; " +
    "overflow: hidden !important; " +
    "white-space: nowrap !important;" +
    "width: #textWidth#px !important;'>#text#</span>" +
    "</td>" +
    "</tr>" +
    "</table>";

    var textCache = [];
    var spoilerStringCache = [];
    var movieData;
    var level=-1;
    var movieDataLength=-1;
    var whiteListChecker;
    var blockColor='#1d9a89';
    var observerAttached=true;
isNullOrEmpty = function (value) {
    return value === null ||
        value === undefined ||
        value === "" ||
        value.length === 0;
}

String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}
shouldReplaceText = function (node,text,nodeType) {

    var res = {};
    var titleSpoiler = null;
    var actorSpoiler = null;
    var temp = null;
    var textIndex = null;
    res.shouldReplace = false;
    var trimmedText = text.replace('↵', "").trim();
    if (trimmedText.length > 0) {

        if (textCache.indexOf(trimmedText) == -1) {
            var normalizeLowerText;

            //normalizeLowerText = text.normalizeString().toLowerCase(); extends 추가했는데 인식 불가
            normalizeLowerText = trimmedText.toLowerCase();

            //there is no letter or number in the text
            if (isNullOrEmpty(normalizeLowerText.match(NUMBER_OR_LETTER_OUTSIDE_REG_EXP))) {
                temp = null;
            }
            for (var i = 0; i < movieData.length; i++) {
                var actorAndDirector = movieData[i].actor.concat(movieData[i].director);
                for (var j = 0; j < actorAndDirector.length; j++) {
                    var spoilerString = "";
                    spoilerString = actorAndDirector[j].replaceAll(ONLY_NUMBER, "").trim();
                    var normalizedLowerSpoilerString = spoilerString.toLowerCase();;
                    if (normalizedLowerSpoilerString == "")
                        continue;
                    if (normalizedLowerSpoilerString.split(" ").length === 1) {

                        if (
                            (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                            (new RegExp("^" + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                            (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + "$").test(normalizeLowerText)) ||
                            (normalizedLowerSpoilerString === normalizeLowerText)) {
                            actorSpoiler = spoilerString;
                        }
                    } else {

                        var splitByBlank = normalizedLowerSpoilerString.split(" ");
                        for (var k = 0; k < splitByBlank.length; k++) {

                            var compareSpoilerString = splitByBlank[k].replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                            var compareText = normalizeLowerText.replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                            if (compareText.includes(compareSpoilerString)) {
                                actorSpoiler = spoilerString;
                            }
                        }
                    }
                }
            }
            for (var i = 0; i < movieData.length; i++) {
                var spoilerString = ""
                spoilerString = movieData[i].title.trim();
                //var normalizedLowerSpoilerString = core.markAndReplace.normalizedSpoilerStringList[i];
                var normalizedLowerSpoilerString = spoilerString;
                if (normalizedLowerSpoilerString.split(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP).length === 1) {

                    if (
                        (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                        (new RegExp("^" + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                        (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + "$").test(normalizeLowerText)) ||
                        (normalizedLowerSpoilerString === normalizeLowerText)) {
                        titleSpoiler = spoilerString;

                    }
                } else {
                    var compareSpoilerString = normalizedLowerSpoilerString.replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                    var compareText = normalizeLowerText.replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                    if (compareText.includes(compareSpoilerString)) {
                        titleSpoiler = spoilerString;
                    }
                }
            }
            switch (level) {
                case 3:
                    if (actorSpoiler != null)
                        temp = actorSpoiler;
                case 2:
                    if (titleSpoiler != null)
                        temp = titleSpoiler;
                    break;
                case 1:
                    //의미 구분 영역
                    
                    if (actorSpoiler != null || titleSpoiler != null) {
                        console.log(actorSpoiler);
                        console.log(titleSpoiler);

                        chrome.runtime.sendMessage({
                            message: 'nlpCheck',
                            data: trimmedText
                        });
                        console.log(trimmedText);
                        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

                            if (request.message == 'nlpReply') {
                                console.log(request)
                                if (request.isSpoiler) {
                                    temp = trimmedText;
                                    textCache.push(trimmedText);
                                    spoilerStringCache.push(temp);
                                    textIndex = textCache.indexOf(trimmedText);
                                    res.alternateText = '스포일러';
                                    res.shouldReplace = true;
                                    if (nodeType == 1)
                                        markToReplace_a(node, res);
                                    if (nodeType == 2) {
                                        markToReplace_text(node.parentElement, res);

                                    }

                                    createReplaceDivs(node);
                                }
                             }
                        })
                    }
                    
                default:
                    break;
            }
            

            textCache.push(trimmedText);
            spoilerStringCache.push(temp);
            
        }
        textIndex = textCache.indexOf(trimmedText);
        //console.log(textCache);
        //set the spoilerstring what will appear on the replaced div
        res.alternateText = spoilerStringCache[textIndex];
        //if spoilerstring has been found, do the replace at the caller
        res.shouldReplace = res.alternateText != null;
    }
    return res;

}

markToReplace_childNodes = function (node) {
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node) {
        return;
    }
    if (replaceDivIsEnabled(node, node.nodeName)) {

        var cn = node.childNodes;
        var n = cn.length;
        var child;
        for (var i = 0; i < n; i++) {
            child = cn[i];

            //NOTE: sometimes the nodename is lowercase
            if (child === undefined)
                continue;
            var toLowerchildNodeName = child.nodeName.toLowerCase();

            /*if (toLowerchildNodeName === "img") {
                core.markAndReplace.removeImagesIfNecessary(child);
            }
            if (toLowerchildNodeName === "video") {
                core.markAndReplace.removeVideosIfNecessary(child);
            }*/

            //a sometimes contains inner elements, so we have to start with A replacement
            if (toLowerchildNodeName === "a") {
                checkToReplace_a(child);
            } else if (toLowerchildNodeName === "#text") {
                checkToReplace_text(child);
            }/* else if (toLowerchildNodeName === "img") {
            core.markAndReplace.markToReplace_image(child);
        }*/ else {
                //check if already marked
                if (child.getAttribute && child.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
                    return;
                }

                //NOTE: we don't call it on the created div
                if (!node.getAttribute(REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME)) {
                    markToReplace_childNodes(child);
                }
            }
        }
    }
}
replaceDivIsEnabled = function (node, nodeName) {
    if ((nodeName == "#text") && (node.data.replace('↵', "").trim().length == 0)) {
        return false;
    }

    if (node.hasAttribute && node.hasAttribute(REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME)) {
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

markElementForReplaceDivAndHide= function(elementToReplace, displayString) {

    if (elementToReplace.hasAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
        return;
    }
    var originalStyle = elementToReplace.getAttribute("style");
    var elementToReplaceWidth = getElementToReplaceWidth(elementToReplace);
    var elementToReplaceHeight = getElementToReplaceHeight(elementToReplace);
    elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");
    elementToReplace.setAttribute(REPLACE_TEXT_ATTRIBUTE_NAME, "'" + displayString + "' 포함되어있습니다");
    elementToReplace.setAttribute(ORIGINAL_STYLE_ATTRIBUTE_NAME, originalStyle);
    elementToReplace.setAttribute(ORIGINAL_WIDTH_ATTRIBUTE_NAME, elementToReplaceWidth);
    elementToReplace.setAttribute(ORIGINAL_HEIGHT_ATTRIBUTE_NAME, elementToReplaceHeight);
    elementToReplace.setAttribute(ATTRIBUTE_FOR_SPONONO, true);
    recursiveSetSponono(elementToReplace);
    elementToReplace.style.display = "none";
}
recursiveSetSponono = function (node) {
    if (node.hasChildNodes()) {
        node.childNodes.forEach(function (child) {
            if (node.nodeType == 1) {
                node.setAttribute(ATTRIBUTE_FOR_SPONONO, true);
                recursiveSetSponono(child);
            }
        });
    }
}
checkToReplace_a = function (a) {
    var replace;
    if (a.innerText) {
        replace = shouldReplaceText(a,a.innerText,1);
    }
    //if  a.innerText failed to match               
    if (a.href && (!replace || replace && !replace.shouldReplace)) {
        replace = shouldReplaceText(a,a.href);
    }

    if (replace && replace.shouldReplace) {
        markToReplace_a(a, replace);
    }
}

markToReplace_a = function (a, replace) {
    
        //if the link is in paragraph
        var aOrParent = a;
        if (a.parentElement.nodeName.toLowerCase() == "p") {
            aOrParent = a.parentElement;
        }
        var elementToReplace = aOrParent;
        elementToReplace = findTargetParent(a);
        if (elementToReplace === null)
            elementToReplace = aOrParent;
        if (!elementToReplace.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
            //elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");
           
            var curUrl = window.location.hostname;
            //elementToReplace.innerText = "키워드 '" + replace.alternateText + "' 포함되어있습니다";
            //elementToReplace.style.color = "white";
            //elementToReplace.setAttribute('needWhite', 'yes');
            //elementToReplace.style.backgroundColor = "#1d9a89";
            
            elementToReplace.querySelectorAll("img").forEach(function (el) {
                el.setAttribute("style", "display: none;");
            });
            if (elementToReplace.parentElement.querySelectorAll("img").length == 1) {
                elementToReplace.parentElement.querySelectorAll("img").forEach(function (el) {
                    el.setAttribute("style", "display: none;");
                });
            }
            
            markElementForReplaceDivAndHide(elementToReplace, replace.alternateText);

        }
}

checkToReplace_text = function (textNode) {
    var replace = shouldReplaceText(textNode,textNode.data,2);

    if (replace && replace.shouldReplace) {
        markToReplace_text(textNode.parentElement,replace);
    }
}
markToReplace_text = function (textNode, replace) {
    //console.log(textNode.parentElement);
        var elementToReplace;
        var textNodeParentElement = textNode;
        //if the parent is a formatter, we will find the first nonformatter parent, that should be replaced
        elementToReplace = findTargetParent(textNode);
        if (elementToReplace === null) {
            if (TEXT_FORMATTING_ELEMENTS.includes(textNodeParentElement.nodeName)) {
                var closestNonFormattingParent = textNodeParentElement.closest(NOT_TEXT_FORMATTING_ELEMENTS_STRING);
                elementToReplace = closestNonFormattingParent;
            } else {
                elementToReplace = textNode;
            }
        }
        if (!elementToReplace.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
            

            //elementToReplace.style.color = blockColor;
            /*elementToReplace.style.backgroundColor = blockColor;

            elementToReplace.childNodes.forEach(function (el) {

                el.innerHTML = replace.alternateText;
            });*/

            /*var curUrl = window.location.hostname;
            var c = elementToReplace.children;
            for (var i = 0; i < c.length; i++) {
                c[i].style.color = "white";
            }*/
            markElementForReplaceDivAndHide(elementToReplace, replace.alternateText);
        }
        
    
}

findTargetParent = function (curNode) {
    var parentNode = curNode.parentElement;
    if (parentNode == undefined) {
        return null;
    }
    var siblingNodes = parentNode.childNodes;
    if (curNode.nodeName == "LI")
        return curNode;
    for (n of siblingNodes) {
        if (n != curNode &&
            n.className == curNode.className &&
            n.nodeName == curNode.nodeName &&
            n.id == curNode.id &&
            n.childNodes.length > 0) {
            return curNode;
        }
    }
    return findTargetParent(parentNode);
}

find_children = function (parentNode) {
    if (parentNode.children.length != 0) {
        var youtubeC = parentNode.children;
        for (var i = 0; i < youtubeC.length; i++) {
            if (youtubeC[i].getAttribute("needWhite") != "yes") {
                youtubeC[i].style.color = blockColor;
            }
            find_children(youtubeC[i]);

        }
    }
    return;
}
getElementWithSize= function(element) {
    //NOTE: The "a" html element doesn't have width and height (almost always), so we get the first child element with width and height
    var elementWithSize = element;
    if (element.nodeName === "A" && element.clientWidth < 1 && element.clientHeight < 1) {
        for (var i = 0; i < element.children; i++) {
            var child = element.children[i];
            if (child.clientWidth > 0 && child.clientHeight > 0) {
                elementWithSize = child;
                break;
            }
        }
    }
    return elementWithSize;
}

getElementToReplaceWidth= function(element) {
    var elementToReplaceWidth = getElementWithSize(element).clientWidth;
    //NOTE: 100 is the default width if we can't read the default width
    if (elementToReplaceWidth === 0) {
        elementToReplaceWidth = 100;
    } else if (elementToReplaceWidth < 42) {
        //NOTE: 42 is the minimum width to fit the close icon and the 3 dots.
        elementToReplaceWidth = 42;
    }
    return elementToReplaceWidth;
}

getElementToReplaceHeight= function(element) {
    //12 is because 5,5 is padding 1,1 the border
    var elementToReplaceHeight = getElementWithSize(element).clientHeight - 12;

    //NOTE: 16 is the minimum height(height of the close icon)
    if (elementToReplaceHeight < 16) {
        elementToReplaceHeight = 16;
    }
    return elementToReplaceHeight;
}
//div 생성
createReplaceDivs = function (node) {  

    document.body.querySelectorAll("[" + REPLACE_NEEDED_ATTRIBUTE_NAME + "='true']").forEach(function (markedDiv) {
        if (markedDiv.nextElementSibling && markedDiv.nextElementSibling.getAttribute(REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME)) {
            return;
        }


        var elementToReplaceWidth = markedDiv.getAttribute(ORIGINAL_WIDTH_ATTRIBUTE_NAME);
        var elementToReplaceHeight = markedDiv.getAttribute(ORIGINAL_HEIGHT_ATTRIBUTE_NAME);

        var replaceText = markedDiv.getAttribute(REPLACE_TEXT_ATTRIBUTE_NAME);
        var tableText = TABLE_TEXT.replace("#elementToReplaceWidth#", elementToReplaceWidth - 5)
            .replace("#elementToReplaceHeight#", elementToReplaceHeight)
            .replace("#backgroundColor#", blockColor)
            .replace("#textWidth#", elementToReplaceWidth - 30)
            .replace("#title#", replaceText)
            .replace("#text#", replaceText);

        var overlayTable = createElementFromHTML(tableText);
        overlayTable.addEventListener("mouseover", function (e) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }, false);
        overlayTable.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (confirm("정말 차단을 해제하시겠습니까?")) {
                showOriginalElement(e);
            }
            return false;
        }, false);
        
        markedDiv.after(overlayTable);
    });
    
}
createElementFromHTML= function(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
    }

getDomPath= function(el) {
        var stack = [];
        while (el.parentNode != null) {

            var sibCount = 0;
            var sibIndex = 0;
            for (var i = 0; i < el.parentNode.childNodes.length; i++) {
                var sib = el.parentNode.childNodes[i];
                if (sib.nodeName == el.nodeName) {
                    if (sib === el) {
                        sibIndex = sibCount;
                    }
                    sibCount++;
                }
            }
            if (el.hasAttribute('id') && el.id != '') {
                stack.unshift(el.nodeName.toLowerCase() + '#' + el.id);
            } else if (sibCount > 1) {
                stack.unshift(el.nodeName.toLowerCase() + ':eq(' + sibIndex + ')');
            } else {
                stack.unshift(el.nodeName.toLowerCase());
            }
            el = el.parentNode;
        }
        return stack.join(">");
    }
showOriginalElement= function(e) {
        var clickedElement = e.target;
        var overlayElement = clickedElement.closest("[" + REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME + "='true']");
        skipElementsFromRenderReplaceDivBecauseItHasBeenRestored.push(getDomPath(overlayElement.previousElementSibling));

        removeOneReplaceDiv(overlayElement);
        //core.ui.utilities.badgeText.decreaseBadgeText();

        //NOTE: prevent click for the covered html element
        e.preventDefault();
        e.stopPropagation();
    }

removeOneReplaceDiv= function(overlayElement) {
        var blockedHtmlElement = overlayElement.previousElementSibling;
        overlayElement.parentNode.removeChild(overlayElement);
        restoreBlockedElement(blockedHtmlElement);
    }
restoreBlockedElement= function(blockedHtmlElement) {
    var originalStyle = blockedHtmlElement.getAttribute(ORIGINAL_STYLE_ATTRIBUTE_NAME);

    blockedHtmlElement.removeAttribute(REPLACE_TEXT_ATTRIBUTE_NAME);
    blockedHtmlElement.removeAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME);
    blockedHtmlElement.removeAttribute(ORIGINAL_STYLE_ATTRIBUTE_NAME);
    blockedHtmlElement.removeAttribute(ORIGINAL_WIDTH_ATTRIBUTE_NAME);
    if (originalStyle = "null") {
        blockedHtmlElement.removeAttribute("style");
    }
       else if (originalStyle != null && originalStyle.length > 0) {
            blockedHtmlElement.setAttribute("style", originalStyle);
           
        } else {
            blockedHtmlElement.removeAttribute("style");
        }
    console.log("replace!!");
    blockedHtmlElement.querySelectorAll("img").forEach(function (el) {
        el.setAttribute("style", "display: block;");
    });
    if (blockedHtmlElement.parentElement.querySelectorAll("img").length == 1) {
        blockedHtmlElement.parentElement.querySelectorAll("img").forEach(function (el) {
            el.setAttribute("style", "display: block;");
        });
    }
    
    }

zenofunc = function (mutation) {
    textCache = [];
    spoilerStringCache = [];
    //markToReplace_childNodes(document.body);;
    markToReplace_childNodes(mutation);
    createReplaceDivs(mutation);
    textCache = [];
    spoilerStringCache = [];
}

/* 부모 속성 확인용 함수 node[0]에 한해서 ture 반환 찍힘에도 undefined 반환함
checkParentAttributeSponono = function (node) {
    if (node.hasAttribute(ATTRIBUTE_FOR_SPONONO)) {
        console.log("true 반환");
        return true;
    }
    else if (node.parentElement == undefined) {
        console.log(node);
        return false;
    }
    else
        checkParentAttributeSponono(node.parentNode);

}*/
AttachBlockObserver = function () {
        
    if (movieData.length == 0)
        return;
    console.log("?????????????0");
    markToReplace_childNodes(document.body);
    createReplaceDivs(document.body);
    console.log("1?????????????????");//왜??????????????????????????????????????????????????????????????????????????????????????????????????
    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    let observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs
       
        
        for (var i = 0; i < mutations.length; i++) {
            if (!mutations[i].target.hasAttribute(ATTRIBUTE_FOR_SPONONO) ) {
                
                zenofunc(mutations[i].target);
                
            }
            
        }
    /* 부모 속성 확인용 함수 node[0]에 한해서 ture 반환 찍힘에도 undefined 반환함
         if (!checkParentAttributeSponono(mutations[i].target)) {

            console.log(mutations[i]);
            zenofunc(mutations[i].target);

        }*/
        // ...
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    if (!observerAttached) {
        observer.observe(document, {
            subtree: true,
            //childList: true,
            //characterData:true
            attributeOldValue: true,
            //...
        });
        observerAttached = false;
    }
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    if (request.message === 'getMovieDataReply') {

        movieData = request.movieData;
        if (movieDataLength > movieData.length || (movieData.length == 0 && movieDataLength == 1))
            window.location.reload();
        if (level != request.blockPower && level != -1) {
            window.location.reload();
        }
        level = request.blockPower;
        if (request.onWhiteList == false || (request.onWhiteList == undefined && whiteListChecker == false)) {
            
            if (movieDataLength < movieData.length) {
                AttachBlockObserver();
            }
            
        }
        movieDataLength = movieData.length;
    }

    if(request.message==="whiteList"){
        if (request.onWhiteList && whiteListChecker == false) {
            whiteListChecker = request.onWhiteList;   
            window.location.reload();
                    }
        else if (!request.onWhiteList){
            whiteListChercker = true;
            AttachBlockObserver();
           //console.log(request.onWhiteList);
            
        }
        whiteListChecker = request.onWhiteList;   

    }
    /*if (request.message == 'nlpReply') {

        if (request.isSpoiler) {
            var replace = {};
            replace.shouldReplace = true;
            replace.alternateText = "ssss0";
            var ttext = request.data;
            console.log(ttext);
            console.log($(":contains('"+ttext+"')").not(":has(:contains('"+ttext+"'))"));
            var ttextNode = $(":contains('" + ttext + "')").not(":has(:contains('" + ttext + "'))");


            for (var i = 0; i < ttextNode.length; i++) {
                //console.log(ttextNode[i]);
                markToReplace_text([i], replace);
            }
        }
        }
        */
    
})

chrome.runtime.sendMessage({
    message: 'getMovieData'
});

chrome.runtime.sendMessage({
    message: 'whiteListCheck_content'
});
/*
chrome.runtime.sendMessage({
    message: 'nlpCheck',
    data:'가족이랑 봐도 좋을만한 영화입니다'
}) */


console.log('hi');