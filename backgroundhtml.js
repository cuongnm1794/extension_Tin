$(document).ready(function(){
    getListView()
    $('#refresh').on("click",function(){
        getAllLink();
    })

    /**
     * Load list có sẵn
     */
    function getListView(){
        listKey = localStorage.getItem("listKey");
        if(listKey == null){
            listKey = {};
        }else{
            listKey = JSON.parse(listKey);
        }
        let htmlList = "";
        if(Object.entries(listKey).length == 0) htmlList = "<li>Chưa có dữ liệu</li>"
        stt = 0;
        for(const [key,value] of Object.entries(listKey)){
            stt++;
            console.log(key,value)
            htmlList = htmlList + '<div class="card">\
                    <div class="card-header" id="heading'+stt+'">\
                    <h5 class="mb-0">\
                        <button class="btn btn-link" data-toggle="collapse" data-target="#collapse'+stt+'" aria-expanded="false" aria-controls="collapse'+stt+'">\
                        '+key+'\
                        </button>\
                    </h5>\
                    </div>\
                    <div id="collapse'+stt+'" class="collapse" aria-labelledby="heading'+stt+'" data-parent="#accordion">\
                    <div class="card-body">\
                        <div class="row">\
                            <div class="col-8">\
                                <div class="card ">\
                                <div class="card-header bg-success text-white ">\
                                    Danh sách link\
                                </div>\
                                <div class="card-body">'
                            +value.join("<hr>")+'</div></div></div>\
                            <div class="col-4">\
                                <div class="row">\
                                    <div class="col-6">Xem</div>\
                                    <div class="col-6">Xóa Sửa</div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                    </div>\
                </div>'
        }
       
        $('#accordion').html(htmlList)
    }


    /**
     * GetLink tab
     */
    function getAllLink(){
        chrome.runtime.sendMessage({
            method:"getUrlTab"
        });
    }

    function addList(listDanhSach){
        li = ""
        for(const [key,value] of Object.entries(listDanhSach)){
            if(value.url.includes("chrome://extensions/") || value.url.includes("chrome-extension")) continue;
            li = li + '<li class="list-group-item d-flex justify-content-between align-items-center">\
                <span>'+value.name+'</span>\
                <span class="badge-primary badge badge-pill view" data-link="'+value.url+'" >\
                    <i class="fa fa-plus" aria-hidden="true"></i>\
                </span>\
            </li>';
        }
        $('#listTabMoSan').html(li)
    }

    chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
        if(request.method == "returnListDanhsach"){
            addList(request.list);
        }
    });
})