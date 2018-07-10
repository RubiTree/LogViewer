function dragOverHandler(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dragEffect = 'copy';
}

// 废弃
function dropHandler(e) {
    e.stopPropagation();
    e.preventDefault();

    var p = document.getElementById('log_area');
    var files = e.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();

    reader.onload = function (e) {
        var logText = this.result;
        var logLines = logText.split('\n');
        var logLineSize = logLines.length;

        var foundIndex = [];
        var regex = /进入界面/;
        for (var i = 0; i < logLines.length; i++) {
            if (logLines[i].search(regex) > -1) {
                foundIndex.push(i);
            }
        }

        var canvas = document.getElementById('canvas');
        var ctx = canvas.getContext("2d");
        for (var i = 0; i < foundIndex.length; i++) {
            var positionY = (foundIndex[i] / logLineSize) * 900;
            ctx.moveTo(0, positionY);
            ctx.lineTo(200, positionY);
        }
        ctx.stroke();

        for (var i = 0; i < logLines.length; i++) {
            logLines[i] = '<p>' + logLines[i].substr(1, 100) + '</p>';
        }
        p.innerHTML = logLines.join('');
    }

    //读取文件内容
    reader.readAsText(file);
}

//- ----

function scrollByPx(e) {
    var p = document.getElementById('log_area');
    var contentHeight = p.scrollHeight;
    p.scrollTop = (e.clientY / ACTIVITY_AREA_HEIGHT) * contentHeight - 400;
}

function scrollByIndex(e) {
    var p = document.getElementById('log_area');
    var index = Math.ceil((e.clientY * ratio / ACTIVITY_AREA_HEIGHT) * logLineSize);

    // 过滤最大值
    if (index >= p.childNodes.length) {
        index = p.childNodes.length - 1;
    }

    // 吸附最近关键点（目前只有activity)
    index = getNearKeyIndex(index);

    var child = p.childNodes[index];
    p.scrollTop = child.offsetTop - (ACTIVITY_AREA_HEIGHT / (2 * ratio));
}

var MAX_NEAR_DISTANCE;

function getNearKeyIndex(index) {
    for (var i = 0; i < activityIndex.length; i++) {
        if (activityIndex[i] > index) {
            if (i == 0) {
                if (activityIndex[i] - index <= MAX_NEAR_DISTANCE) {
                    return activityIndex[i];
                }
            } else {
                var distanceBefore = index - activityIndex[i - 1];
                var distanceAfter = activityIndex[i] - index;

                if (distanceBefore < distanceAfter) {
                    if (distanceBefore <= MAX_NEAR_DISTANCE) {
                        return activityIndex[i - 1];
                    }
                } else {
                    if (distanceAfter <= MAX_NEAR_DISTANCE) {
                        return activityIndex[i];
                    }
                }
            }
            return index;
        }
    }
    return index;
}

//------

get('https://' + getQueryVariable('redirectUrl'), function (result) {
    renderContent(result);
});

// get('https://lc-tn27f1ke.cn-n1.lcfile.com/RTU8Rj5SDSJmF6z8Zrfli6X6ZV2WonJZ9fk41TtK.txt', function(result) {
//     renderContent(result);
// });

//---

var logLineSize;
var activityIndicator = new ActivityIndicator();
var activityIndex = Array();
var ratio;

var canvasArea = document.getElementById('canvas_area');
var canvas = document.getElementById('canvas');
var ctx = canvas.getContext("2d");

function renderContent(logText) {
    var p = document.getElementById('log_area');

    var logLines = logText.split('\n');
    logLineSize = logLines.length;

    calculateMaxNearDistance();

    for (var i = 0; i < logLines.length; i++) {
        resolveActivity(logLines[i], i);
    }
    activityIndicator.analysis(0, logLines.length-1);

    initCanvasSize();

    drawActivityLine(ctx, activityIndicator);

    for (var i = 0; i < logLines.length; i++) {
        // logLines[i] = '<p>' + logLines[i].substr(1, 100) + '</p>';
        if (activityIndex.contains(i)) {
            logLines[i] = '<p class="activity_log" data-origin="" data-json = "" data-state = "origin">' + logLines[i] + '</p>';
        } else {
            logLines[i] = '<p class="log" data-origin="" data-json = "" data-state = "origin">' + logLines[i] + '</p>';
        }
    }
    p.innerHTML = logLines.join('');
}

function initCanvasSize() {
    ratio = getRatio(ctx) || 1; // 屏幕分辨率
    canvas.width = canvasArea.clientWidth * ratio;
    canvas.height = canvasArea.clientHeight * ratio;
    canvas.style.width = canvasArea.clientWidth + "px";
    canvas.style.height = canvasArea.clientHeight + "px";

    ACTIVITY_AREA_WIDTH = canvas.width;
    ACTIVITY_AREA_HEIGHT = canvas.height;
}

// ---

