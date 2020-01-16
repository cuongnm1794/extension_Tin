$(document).ready(function(){
    loadList()
    $('#btnNew').click(function(){
        changeView("new")
    });
    $(document).on("click",'.backButton',function(){
        changeView("list")
    })

    $("#btnSave").click(function(){
        saveNew()
        changeView("list")
    })
    $('#openBackground').click(function(){
        chrome.extension.sendMessage({
            method:"openBackground"
        });
    })

    $(document).on("click",".viewList",function(){
        var nameView = $('#nameView').val();
        var listLinkView = $('#listLinkView').val();
        var time = $('#selectTime option:selected').val();
        chrome.extension.sendMessage({
            method:"view",
            nameView:nameView,
            listLinkView:listLinkView,
            time:time
        });
        alert("Hệ thống đang chạy, nếu sau 10s không thấy mở tab thì báo lại nhé!")
        changeView("list")
    })

    $(document).on("click",".delete",function(){
        var r = confirm("Bạn muốn xóa group này?");
        if (r == true) {
            var keyName = $(this).data("name")
            listKey = localStorage.getItem("listKey");
            listKey = JSON.parse(listKey)
            delete listKey[keyName]
            localStorage.setItem("listKey",JSON.stringify(listKey))
            loadList()
        } 
    });

    $(document).on("click",".view",function(){
        var nameKey = $(this).data("name");
        var link = $(this).data("link");
        $('#nameView').val(nameKey);
        $('#listLinkView').val(link);
        changeView("view");
    })

    $(document).on("click",".edit",function(){
        textSearch = $(this).data("name");
        link = $(this).data("link");
        $('#txtSearch').val(textSearch);
        $('#txtlistLink').html(link)
        changeView("new")
    })

    function saveNew(){
        var search = $('#txtSearch').val();
        var listLink = $('#txtlistLink').val();
        listLink = listLink.split("\n");
        listKey = localStorage.getItem("listKey");
        if(listKey == null){
            listKey = {}
        }else{
            listKey = JSON.parse(listKey)
        }
        listKey[search] = listLink;

        localStorage.setItem("listKey",JSON.stringify(listKey));
    }
    function changeView(type){
        if(type == "new"){
            $("#btnNew").addClass("d-none");
            $("#listDanhSach").addClass("d-none");
            $("#addView").addClass("d-none");
            $('#addNew').removeClass("d-none");
        }else if ( type == "list"){
            $("#btnNew").removeClass("d-none");
            $("#listDanhSach").removeClass("d-none");
            $("#addView").addClass("d-none");
            $('#addNew').addClass("d-none");
            loadList()
        }else if(type == "view"){
            $("#btnNew").addClass("d-none");
            $("#listDanhSach").addClass("d-none");
            $("#addView").removeClass("d-none");
            $('#addNew').addClass("d-none");
        }
    }

    function loadList(){
        listKey = localStorage.getItem("listKey");
        if(listKey == null){
            listKey = {};
        }else{
            listKey = JSON.parse(listKey);
        }
        let htmlList = "";
        if(Object.entries(listKey).length == 0) htmlList = "<li>Chưa có dữ liệu</li>"

        for(const [key,value] of Object.entries(listKey)){
            console.log(value);
            htmlList = htmlList + ' <li class="list-group-item d-flex justify-content-between align-items-center">\
            '+key+"("+value.length+')<span class="">\
          </li>';
        }
        $('#listDanhSach').html(htmlList)
    }
})