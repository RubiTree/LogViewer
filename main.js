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

function scrollArea(e) {
    var p = document.getElementById('input_log_area');
    var contentHeight = p.scrollHeight;
    p.scrollTop = (e.clientY / 900) * contentHeight - 400;
}

// ---
get('https://'+getQueryVariable('redirectUrl'), function(result){
    console.log(result);
});

var drag = document.getElementById('input_log_area');
drag.addEventListener('drop', dropHandler, false);
drag.addEventListener('dragover', dragOverHandler, false);

var canvas = document.getElementById('canvas');
canvas.addEventListener('click', scrollArea, false);


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