function calculateMaxNearDistance() {
    MAX_NEAR_DISTANCE = logLineSize / 100;
    if (MAX_NEAR_DISTANCE < 5) {
        MAX_NEAR_DISTANCE = 5;
    }
}

// --

var logArea = document.getElementById('log_area');
var lastScrollLogTopIndex = 0;
var lastScrollTop = 0;

drawScrollArea();

function drawScrollArea() {
    logArea.addEventListener("scroll", onLogAreaScroll);
}

function onLogAreaScroll() {
    var topFirstOutLogIndex = getTopFirstOutLogIndex();
    var bottomFirstOutLogIndex = getBottomFirstOutLogIndex(topFirstOutLogIndex);

    var topPx = getVerticalScalePx(topFirstOutLogIndex);
    var height = getVerticalScalePx(bottomFirstOutLogIndex) - topPx;

    var canvas = document.getElementById('canvas');
    var ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width * ratio, canvas.height * ratio);

    drawActivityLine(ctx, activityIndicator);

    ctx.fillStyle = 'rgba(0,255,225,0.3)';
    ctx.fillRect(0, topPx, ACTIVITY_AREA_WIDTH, height);

}

function getTopFirstOutLogIndex() {
    var targetIndex = 0;

    var thisScrollTop = logArea.scrollTop;
    if (lastScrollTop < thisScrollTop) {
        // 上滑内容
        for (var i = lastScrollLogTopIndex; i < logArea.childNodes.length; i++) {
            var childNode = logArea.childNodes[i];
            if (childNode.offsetTop + childNode.clientHeight >= thisScrollTop) {
                targetIndex = i - 1;
                if (targetIndex < 0) targetIndex = 0;
                break;
            }
        }
    } else {
        // 下滑内容
        for (var i = lastScrollLogTopIndex; i >= 0; i--) {
            var childNode = logArea.childNodes[i];
            if (childNode.offsetTop + childNode.clientHeight <= thisScrollTop) {
                targetIndex = i;
                break;
            }
        }
    }

    lastScrollLogTopIndex = targetIndex;
    lastScrollTop = thisScrollTop;

    return targetIndex;
}

function getBottomFirstOutLogIndex(topFirstOutLogIndex) {
    var thisScrollBottom = logArea.scrollTop + logArea.clientHeight;
    for (var i = topFirstOutLogIndex; i < logArea.childNodes.length; i++) {
        var childNode = logArea.childNodes[i];
        if (childNode.offsetTop >= thisScrollBottom) {
            return i;
        }
    }
    return logArea.childNodes.length - 1;
}

// --

var ACTIVITY_GAP_DIV_LINE = 0.4;
var ACTIVITY_AREA_WIDTH;
var ACTIVITY_AREA_HEIGHT;
var drawCount = 1;

function drawActivityLine(ctx, activityIndicator) {
    var activityStack = activityIndicator.activityIndicatorStack;
    var lineWidth = getActivityLineWidth(activityStack.length);
    var gapWidth = lineWidth * ACTIVITY_GAP_DIV_LINE;
    ctx.lineWidth = lineWidth;

    drawCount = 1;
    for (var i = 0; i < activityStack.length; i++) {
        var x = (gapWidth + lineWidth * 0.5) * (i + 1) + lineWidth * 0.5 * i;

        var activityIndicators = activityStack[i];
        for (var j = 0; j < activityIndicators.length; j++) {
            var activityIndicator = activityIndicators[j];
            var startY = getVerticalScalePx(activityIndicator.startIndex != 0 ?
                activityIndicator.startIndex : 0);
            var endY = getVerticalScalePx(activityIndicator.endIndex != 0 ?
                activityIndicator.endIndex : logLineSize);

            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);

            drawCount++;
            if (drawCount % 2 == 1) {
                ctx.strokeStyle = "#604ff0";
            } else {
                ctx.strokeStyle = "#7c71d8";
            }
            // dc63c2 7c71d8

            ctx.stroke();

            ctx.font = 12 * ratio + "px Arial";
            ctx.fillStyle = "#cccccc";
            ctx.fillText(activityIndicator.activityName, x - lineWidth / 2, startY);

            // activityTexts.add(new PreDrawText(activityIndicator.getActivityName(),
            //         x - lineWidth / 2, startY + TXT_BASE_LINE_OFFSET,
            //         activityTextPaint));
        }
    }
}

function getVerticalScalePx(index) {
    return (index / logLineSize) * ACTIVITY_AREA_HEIGHT;
}

function getActivityLineWidth(stackSize) {
    var lineCount = stackSize;
    var gapCount = lineCount + 1;
    var lineWidthCount = (lineCount + gapCount * ACTIVITY_GAP_DIV_LINE);

    return ACTIVITY_AREA_WIDTH / lineWidthCount;
}

