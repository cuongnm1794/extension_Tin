chrome.runtime.onMessage.addListener(async function(request , sender, sendResponse) {
    if(request.method == "View"){
        showResult(request)
    }else if(request.method == "openBackground"){
        chrome.tabs.create({url: chrome.extension.getURL('background.html')});
    }else if(request.method == "getUrlTab"){
        let result = await getAllTab();

        chrome.runtime.sendMessage({
            method:"returnListDanhsach",
            list:result
        });
    }else if(request.method == "changeSoLuong"){
        console.log(request)
        console.log(request)
        chrome.tabs.create({url:request.link}, function(tabs){
            idTab = tabs.id
            chrome.tabs.executeScript(idTab, {file: "jquery.js"}, function(){
                chrome.tabs.executeScript(idTab, { code: 'console.log("hello"); var listDanhSach = '+request.data+' '}, function(){
                    chrome.tabs.executeScript(idTab, {file: "addTable.js"}, function(){
                    });
                });
            });
        })   
    }
})

async function getAllTab(){
    let returnabc = new Promise( async function(resolve,reject){
        chrome.windows.getAll({populate:true},function(windows){
            let object = {};
            windows.forEach(function(window){
                window.tabs.forEach(function(tab){
                    object[tab["id"]] = {};
                    object[tab["id"]]["name"] = tab['title']
                    object[tab["id"]]["url"] = tab['url']
                });
              });
            resolve(object)
        });
    })
    let result = await returnabc;
    return result;
}

async function showResult(request){
    let listUrl = localStorage.getItem("listKey");
    listUrl = listKey[request.name]
    if(listUrl){
        try {
            let result = await runView(listUrl,request.name,request.from,request.end)

            //lưu vào localstorage
            let objectSaveLocalStorage = {};
            objectSaveLocalStorage["result"] = result;
            objectSaveLocalStorage['link'] = listUrl;
            objectSaveLocalStorage['name'] = request.name;
            objectSaveLocalStorage['time'] = request.from+":"+request.end;
            objectSaveLocalStorage['status'] = true;

            localStorage.setItem("recentResult",JSON.stringify(objectSaveLocalStorage));

            result = JSON.stringify(result);
            chrome.runtime.sendMessage({
                method:"unlockView",
            });
            chrome.tabs.create({url:listUrl[0]}, function(tabs){
                idTab = tabs.id
                chrome.tabs.executeScript(idTab, {file: "jquery.js"}, function(){
                    chrome.tabs.executeScript(idTab, { code: 'console.log("hello"); var listDanhSach = '+result+' '}, function(){
                        chrome.tabs.executeScript(idTab, {file: "addTable.js"}, function(){
                        });
                    });
                });
            })    
        } catch (error) {
            let objectSaveLocalStorage = {};
            objectSaveLocalStorage['status'] = false;
            objectSaveLocalStorage['info'] = error;

            localStorage.setItem("recentResult",JSON.stringify(objectSaveLocalStorage));

            console.log("showResult.error",error);
        }
        
    }


}

async function runView(listLink,name,from,end){
    console.log("backgroundnew.runView...");
    var date = new Date(end);
    date.setDate(date.getDate() + 1);
    endNew = formatDate(date);
    nameEncode = encodeURIComponent('"'+name+'"');
    listReturn = {};
    for(j =0; j< listLink.length;j++){
        listLink[j] = listLink[j] + "&date="+from+"_"+endNew+"&filter_set=SEARCH_BY_CAMPAIGN_GROUP_NAME-STRING%1ECONTAIN%1E"+nameEncode;
        act = $.urlParam("act",listLink[j]);
        __business_id = $.urlParam("__business_id",listLink[j]);
        try {
            listName = await getInfoLink(listLink[j],name);
          
            getDataSubDetail = await getDataSub(act,listName.accessToken,__business_id,listName.sessionId,listName.stringListId,from,end);
            getDataSubDetail = getDataSubDetail.data
            for(i =0; i < getDataSubDetail.length;i++){
                value = getDataSubDetail[i];
                nameCamp = listName.listName[getDataSubDetail[i].campaign_id].name;
                if(typeof listReturn[nameCamp] === "undefined"){
                    listReturn[nameCamp] = {};
                    listReturn[nameCamp]["comment"] = 0;
                    listReturn[nameCamp]["spend"] =0;
                    listReturn[nameCamp]["newmessage"] =0;
                    listReturn[nameCamp]["messaging_connect"] =0;
                    listReturn[nameCamp]["reach"] =0;
                    listReturn[nameCamp]["results"] =0;
                    listReturn[nameCamp]["impressions"] =0;
                    listReturn[nameCamp]["end"] ="";
                }
                
                listReturn[nameCamp]["spend"] = parseInt(listReturn[nameCamp]["spend"]) + parseInt(value['spend']);
                listReturn[nameCamp]["impressions"] = parseInt(listReturn[nameCamp]["impressions"]) + parseInt(value['impressions']);
                listReturn[nameCamp]["reach"] = parseInt(listReturn[nameCamp]["reach"]) + parseInt(value['reach']);
                listReturn[nameCamp]['end'] = (typeof end !=="undefined")?end:0;
                if(typeof value['results'][0]['values'] != "undefined") listReturn[nameCamp]["results"] = parseInt(listReturn[nameCamp]["results"]) + parseInt(value['results'][0]['values'][0]['value'])

                if(typeof value['actions'] !== "undefined" ){
                    for(x =0;x<value['actions'].length;x++){
                        if(value["actions"][x]["action_type"] == "comment") listReturn[nameCamp]["comment"] = parseInt(listReturn[nameCamp]["comment"]) +  parseInt(value["actions"][x]['value'])
                        if(value["actions"][x]["action_type"] == "onsite_conversion.messaging_first_reply") listReturn[nameCamp]["newmessage"] = parseInt(listReturn[nameCamp]["newmessage"]) +  parseInt(value["actions"][x]['value'])
                        if(value["actions"][x]["action_type"] == "onsite_conversion.messaging_block") listReturn[nameCamp]["messaging_connect"] = parseInt(listReturn[nameCamp]["messaging_connect"]) +  parseInt(value["actions"][x]['value'])
                    }
                }
            }    
        } catch (error) {
            console.log("runView.error",error)
            
        }
    }
    return listReturn;
}


