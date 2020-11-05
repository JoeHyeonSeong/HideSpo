
    REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME = "data-replacer-element-marker"

    REPLACE_NEEDED_ATTRIBUTE_NAME = "data-replace-needed"

    ORIGINAL_STYLE_ATTRIBUTE_NAME = "data-original-style"
    ORIGINAL_WIDTH_ATTRIBUTE_NAME = "data-original-width"
    ORIGINAL_HEIGHT_ATTRIBUTE_NAME = "data-original-height"
    REPLACE_TEXT_ATTRIBUTE_NAME = "data-replace-text"
    TEXT_FORMATTING_ELEMENTS = ["B", "EM", "I", "SMALL", "STRONG", "SUB", "SUP", "INS", "DEL", "MARK"]
    NOT_TEXT_FORMATTING_ELEMENTS_STRING = ":not(b):not(em):not(i):not(small):not(strong):not(sub):not(sup):not(ins):not(del):not(mark)"
    NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP = /[^ㄱ-ㅎ가-힣a-z0-9]/
    NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP = "[^ㄱ-ㅎ가-힣a-z0-9]?"
    NUMBER_OR_LETTER_OUTSIDE_REG_EXP = /[ㄱ-ㅎ가-힣a-z0-9]/

    var textCache = [];
    var spoilerStringCache = [];
    var movieData;
    var blockColor='#1d9a89';
isNullOrEmpty = function (value) {
    return value === null ||
        value === undefined ||
        value === "" ||
        value.length === 0;
}

String.prototype.replaceAll = function (org, dest) {
    return this.split(org).join(dest);
}
shouldReplaceText = function (text) {

    var res = {};
    var temp = null;
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
                        temp = spoilerString;

                    }
                } else {
                    var compareSpoilerString = normalizedLowerSpoilerString.replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                    var compareText = normalizeLowerText.replaceAll(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP, "");
                    if (compareText.includes(compareSpoilerString)) {
                        temp = spoilerString;
                    }
                }
            }

            textCache.push(trimmedText);
            spoilerStringCache.push(temp);
        }
        var textIndex = textCache.indexOf(trimmedText);
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
                markToReplace_a(child);
            } else if (toLowerchildNodeName === "#text") {
                markToReplace_text(child);
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


markToReplace_a = function (a) {
    var replace;
    if (a.innerText) {
        replace = shouldReplaceText(a.innerText);
    }
    //if  a.innerText failed to match               
    if (a.href && (!replace || replace && !replace.shouldReplace)) {
        replace = shouldReplaceText(a.href);
    }

    if (replace && replace.shouldReplace) {
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
            elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");

            var curUrl = window.location.hostname;
            elementToReplace.innerText = "키워드 '" + replace.alternateText + "' 포함되어있습니다";
            elementToReplace.style.color = "white";
            elementToReplace.setAttribute('needWhite', 'yes');
            elementToReplace.style.backgroundColor = "#1d9a89";
            elementToReplace.setAttribute(REPLACE_TEXT_ATTRIBUTE_NAME, "sadasdasfasdasfasdavasdfas");

            elementToReplace.querySelectorAll("img").forEach(function (el) {
                el.setAttribute("style", "display: none;");
            });
            if (elementToReplace.parentElement.querySelectorAll("img").length == 1) {
                elementToReplace.parentElement.querySelectorAll("img").forEach(function (el) {
                    el.setAttribute("style", "display: none;");
                });
            }



        }
    }
}

findTargetParent = function (curNode) {
    var parentNode = curNode.parentElement;
    if (parentNode == undefined) {
        return null;
    }
    var siblingNodes = parentNode.childNodes;
    if (curNode.nodeName == "body")
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

markToReplace_text = function (textNode) {
    var replace = shouldReplaceText(textNode.data);


    if (replace && replace.shouldReplace) {
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

            elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");

            elementToReplace.style.color = blockColor;
            elementToReplace.style.backgroundColor = blockColor;
            elementToReplace.childNodes.forEach(function (el) {

                el.innerHTML = replace.alternateText;
            });
            var curUrl = window.location.hostname;

            var c = elementToReplace.children;
            for (var i = 0; i < c.length; i++) {
                c[i].style.color = "white";
            }

        }
    }
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

zenofunc = function (mutation) {
    textCache = [];
    spoilerStringCache = [];
    //markToReplace_childNodes(document.body);
    markToReplace_childNodes(mutation);
    textCache = [];
    spoilerStringCache = [];
}


AttachBlockObserver = function () {
    if (movieData.length == 0)
        return;
    markToReplace_childNodes(document.body);

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    let observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs

        for (var i = 0; i < mutations.length; i++) {
            zenofunc(mutations[i].target);
        }

        // ...
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document, {
        subtree: true,
        attributes: true,
        //...
    });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'getMovieDataReply') {
        movieData = request.movieData;
        console.log('data reply');
    }

    if(request.message==="whiteList"){
        console.log(request.onWhiteList);
        if(request.onWhiteList){

        }
        else {
            AttachBlockObserver();
        }
    }
})


chrome.runtime.sendMessage({
    message: 'getMovieData'
});

chrome.runtime.sendMessage({
    message: 'whiteListCheck_content'
});
