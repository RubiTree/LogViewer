
var words1 = [];
var words2 = [];
var ignore = ["string","String","private","//","static","class","{","}"]; // make this regex match, test performance, save to cookie?
var diff1 = [];
var diff2 = [];
var common = [];

Array.prototype.contains = function(needle) {
    for (i in this) {
        if (this[i] == needle) return true;
    }
    return false;
}

function diff() {
    words1 = unique(getWordsFromText(document.getElementById('input_text_1_area').value));
    words2 = unique(getWordsFromText(document.getElementById('input_text_2_area').value));

    words1 = remove(words1);
    words2 = remove(words2);

    words1 = replace(words1);
    words2 = replace(words2);

    common = words1.filter(function(v) {
        return words2.indexOf(v) > -1
    });

    diff1 = words1.filter(function(v) {
        return common.indexOf(v) === -1
    }).concat(common.filter(function(v) {
        return words1.indexOf(v) === -1
    }))

    diff2 = words2.filter(function(v) {
        return common.indexOf(v) === -1
    }).concat(common.filter(function(v) {
        return words2.indexOf(v) === -1
    }))

    document.getElementById("text_1_diff_area").innerHTML = listToString(diff1);
    document.getElementById("common_area").innerHTML = listToString(common);
    document.getElementById("text_2_diff_area").innerHTML = listToString(diff2);
}

function getWordsFromText(text) {
    if (text === null || text === "") return;
    var words = [];

    var lineList = text.split("\n");
    for (var i = 0; i < lineList.length; i++) {
        var wordsList = lineList[i].split(/\s+/);
        for (var j = 0; j < wordsList.length; j++) {
            if (!ignore.contains(wordsList[j])) {
                words.push(wordsList[j]);
            }
        }
    }

    return words;
}

function listToString(list) {
    var result = "";
    for (var j = 0; j < list.length; j++) {
        result += (list[j] + "\n");
    }
    return result;
}

function unique (arr) {
  return Array.from(new Set(arr))
}

function replace(list){
    for (var j = 0; j < list.length; j++) {
        list[j] = list[j].replace(/;/g,'');
    }
    return list;
}

function remove(list){
    var result = [];
    for (var j = 0; j < list.length; j++) {
        if(escape(list[j]).indexOf("%u")<0 && list[j].search("HR") === -1){  // only remove and replace
            result.push(list[j]);
        }
    }
    return result;
}
