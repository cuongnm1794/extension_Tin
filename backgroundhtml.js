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

chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
    if(request.method == "completeView"){
        openViewButton(request.status,request.info)
    }
});

$('#exampleModal').on('show.bs.modal', function (event) {
    result = localStorage.getItem("recentResult");
    result = JSON.parse(result);
    if(result.status == true){
        listResult = Object.keys(result.result)
        addListToTableModal(result)
    }else{
        alert(result.info)
    }
});

function addListToTableModal(result){
    stringTbody = "";
    $('#date').html(result['time'].replace(":"," Đến "));
    $('#keySearch').html(result.name)
    listResult =result.result
    stt = 0;
    for(let [key,value] of Object.entries(listResult)){
        stringTbody += '<tr>\
            <td>'+key+'</td>\
            <td>'+parseInt(value.spend).toLocaleString()+'<br><span class="spendAfter" data-spend="'+value.spend+'"></span></td>\
            <td>\
                <input type="text" class="form-control  inputCongTien" data-name="'+key+'" data-spend="'+value.spend+'" value="0" >\
                <label for="">\
                    <input type="radio" name="congthem_'+stt+'" id="" value="tien" checked="checked"> Tiền tổng\
                </label>\
                <label for="">\
                    <input type="radio" name="congthem_'+stt+'" id="" value="phanTram"> Phần trăm\
                </label>\
            </td>\
        </tr>'
        stt++;
    }
    $("#resultString").val(JSON.stringify(result.result))
    $('#linkOpen').val(result.link[0])
    $("#tbodyEdit").html(stringTbody)
}


$(document).on('change','input[type="radio"],.inputCongTien',function(){
    tr = $(this).closest('tr');
    editMoney(tr)
})

function editMoney(tr){
    soLuongCong = tr.find('input.inputCongTien').val();
    key = tr.find('input.inputCongTien').data("name")
    loai = tr.find("input[type='radio']:checked").val()
    spend = tr.find('input.inputCongTien').data('spend')
    
    //tinh tien cong
    tienCong = soLuongCong;
    if(loai == "phanTram"){
        tienCong =  (spend*(soLuongCong/100));
    }
    tienCong = parseInt(tienCong) +   parseInt(spend);
    tr.find('.spendAfter').html("("+parseInt(tienCong).toLocaleString()+")")

    console.log(tienCong)
}
$('#luuCongTien').on('click',function(){
    openListDaCong()
})


function openListDaCong(){

    listResult = JSON.parse($('#resultString').val());
    change  = 0

    $('input.inputCongTien').each(function(){
        //if($(this).val() > 0){
            change = 1
            soLuongCong = $(this).val()
            key = $(this).data("name")
            loai = $(this).closest("td").find("input[type='radio']:checked").val()
            spend = listResult[key].spend
            
            //tinh tien cong
            tienCong = soLuongCong;
            if(loai == "phanTram"){
                tienCong =  (spend*(soLuongCong/100));
            }
            tienCong = parseInt(tienCong) +   parseInt(spend);
            listResult[key].spend = tienCong
        //}
    })
    if(change == 1) {
        //goi mở tab và chỉnh số lượng
        chrome.runtime.sendMessage({
            method:"changeSoLuong",
            link:$('#linkOpen').val(),
            data:JSON.stringify(listResult)
        });
    }
}

function openViewButton(status,info){
    $(".view").attr("disabled","").html("Xem");
    //show btn 
    if(status == false ) alert(info)
    else console.log(info);
}

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
        });
        alert("Hệ thống đang chạy!")
        $(".view").attr('disabled','disabled').html("Loading...");
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
$(document).on('click','.btnToday',function(){
    var now = new Date();

    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);

    var today = now.getFullYear()+"-"+(month)+"-"+(day) ;
    $(this).closest(".card").find('.datefrom').val(today)
    $(this).closest(".card").find('.dateend').val(today)

})

$(document).on('click',".btnYesterday",function(){

    var now = new Date();
    now.setDate(now.getDate() - 1);
    var day = ("0" + now.getDate()).slice(-2);
    var month = ("0" + (now.getMonth() + 1)).slice(-2);

    var yesterday = now.getFullYear()+"-"+(month)+"-"+(day) ;
    $(this).closest(".card").find('.datefrom').val(yesterday)
    $(this).closest(".card").find('.dateend').val(yesterday)
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
                                    <div class="row"><div class="col-6"><button class="btn btn-info btnYesterday">Yesterday</button></div><div class="col-6"><button class="btn btn-info btnToday">Today</button></div></div><br>\
                                    <button class="btn btn-primary view btnView'+stt+'" data-stt = "'+stt+'" data-name="'+key+'">Xem</button>\
                                    <button class="btn btn-success congthem d-none" data-name="'+key+'">Cộng thêm</button>\
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
    console.log(request)
    if(request.method == "returnListDanhsach"){
        addList(request.list);
    }else if(request.method == "unlockView"){
        resetBtnView()
    }
});
showButtonCongThem();
function resetBtnView(){
    showButtonCongThem();

    $('button.view').each(function(){
        $(this).prop("disabled",false).text("Xem")
    })
}

function changeDivView(idDiv){
    $('#addNew').addClass('d-none');
    $('#view').addClass('d-none');
    $('#'+idDiv).removeClass('d-none');
}
function showButtonCongThem(){
    result = localStorage.getItem("recentResult");
    if(result !== null){
        result = JSON.parse(result)
        name = result.name
        $('.congthem').each(function(){
            if($(this).data('name') == name) $(this).removeClass('d-none')
            else $(this).addClass('d-none')
        })
    }
}
$(document).on('click','.congthem',function(){
    $('#exampleModal').modal()
})
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


