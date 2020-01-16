$(document).ready(function(){
    getListView()
    $('#refresh').on("click",function(){
        console.log("refresh")
        getAllLink();
    })

    $(document).on("click",".addLink",function(){data = $(this).data("link");clickAddSpan(data); $(this).closest("li").removeClass("d-flex").addClass("d-none");   })
    

    $("#listGroupCurrent").on("click",".delete",function(){
        $(this).closest('li').remove()
    })

    $(document).on("click","#saveNew",function(){saveList()});
    $('#addNewGroup').click(function(){
        $('#campaignName').data("oldName","").val("");
        changeDivView("addNew")
    })
    $('#back').click(function(){changeDivView("view")})
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
$(document).on('click','.deleteGroup',function(){
    var r = confirm("Bạn muốn xóa group này?");
    if (r == true) {
        var keyName = $(this).data("name")
        listKey = localStorage.getItem("listKey");
        listKey = JSON.parse(listKey)
        delete listKey[keyName]
        localStorage.setItem("listKey",JSON.stringify(listKey))
        getListView()
    }
})
$(document).on('click','.editGroup',function(){
    $('#listGroupCurrent').html("");

    var keyName = $(this).data("name")
    $('#campaignName').val(keyName)
    $('#campaignName').data("oldName",keyName);
    listKey = localStorage.getItem("listKey");
    listKey = JSON.parse(listKey)
    listKey = listKey[keyName]

    for(i =0; i < listKey.length;i++){
        clickAddSpan(listKey[i]);
    }

    changeDivView("addNew")
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
                <h5 class="mb-0 d-flex justify-content-between align-items-center">\
                    <button class="btn btn-link" data-toggle="collapse" data-target="#collapse'+stt+'" aria-expanded="false" aria-controls="collapse'+stt+'">\
                    '+key+'\
                    </button>\
                    <div>\
                    <span class="badge-primary badge badge-pill editGroup" data-name="'+key+'"> <i class="fa fa-pencil" aria-hidden="true"></i>                </span>\
                    <span class="badge-danger badge badge-pill deleteGroup" data-name="'+key+'"><i class="fa fa-times" aria-hidden="true"></i>                  </span>\
                    </div>\
                </h5>\
                </div>\
                <div id="collapse'+stt+'" class="collapse" aria-labelledby="heading'+stt+'" data-parent="#accordion">\
                <div class="card-body">\
                    <div class="row">\
                        <div class="col-8">\
                            <div class="card ">\
                            <div class="card-header bg-success text-white d-flex ">\
                                <span>Danh sách link</span>\
                            </div>\
                            <div class="card-body">'
                        +value.join("<hr>")+'</div></div></div>\
                        <div class="col-4">\
                            <div class="row">\
                                <div class="col-12">\
                                <div class="card"><div class="card-header text-white bg-success">Xem theo ngày</div><div class="card-body">\
                                    <div class="form-group"><label>Từ ngày</label><input class="form-control datefrom" type="date" ></div><div></div>\
                                    <div class="form-group"><label>Đến ngày</label><input class="form-control dateend" type="date" ></div><div></div>\
                                    <button class="btn btn-primary view btnView'+stt+'" data-stt = "'+stt+'" data-name="'+key+'">Xem</button>\
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
                <span class="badge-primary badge badge-pill addLink" data-link="'+value.url+'" >\
                    <i class="fa fa-plus" aria-hidden="true"></i>\
                </span>\
            </li>';
        }
    }
    if(li == ""){
        li = "<li>Bạn chưa mở tab nào của facebook business</li>"
    }
    $('#listTabMoSan').html(li)
}

chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
    if(request.method == "returnListDanhsach"){
        addList(request.list);
    }
});

function changeDivView(idDiv){
    $('#addNew').addClass('d-none');
    $('#view').addClass('d-none');
    $('#'+idDiv).removeClass('d-none');
}

/**
 * Add
 */
function saveList(){
    let nameCamp = $('#campaignName').val();
    listKey = localStorage.getItem("listKey");
    if(listKey == null){
        listKey = {}
    }else{
        listKey = JSON.parse(listKey)
    }
    if($("#campaignName").data("oldName") !== ""){
        delete listKey[$("#campaignName").data("oldName")];
    }
    if(nameCamp){

        let listLink = [];
        $('#listGroupCurrent li').each(function(index){
            listLink.push($(this).data("link"))
        });
        
        listKey[nameCamp] = listLink;

        localStorage.setItem("listKey",JSON.stringify(listKey));
        getListView();
        changeDivView("view");
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


