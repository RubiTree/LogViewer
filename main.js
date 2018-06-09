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
        var div = document.createElement('div');
        div.className = "text"
        div.innerHTML = this.result;

        p.insertBefore(div, null);
    }

    //读取文件内容
    reader.readAsText(file);
}

var drag = document.getElementById('input_log_area');
drag.addEventListener('drop', dropHandler, false);
drag.addEventListener('dragover', dragOverHandler, false);
