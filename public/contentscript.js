console.log("hi");
chrome.storage.sync.get(['movieDatas'], function (result) {

    console.log(result.movieDatas[0].title);
textCache = [];
spoilerStringCache= [];
REPLACER_ELEMENT_MARKER_ATTRIBUTE_NAME= "data-replacer-element-marker"                                  

REPLACE_NEEDED_ATTRIBUTE_NAME= "data-replace-needed"
            
ORIGINAL_STYLE_ATTRIBUTE_NAME= "data-original-style"
ORIGINAL_WIDTH_ATTRIBUTE_NAME= "data-original-width"
ORIGINAL_HEIGHT_ATTRIBUTE_NAME= "data-original-height"
REPLACE_TEXT_ATTRIBUTE_NAME= "data-replace-text"
TEXT_FORMATTING_ELEMENTS = ["B", "EM", "I", "SMALL", "STRONG", "SUB", "SUP", "INS", "DEL", "MARK"]
NOT_TEXT_FORMATTING_ELEMENTS_STRING= ":not(b):not(em):not(i):not(small):not(strong):not(sub):not(sup):not(ins):not(del):not(mark)"
NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP = /[^ㄱ-ㅎ가-힣a-z0-9]*/
NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP = "[^ㄱ-ㅎ가-힣a-z0-9]*"
NUMBER_OR_LETTER_OUTSIDE_REG_EXP = /[ㄱ-ㅎ가-힣a-z0-9]/

isNullOrEmpty= function (value) {
        return value === null ||
            value === undefined ||
            value === "" ||
            value.length === 0; 
    }

getMatchingSpoilerStringInText= function(text) {

    var normalizeLowerText;
    
    //normalizeLowerText = text.normalizeString().toLowerCase(); extends 추가했는데 인식 불가
    normalizeLowerText = text.toLowerCase();

    //there is no letter or number in the text
    if (isNullOrEmpty(normalizeLowerText.match(NUMBER_OR_LETTER_OUTSIDE_REG_EXP))) {
        return null;
    }
    //console.log("나" + normalizeLowerText);
    chrome.storage.sync.get(['movieDatas'], function (result) {
        
        var spoilerList = result.movieDatas;
    
        for (var i = 0; i < spoilerList.length(); i++) {
            var spoilerString = ""
            spoilerString = spoilerList[i].title.trim();
            //var normalizedLowerSpoilerString = core.markAndReplace.normalizedSpoilerStringList[i];
            var normalizedLowerSpoilerString = spoilerString;
            //console.log("3" + normalizedLowerSpoilerString.split(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP).length);
            if (normalizedLowerSpoilerString.split(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP).length === 1) {
               
                if (
                    (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                    (new RegExp("^" + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                    (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + "$").test(normalizeLowerText)) ||
                    (normalizedLowerSpoilerString === normalizeLowerText)) {
                    //console.log("1" + spoilerList[i].title.trim());
                    //console.log("2" + spoilerString);
                    return spoilerString;
                }
            } else {
                var compareSpoilerString = normalizedLowerSpoilerString.replaceAll(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP, "");
                var compareText = normalizeLowerText.replaceAll(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP, "");
                if (compareText.includes(compareSpoilerString)) {
                   // console.log("2" + spoilerString);
                    return spoilerString;
                }
            }
        }
        return null;
    })
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
            //console.log("나" + normalizeLowerText);
            

                var spoilerList = result.movieDatas;

                for (var i = 0; i < spoilerList.length; i++) {
                    var spoilerString = ""
                    spoilerString = spoilerList[i].title.trim();
                    //var normalizedLowerSpoilerString = core.markAndReplace.normalizedSpoilerStringList[i];
                    var normalizedLowerSpoilerString = spoilerString;
                    //console.log("3" + normalizedLowerSpoilerString.split(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP).length);
                    if (normalizedLowerSpoilerString.split(NON_NUMBER_AND_NON_LETTER_OUTSIDE_REG_EXP).length === 1) {

                        if (
                            (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                            (new RegExp("^" + normalizedLowerSpoilerString + NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP).test(normalizeLowerText)) ||
                            (new RegExp(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP + normalizedLowerSpoilerString + "$").test(normalizeLowerText)) ||
                            (normalizedLowerSpoilerString === normalizeLowerText)) {
                            //console.log("1" + spoilerList[i].title.trim());
                            
                            temp = spoilerString;
                            //console.log("2" + temp);

                        }
                    } else {
                        var compareSpoilerString = normalizedLowerSpoilerString.replaceAll(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP, "");
                        var compareText = normalizeLowerText.replaceAll(NON_NUMBER_AND_NON_LETTER_INSIDE_REG_EXP, "");
                        if (compareText.includes(compareSpoilerString)) {
                            //console.log("3" + spoilerString);
                            temp = spoilerString;
                        }
                        //console.log("4" + compareSpoilerString);

                        //console.log("5" + compareText);

                        //console.log("6" + normalizeLowerText);
                    }
                }           
            
                textCache.push(trimmedText);
                //console.log(trimmedText + "    " + temp);        
            
            spoilerStringCache.push(temp);
            //console.log("sholireplace : " + textCache);
        }
        var textIndex = textCache.indexOf(trimmedText);
        //console.log("sholireplace : " + spoilerStringCache);
        //set the spoilerstring what will appear on the replaced div
        res.alternateText = spoilerStringCache[textIndex];
        //if spoilerstring has been found, do the replace at the caller
        res.shouldReplace = res.alternateText != null;
        //console.log(res.shouldReplace);
    }
        return res;
   
}

markToReplace_childNodes= function(node) {
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
replaceDivIsEnabled= function(node, nodeName) {
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
        //console.log(a);
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

        if (!elementToReplace.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
            elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");

            //console.log("2 " + elementToReplace);
            var curUrl = window.location.hostname;
            //console.log(curUrl);
            if (curUrl == "www.youtube.com") {
                console.log(curUrl+"1212");
                elementToReplace.parentElement.parentElement.parentElement.parentElement.parentElement.querySelectorAll("img").forEach(function (el) {
                    elementToReplace.parentElement.style.color = "blue";
                    elementToReplace.parentElement.style.backgroundColor = "blue";
                    el.setAttribute("style", "display: none;");
                });
            }
            elementToReplace.innerText = "키워드 '"  + replace.alternateText + "' 포함되어있습니다";
            elementToReplace.style.color = "white";
            elementToReplace.style.backgroundColor = "blue";
            elementToReplace.setAttribute(REPLACE_TEXT_ATTRIBUTE_NAME, "sadasdasfasdasfasdavasdfas");
            //console.log(elementToReplace.innerText);

            elementToReplace.querySelectorAll("img").forEach(function (el) {
                el.setAttribute("style", "display: none;");
            });
            if (elementToReplace.parentElement.querySelectorAll("img").length == 1) {
                elementToReplace.parentElement.querySelectorAll("img").forEach(function (el) {
                    el.setAttribute("style", "display: none;");
                });
            }

            
            
        }
        //markElementForReplaceDivAndHide(elementToReplace, replace.alternateText);
        //console.log(elementToReplace);
    }
}

markToReplace_text = function (textNode) {
    // console.log(textNode.data);
    var replace = shouldReplaceText(textNode.data);

    
    if (replace && replace.shouldReplace) {
        //console.log("_a : " + replace);
        var elementToReplace;
        var textNodeParentElement = textNode.parentElement;

        //if the parent is a formatter, we will find the first nonformatter parent, that should be replaced
        if (TEXT_FORMATTING_ELEMENTS.includes(textNodeParentElement.nodeName)) {
            var closestNonFormattingParent = textNodeParentElement.closest(NOT_TEXT_FORMATTING_ELEMENTS_STRING);
            elementToReplace = closestNonFormattingParent;
        } else {
            elementToReplace =textNode.parentElement;
        }
        //console.log(elementToReplace);
        if (!elementToReplace.getAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME)) {
            
            elementToReplace.setAttribute(REPLACE_NEEDED_ATTRIBUTE_NAME, "true");
            //console.log("1 " + elementToReplace.childNodes[0]);
            
            elementToReplace.style.color = "blue";
            elementToReplace.style.backgroundColor = "blue";
            elementToReplace.childNodes.forEach(function (el) {
                
                el.innerHTML = replace.alternateText;
            });
            var curUrl = window.location.hostname;
            //console.log(curUrl);
            if (curUrl == "www.youtube.com") {
                var youtubeC = elementToReplace.parentElement.children;
                for (var i = 0; i < youtubeC.length; i++) {
                    youtubeC[i].style.color = "blue";
                    //youtubeC[i].style.backgroundColor = "blue";
                }
                elementToReplace.parentElement.parentElement.style.color = "blue";
                elementToReplace.parentElement.parentElement.style.backgroundColor = "blue";
                
            }
            var c = elementToReplace.children;
            for (var i = 0; i < c.length; i++) {
                c[i].style.color = "white";
            }


            /*elementToReplace.querySelectorAll("img").forEach(function (el) {
                el.setAttribute("style", "display: none;");
            });
            if (elementToReplace.parentElement.querySelectorAll("img").length == 1) {
                elementToReplace.parentElement.querySelectorAll("img").forEach(function (el) {
                    el.setAttribute("style", "display: none;");
                });
            }
            */
        }
        //markElementForReplaceDivAndHide(elementToReplace, replace.alternateText);
    }
}


   /*
    setInterval(function () {
        console.log('Works!');
        textCache = [];
        spoilerStringCache = [];
        markToReplace_childNodes(document.body);
        textCache = [];
        spoilerStringCache = [];
    }, 3000);
*/
    zenofunc=function(){
        console.log('Works!');
        textCache = [];
        spoilerStringCache = [];
        markToReplace_childNodes(document.body);
        textCache = [];
        spoilerStringCache = [];
    }

    //document.addEventListener('DOMNodeInserted', zenofunc);

    MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

    var observer = new MutationObserver(function (mutations, observer) {
        // fired when a mutation occurs
        console.log(mutations, observer);
        zenofunc();
        // ...
    });

    // define what element should be observed by the observer
    // and what types of mutations trigger the callback
    observer.observe(document, {
        subtree: true,
        attributes: true,
        //...
    });

})