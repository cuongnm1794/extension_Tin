$(document).ready(function(){
    getListView()
    $('#refresh').on("click",function(){
        getAllLink();
    })

    $(document).on("click",".addLink",function(){data = $(this).data("link");clickAddSpan(data); $(this).closest("li").removeClass("d-flex").addClass("d-none");   })
    

    $("#listGroupCurrent").on("click",".delete",function(){
        $(this).closest('li').remove()
    })

    $(document).on("click","#saveNew",function(){saveList()});

/**
 * Dashboard
 */
$(document).on('click',".view",function(){
    from = $(this).closest('div').find('.datefrom').val();
    end = $(this).closest('div').find('.dateend').val();
    name = $(this).data('name');
    if(!from || !end){
        alert("Vui lòng chọn ngày")
    }else if(new Date(from) > new Date(end)){
        alert("Vui lòng chọn ngày sau lớn hơn ngày trước")
    }else{
        chrome.runtime.sendMessage({
            method:"View",
            name:name,
            from:from,
            end:end
        })
    }
    
})

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
                                <div class="col-12">\
                                <div class="card"><div class="card-header text-white bg-success">Xem theo ngày</div><div class="card-body">\
                                    <div class="form-group"><label>Từ ngày</label><input class="form-control datefrom" type="date" ></div><div></div>\
                                    <div class="form-group"><label>Đến ngày</label><input class="form-control dateend" type="date" ></div><div></div>\
                                    <button class="btn btn-primary view" data-name="'+key+'">Xem</button>\
                                </div></div>\
                                </div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
                </div>\
            </div>'
    }
   
    $('#accordion').html(htmlList)
}

function getAllLink(){
    chrome.runtime.sendMessage({
        method:"getUrlTab"
    });
}

function addList(listDanhSach){
    li = ""
    for(const [key,value] of Object.entries(listDanhSach)){

        if(value.url.includes("https://business.facebook.com") && $.urlParam("business_id",value.url) && $.urlParam("act",value.url)){
            li = li + '<li class="list-group-item d-flex justify-content-between align-items-center">\
                <span>'+value.name+'</span>\
                <span class="badge-primary badge badge-pill view addLink" data-link="'+value.url+'" >\
                    <i class="fa fa-plus" aria-hidden="true"></i>\
                </span>\
            </li>';
        }
    }
    $('#listTabMoSan').html(li)
}

chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
    if(request.method == "returnListDanhsach"){
        addList(request.list);
    }
});

/**
 * Add
 */
function saveList(){
    let nameCamp = $('#campaignName').val();
    if(nameCamp){

        let listLink = [];
        $('#listGroupCurrent li').each(function(index){
            listLink.push($(this).data("link"))
        });
        listKey = localStorage.getItem("listKey");
        // console.log(listKey);
        if(listKey == null){
            listKey = {}
        }else{
            listKey = JSON.parse(listKey)
        }
        listKey[nameCamp] = listLink;

        localStorage.setItem("listKey",JSON.stringify(listKey));
    }else{
        alert("Tên không được bỏ trống")
    }
  
}

function clickAddSpan(link){

    if(link.includes("https://business.facebook.com") && $.urlParam("business_id",link) && $.urlParam("act",link)){
        let linkfb = "https://business.facebook.com/adsmanager/manage/campaigns?act="+$.urlParam("act",link)+"&business_id="+$.urlParam("business_id",link);
        $('#listGroupCurrent').append(' <li class="list-group-item d-flex justify-content-between align-items-center" data-link="'+linkfb+'">\
        <span style="width:80%">'+linkfb+'</span>\
        <span class="badge-danger badge badge-pill delete" data-link="'+linkfb+'"><i class="fa fa-times" aria-hidden="true"></i>   </span>\
        </li>');
    }else{
        alert("Vui lòng chọn link facebook");
    }
    
}

/**
 * Edit
 */

    $.urlParam = function(name,link){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(link);
        if (results==null) {
           return null;
        }
        return decodeURI(results[1]) || 0;
    }
})