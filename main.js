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

    reader.onload = function(e){
        var logText = this.result;
        var logLines = logText.split('\n');
        var logLineSize = logLines.length;

        var foundIndex = [];
        var regex = /进入界面/;
        for(var i = 0; i < logLines.length; i++){
            if(logLines[i].search(regex) > -1){
                foundIndex.push(i);
            }
        }

        var canvas = document.getElementById('canvas');
        var ctx=canvas.getContext("2d");
        for(var i = 0;i<foundIndex.length;i++){
            var positionY = (foundIndex[i]/logLineSize)*900;
            ctx.moveTo(0,positionY);
            ctx.lineTo(200,positionY);
        }
        ctx.stroke();

        for(var i = 0; i < logLines.length; i++){
            logLines[i] = '<p>' + logLines[i].substr(1,100) + '</p>';
        }
        p.innerHTML = logLines.join('');
    }

    //读取文件内容
    reader.readAsText(file);
}

function scrollArea(e){
    var p = document.getElementById('input_log_area');
    var contentHeight = p.scrollHeight;
    p.scrollTop = (e.clientY/900)*contentHeight - 400;
}

var drag = document.getElementById('input_log_area');
drag.addEventListener('drop', dropHandler, false);
drag.addEventListener('dragover', dragOverHandler, false);

var canvas = document.getElementById('canvas');
canvas.addEventListener('click', scrollArea, false);

// 禁用页面回退
history.pushState(null, null, document.URL);
window.addEventListener('popstate', function () {
    history.pushState(null, null, document.URL);
});

console.log(getQueryVariable('redirectUrl'));

// 获取参数
function getQueryVariable(variable){
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}
