function dragOverHandler(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dragEffect = 'copy';
}

function dropHandler(e) {
    e.stopPropagation();
    e.preventDefault();

    var p = document.getElementById('input_log_area');
    var files = e.dataTransfer.files;
    var file = files[0];
    var reader = new FileReader();

    reader.onload = function(e) {
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

function scrollByPx(e) {
    var p = document.getElementById('input_log_area');
    var contentHeight = p.scrollHeight;
    p.scrollTop = (e.clientY / 900) * contentHeight - 400;
}

function scrollByIndex(e) {
    var p = document.getElementById('input_log_area');
    var index = Math.ceil((e.clientY / 900) * logLineSize);
    var child = p.childNodes[index];
    p.scrollTop = child.offsetTop - 800;
}

// ------
get('https://'+getQueryVariable('redirectUrl'), function(result){
    renderContent(result);
});

// get('https://lc-tn27f1ke.cn-n1.lcfile.com/RTU8Rj5SDSJmF6z8Zrfli6X6ZV2WonJZ9fk41TtK.txt', function(result){
//     renderContent(result);
// });

var logLineSize;
var activityIndicator = new ActivityIndicator();

function renderContent(logText){
    var p = document.getElementById('input_log_area');

    var logLines = logText.split('\n');
    logLineSize = logLines.length;

    for (var i = 0; i < logLines.length; i++) {
        resolveActivity(logLines[i], i);
    }

    var canvas = document.getElementById('canvas');
    ACTIVITY_AREA_WIDTH = canvas.width;
    var ctx = canvas.getContext("2d");
    drawActivityLine(ctx, activityIndicator);

    for (var i = 0; i < logLines.length; i++) {
        // logLines[i] = '<p>' + logLines[i].substr(1, 100) + '</p>';
        logLines[i] = '<p class="log">' + logLines[i] + '</p>';
    }
    p.innerHTML = logLines.join('');
}

// --

var ACTIVITY_GAP_DIV_LINE = 0.4;
var ACTIVITY_AREA_WIDTH;
var drawCount = 1;

function drawActivityLine(ctx, activityIndicator) {
    var activityStack = activityIndicator.activityIndicatorStack;
    var lineWidth = getActivityLineWidth(activityStack.length);
    var gapWidth = lineWidth * ACTIVITY_GAP_DIV_LINE;
    ctx.lineWidth = lineWidth;

    for (var i = 0; i < activityStack.length; i++) {
        var x = (gapWidth + lineWidth * 0.5) * (i + 1) + lineWidth * 0.5 * i;

        var activityIndicators = activityStack[i];
        for (var j = 0; j< activityIndicators.length; j++) {
            var activityIndicator = activityIndicators[j];
            var startY = getVerticalScalePx(activityIndicator.startIndex != 0
                    ? activityIndicator.startIndex : 0);
            var endY = getVerticalScalePx(activityIndicator.endIndex != 0
                    ? activityIndicator.endIndex : logLineSize);

            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);

            drawCount++;
            if(drawCount%2 == 1){
                ctx.strokeStyle="#dc63c2";
            }else{
                ctx.strokeStyle="#7c71d8";
            }

            ctx.stroke();

            ctx.font="12px Georgia";
            ctx.fillStyle="#000000";
            ctx.fillText(activityIndicator.activityName,x - lineWidth / 2,startY);

            // activityTexts.add(new PreDrawText(activityIndicator.getActivityName(),
            //         x - lineWidth / 2, startY + TXT_BASE_LINE_OFFSET,
            //         activityTextPaint));
        }
    }
}

function getVerticalScalePx(index){
    return (index / logLineSize) * 900;
}

function getActivityLineWidth(stackSize) {
    var lineCount = stackSize;
    var gapCount = lineCount + 1;
    var lineWidthCount = (lineCount + gapCount * ACTIVITY_GAP_DIV_LINE);

    return ACTIVITY_AREA_WIDTH / lineWidthCount;
}

// --
var ACTIVITY_CREATE_SIMPLE_CHECK = /进入界面/;
var ACTIVITY_CREATE_PATTERN = /(?<=进入界面：).*/;
var ACTIVITY_FINISH_SIMPLE_CHECK = /退出界面/;
var ACTIVITY_FINISH_PATTERN = /(?<=退出界面：).*/;

function resolveActivity(line, i) {
    if (line.search(ACTIVITY_CREATE_SIMPLE_CHECK) > -1) {
        activityIndicator.addCreate(i, line.match(ACTIVITY_CREATE_PATTERN)[0]);
    } else if (line.search(ACTIVITY_FINISH_SIMPLE_CHECK) > -1) {
        activityIndicator.addFinish(i, line.match(ACTIVITY_FINISH_PATTERN)[0]);
    }
}

// ---
function ActivityIndicator(){
    this.activityIndicatorStack = [];
    this.stackIndex = -1;

    this.addCreate = function(index, activityName){
        this.stackIndex++;

        this.chargeIndicatorStack(this.stackIndex + 1);
        var currentStack = this.activityIndicatorStack[this.stackIndex];

        var indicator = new OneActivityIndicator();
        indicator.activityName = activityName;
        indicator.startIndex = index;

        currentStack.push(indicator);

    }

    this.addFinish = function(lineIndex, activityName){
        if (this.stackIndex < -1) {
            return;
        }

        if (this.stackIndex == -1) {
            var indicator = new OneActivityIndicator();
            indicator.activityName = activityName;
            indicator.endIndex = lineIndex;

            var newStack = new Array();
            newStack.push(indicator);

            activityIndicatorStack.unshift(newStack);
        } else {
            var currentStack = this.activityIndicatorStack[this.stackIndex];
            var index = currentStack.length - 1;
            var currentActivity = currentStack[index];

            if (currentActivity.activityName == activityName) {
                currentActivity.endIndex = lineIndex;
                this.stackIndex--;
            }
        }
    }

    this.chargeIndicatorStack = function(targetSize) {
        var less = targetSize - this.activityIndicatorStack.length;
        if (less > 0) {
            for (var i = 0; i < less; i++) {
                this.activityIndicatorStack.push(new Array());
            }
        }
    }
}

function OneActivityIndicator(){
    this.activityName = "";
    this.startIndex = 0;
    this.endIndex = 0;
}

// ----

var drag = document.getElementById('input_log_area');
drag.addEventListener('drop', dropHandler, false);
drag.addEventListener('dragover', dragOverHandler, false);

var canvas = document.getElementById('canvas');
canvas.addEventListener('click', scrollByIndex, false);


// ----

// 禁用页面回退
history.pushState(null, null, document.URL);
window.addEventListener('popstate', function() {
    history.pushState(null, null, document.URL);
});

// 获取参数
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return (false);
}


function get(url,callback){
  var xhr = new XMLHttpRequest();  //创建新请求
  xhr.open('GET',url);
  xhr.onreadystatechange=function(){
    //如果请求完成且成功
    if(xhr.readyState === 4 && xhr.status === 200){
      //获得响应的类型
      var type = xhr.getResponseHeader('Content-type');
      if(type.indexOf('xml') !== -1 && xhr.responseXML){
        callback(xhr.responseXML);  //Document对象响应
      }else if(type === 'application/json'){
        callback(JSON.parse(xhr.responseText));  //JSON响应
      }else{
        callback(xhr.responseText);  //字符串响应
      }
    }
  };
  xhr.send(null); //立即发送请求
}