// --
// var ACTIVITY_CREATE_SIMPLE_CHECK = /进入界面/;
// var ACTIVITY_CREATE_PATTERN = /(?<=进入界面：).*/;
// var ACTIVITY_FINISH_SIMPLE_CHECK = /退出界面/;
// var ACTIVITY_FINISH_PATTERN = /(?<=退出界面：).*/;

var ACTIVITY_CREATE_SIMPLE_CHECK = /onActivityCreated/;
var ACTIVITY_CREATE_PATTERN = /(?<=onActivityCreated\] : ).*/;
var ACTIVITY_FINISH_SIMPLE_CHECK = /onActivityDestroyed/;
var ACTIVITY_FINISH_PATTERN = /(?<=onActivityDestroyed\] : ).*/;

function resolveActivity(line, i) {
    var matchResult = [];
    if (line.search(ACTIVITY_CREATE_SIMPLE_CHECK) > -1) {
        matchResult = line.match(ACTIVITY_CREATE_PATTERN);
        if(matchResult!==null){
            activityIndicator.pushStart(i, matchResult[0]);
            activityIndex.push(i);
        }
    } else if (line.search(ACTIVITY_FINISH_SIMPLE_CHECK) > -1) {
        matchResult = line.match(ACTIVITY_FINISH_PATTERN);
        if(matchResult!==null){
            activityIndicator.pushEnd(i, matchResult[0]);
            activityIndex.push(i);
        }
    }
}

// ----

var drag = document.getElementById('log_area');
drag.addEventListener('drop', dropHandler, false);
drag.addEventListener('dragover', dragOverHandler, false);

canvas.addEventListener('click', scrollByIndex, false);

//-- to json btn

var jsonedLines = [];

var jsonBtn = document.getElementById('to_json_btn');
jsonBtn.addEventListener('click', activeJsConverter, false);

var isJsConverterActive = false;

function activeJsConverter() {
    isJsConverterActive = true;
    jsonBtn.innerHTML = '选择Log';
    setLogAreaCursorFind();
}

drag.addEventListener('click', convertToJson, false);

function convertToJson(e) {
    if (isJsConverterActive) {
        var target = e.target;
        // todo get p element, to body

        if (target.dataset.state == "origin") {
            if (target.dataset.json == "") {
                var logContent = target.innerHTML;
                target.dataset.origin = logContent;

                var jsonObj;
                try {
                    jsonObj = JSON.parse(logContent);
                } catch (err) {
                }

                if (jsonObj) {
                    var formattedStr = JSON.stringify(jsonObj, undefined, 4);
                    target.dataset.json = highLight(formattedStr);

                    target.innerHTML = target.dataset.json;
                    target.dataset.state = "json";
                }
            } else {
                target.innerHTML = target.dataset.json;
                target.dataset.state = "json";
            }
        } else if (target.dataset.state == "json") {
            target.innerHTML = target.dataset.origin;
            target.dataset.state = "origin";
        }

        isJsConverterActive = false;
        setLogAreaCursorNormal();
        jsonBtn.innerHTML = 'JSON';
    }
}

function setLogAreaCursorFind() {
    setCursor(drag, 'url(img/json_cursor.png),auto');
}

function setLogAreaCursorNormal() {
    setCursor(drag, 'default');
}

function setCursor(ele, cursorStyle) {
    ele.style.cursor = cursorStyle;
}

function highLight(json) {
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        var cls = 'number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'key';
            } else {
                cls = 'string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'boolean';
        } else if (/null/.test(match)) {
            cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

// ------

window.onresize = function () {
    initCanvasSize();
    onLogAreaScroll();
};

// ---

Array.prototype.contains = function (needle) {
    for (i in this) {
        if (this[i] === needle) return true;
    }
    return false;
}

// ----

function getRatio(context) {
    var devicePixelRatio = window.devicePixelRatio || 1;
    var backingStorePixelRatio = context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio ||
        context.msBackingStorePixelRatio ||
        context.oBackingStorePixelRatio ||
        context.backingStorePixelRatio || 1;
    var ratio = devicePixelRatio / backingStorePixelRatio;
    return ratio;
}

// 禁用页面回退
history.pushState(null, null, document.URL);
window.addEventListener('popstate', function () {
    history.pushState(null, null, document.URL);
});

// 获取参数
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] === variable) {
            return pair[1];
        }
    }
    return (false);
}


function get(url, callback) {
    var xhr = new XMLHttpRequest(); //创建新请求
    xhr.open('GET', url);
    xhr.onreadystatechange = function () {
        //如果请求完成且成功
        if (xhr.readyState === 4 && xhr.status === 200) {
            //获得响应的类型
            var type = xhr.getResponseHeader('Content-type');
            if (type.indexOf('xml') !== -1 && xhr.responseXML) {
                callback(xhr.responseXML); //Document对象响应
            } else if (type === 'application/json') {
                callback(JSON.parse(xhr.responseText)); //JSON响应
            } else {
                callback(xhr.responseText); //字符串响应
            }
        }
    };
    xhr.send(null); //立即发送请求
}
