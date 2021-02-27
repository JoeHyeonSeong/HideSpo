
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

var movieData;
var level = -1;
var movieDataLength = -1;
var whiteListChecker;
var nodeMap = new Map();
var nodeCount = 0;
var blockColor = '#1d9a89';
let attachObserver=false;
var opened=new Set();

isNullOrEmpty = function (value) {
    return value === null ||
        value === undefined ||
        value === "" ||
        value.length === 0;
}

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
                //console.log(text)
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

markToReplace_childNodes = function (node) {
    //NOTE: when loading, the first time the node is null when we call this from browser.tabs.onUpdated.addListener
    if (!node||opened.has(node.textContent)) {
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
                    markToReplace_text(child);
            } else {
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

    if ((nodeName == "#text") && (node.data.replaceAll('↵', "").trim().length == 0)) {
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

markElementForReplaceDivAndHide = function (elementToReplace) {

    if (elementToReplace.hasAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
        return;
    }
    var originalStyle = elementToReplace.getAttribute("style");
    var elementToReplaceWidth = getElementToReplaceWidth(elementToReplace);
    var elementToReplaceHeight = getElementToReplaceHeight(elementToReplace);
    elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");
    elementToReplace.setAttribute(REPLACE_TEXT_ATTRIBUTE_NAME, "스포일러일 가능성이 있습니다.");
    elementToReplace.setAttribute(ORIGINAL_STYLE_ATTRIBUTE_NAME, originalStyle);
    elementToReplace.setAttribute(ORIGINAL_WIDTH_ATTRIBUTE_NAME, elementToReplaceWidth);
    elementToReplace.setAttribute(ORIGINAL_HEIGHT_ATTRIBUTE_NAME, elementToReplaceHeight);
    elementToReplace.setAttribute(ATTRIBUTE_FOR_SPONONO, true);
    //elementToReplace.style.filter="blur(4px)";
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

markToReplace_a = function (a) {

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

        elementToReplace.querySelectorAll("img").forEach(function (el) {
            el.setAttribute("style", "display: none;");
        });
        if (elementToReplace.parentElement.querySelectorAll("img").length == 1) {
            elementToReplace.parentElement.querySelectorAll("img").forEach(function (el) {
                el.setAttribute("style", "display: none;");
            });
        }
        markElementForReplaceDivAndHide(elementToReplace);
    }
}

markToReplace_text = function (textNode) {

    var elementToReplace;
    var textNodeParentElement = textNode.parentElement;
    //if the parent is a formatter, we will find the first nonformatter parent, that should be replaced
    elementToReplace = findTargetParent(textNode);
    if (elementToReplace === null) {
        if (TEXT_FORMATTING_ELEMENTS.includes(textNodeParentElement.nodeName)) {
            var closestNonFormattingParent = textNodeParentElement.closest(NOT_TEXT_FORMATTING_ELEMENTS_STRING);
            elementToReplace = closestNonFormattingParent;
        } else {
            elementToReplace = textNode.parentElement;
        }
    }
    if (!elementToReplace.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
        markElementForReplaceDivAndHide(elementToReplace);
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
        var children = parentNode.children;
        for (var i = 0; i < children.length; i++) {
            if (children[i].getAttribute("needWhite") != "yes") {
                children[i].style.color = blockColor;
            }
            find_children(children[i]);
        }
    }
    return;
}

getElementWithSize = function (element) {
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

getElementToReplaceWidth = function (element) {

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

getElementToReplaceHeight = function (element) {

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
        var tableText = TABLE_TEXT.replaceAll("#elementToReplaceWidth#", elementToReplaceWidth - 5)
            .replaceAll("#elementToReplaceHeight#", elementToReplaceHeight)
            .replaceAll("#backgroundColor#", blockColor)
            .replaceAll("#textWidth#", elementToReplaceWidth - 30)
            .replaceAll("#title#", replaceText)
            .replaceAll("#text#", replaceText);
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
createElementFromHTML = function (htmlString) {

    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    div.filter="blur(4px)";
    return div.firstChild;
}

getDomPath = function (el) {

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
showOriginalElement = function (e) {

    var clickedElement = e.target;
    var overlayElement = clickedElement.closest("[" + REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME + "='true']");
    skipElementsFromRenderReplaceDivBecauseItHasBeenRestored.push(getDomPath(overlayElement.previousElementSibling));
    removeOneReplaceDiv(overlayElement);
    //NOTE: prevent click for the covered html element
    e.preventDefault();
    e.stopPropagation();
}

removeOneReplaceDiv = function (overlayElement) {

    var blockedHtmlElement = overlayElement.previousElementSibling;
    overlayElement.parentNode.removeChild(overlayElement);
    restoreBlockedElement(blockedHtmlElement);
}

restoreBlockedElement = function (blockedHtmlElement) {
    opened.add(blockedHtmlElement.textContent);
    //console.log(opened);
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
    //console.log("replace!!");
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
    markToReplace_childNodes(mutation);
    createReplaceDivs(mutation);
}

AttachBlockObserver = function () {
    if(attachObserver)
        return;
    attachObserver=true;
    if (movieData ==undefined)
        return;
    zenofunc(document.body);
    //MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    let observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs

        for (var i = 0; i < mutations.length; i++) {

            if (!mutations[i].target.hasAttribute(ATTRIBUTE_FOR_SPONONO) && mutations[i].target.textContent != "") {
                zenofunc(mutations[i].target);
            }
        }
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document, {
        subtree: true,
        attributes: true,
        childList:true
        //...
    });
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
    if (request.message == 'nlpReply' && request.isSpoiler) {
        let node = nodeMap.get(request.nodeNum);
        if (node != undefined) {
            let nodename = node.nodeName.toLowerCase();
            if (nodename == "a")
                markToReplace_a(node);
            if (nodename == "#text")
                markToReplace_text(node);
            createReplaceDivs(node);
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