async function getInfoLink(link,name){
    console.log("backgroundNew.getInfoLink... name: "+name)
    console.log("backgroundNew.getInfoLink... link: "+link)
    let promise = new Promise((resolve,reject)=>{
        $.get(link)
        .done( function(data){
            var accessToken = GetBetween(data,"\"access_token\":\"","\"}]");
            var sessionID = GetBetween(data,"sessionID\":\"","\"");
            var listScript = data.split("<script>");
            for(var i =0; i<listScript.length;i++){
                if(listScript[i].includes("get/v4.0/{") && listScript[i].includes(name)){
                    eval("var nameList = "+GetBetween(listScript[i],"\"yesterday_spent\\\"]}\":","}}]") + "}");
                }
            }
           if(typeof nameList == "undefined") reject("Không lấy được dữ liệu!")
           for (const [key,value] of Object.entries(nameList)){
                if(!key.match(/^[0-9]+$/)) {delete nameList[key];continue;}
                nameList[key] = {
                    name:value['name'],
                    end:value['stop_time']
                }
            }
            var listId = Object.keys(nameList);
            var stringListId = "\"" +listId.join("\",\"")+"\"";

            objreturn = {
                accessToken:accessToken,
                sessionId:sessionID,
                listName:nameList,
                stringListId:stringListId
            };
            resolve(objreturn)
        })
    })
    let result = await promise;
    return result
}



async function getDataSub(actId,accessToken,business_id,sessionID,stringListId,from,end){
    let promise = new Promise((resolve,reject)=>{
        var stringUrlGetSoLieu = 'https://graph.facebook.com/v4.0/act_'+actId+'/insights?access_token='+accessToken+'&__activeScenarios=["insightsTable.view","table_insights_footer_dd","table_insights_body_dd"]&__business_id='+business_id+'&_app=ADS_MANAGER&_priority=HIGH&_reqName=adaccount/insights&_reqSrc=AdsPETableDataFetchingPolicy.fetchBody.stats>fetchSync&_sessionID='+sessionID+'&action_attribution_windows=["default"]&time_range=%7B%22since%22%3A%22'+from+'%22%2C%22until%22%3A%22'+end+'%22%7D&fields=["results","objective","reach","impressions","cpm","cost_per_result","actions","spend","campaign_id"]&filtering=[{"field":"campaign.delivery_info","operator":"IN","value":["active","archived","completed","inactive","limited","not_delivering","not_published","pending_review","permanently_deleted","recently_completed","recently_rejected","rejected","scheduled"]},{"field":"campaign.id","operator":"IN","value":['+stringListId+']}]&include_headers=false&level=campaign&limit=5000&locale=en_GB&method=get&pretty=0&suppress_http_code=1&';
        $.get(stringUrlGetSoLieu)
        .done(function(data){
            // console.log(data);
            resolve(data)
        });
    })
    return await promise;
  
}

$.urlParam = function(name,link){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(link);
    if (results==null) {
       return null;
    }
    return decodeURI(results[1]) || 0;
}

function GetBetween(content, start, end) {
    var r = content.split(start);
    if ((r[1])) {
        r = r[1].split(end);
        return r[0];
    }
    return 0;
}

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;

    return [year, month, day].join('-');
}