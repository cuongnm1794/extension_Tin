chrome.runtime.onMessage.addListener(async function(request , sender, sendResponse) {
    if(request.method == "View"){
        console.log("method view");
        showResult(request)
    }else if(request.method == "openBackground"){
        console.log("method openBackground");

        chrome.tabs.create({url: chrome.extension.getURL('background.html')});
    }else if(request.method == "getUrlTab"){
        let result = await getAllTab();

        chrome.runtime.sendMessage({
            method:"returnListDanhsach",
            list:result
        });
    }else if(request.method == "changeSoLuong"){
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
    console.log("debug.showResult");
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
        
    }else{
        console.log("error listUrl");

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
        __business_id = $.urlParam("business_id",listLink[j]);
        try {
            listName = await getInfoLink(listLink[j],name);
          
            getDataSubDetail = await getDataSub(act,listName.accessToken,__business_id,listName.sessionId,listName.stringListId,from,end);
            getDataSubDetail = getDataSubDetail.data[0]

            let headers = getDataSubDetail.headers
            let rows = getDataSubDetail.rows
            for(i =0; i < rows.length;i++){
                let idCamp = rows[i].dimension_values[headers.dimensions.findIndex(function(element){ return element == "campaign_id" })];
                let nameCamp = listName.listName[rows[i].dimension_values[headers.dimensions.findIndex(function(element){ return element == "campaign_id" })]].name;
                let comment = 0;
                if(typeof rows[i].action_values[0].types != "undefined" && rows[i].action_values[0].types.includes("comment") ) comment = rows[i].action_values[0].values[rows[i].action_values[0].types.findIndex(function(element){ return element == "comment" })];

                let spend = rows[i].atomic_values[headers.atomic_columns.findIndex(function(element){ return element.name == "spend" })];
                
                let newmessage = 0;
                if(typeof rows[i].action_values[0].types != "undefined" && rows[i].action_values[0].types.includes("onsite_conversion.messaging_first_reply"))  newmessage = rows[i].action_values[0].values[rows[i].action_values[0].types.findIndex(function(element){ return element == "onsite_conversion.messaging_first_reply" })];

                let messaging_connect = 0;
                if(typeof rows[i].action_values[0].types != "undefined" && rows[i].action_values[0].types.includes("onsite_conversion.messaging_block"))  messaging_connect = rows[i].action_values[0].values[rows[i].action_values[0].types.findIndex(function(element){ return element == "onsite_conversion.messaging_block" })];

                let reach = 0;
                let indexOfReach = headers.atomic_columns.findIndex(function(element){ return element.name == "reach" });
                if(indexOfReach >=0){
                    reach = rows[i].atomic_values[indexOfReach];
                }

                let results = 0;
                let indexOfResults = headers.result_columns.findIndex(function(element){ return element.name == "results" });
                if(indexOfResults >=0 && typeof rows[i].result_values[indexOfResults].value != "undefined" ){
                    results =  rows[i].result_values[indexOfResults].value;
                }

                let typeresult = "";
                if(indexOfResults >=0 && typeof rows[i].result_values[indexOfResults].indicator != "undefined" ){
                    typeresult =  rows[i].result_values[indexOfResults].indicator;
                }
                let impressions = 0;
                let indexOfimpressions = headers.atomic_columns.findIndex(function(element){ return element.name == "impressions" });
                if(indexOfimpressions >=0){
                    impressions = rows[i].atomic_values[indexOfimpressions];
                }

                let end = rows[i].dimension_values[headers.dimensions.findIndex(function(element){ return element == "date_stop" })];

                let status = await getStatusCamp(listName.accessToken,__business_id,listName.sessionId,idCamp);
                listReturn[nameCamp] = {};
                listReturn[nameCamp]["comment"] = comment;
                listReturn[nameCamp]["spend"] =spend;
                listReturn[nameCamp]["newmessage"] =newmessage;
                listReturn[nameCamp]["messaging_connect"] = messaging_connect;
                listReturn[nameCamp]["reach"] =reach;
                listReturn[nameCamp]["results"] =results;
                listReturn[nameCamp]["impressions"] =impressions;
                listReturn[nameCamp]["end"] =end;
                listReturn[nameCamp]["status"] = status;
                listReturn[nameCamp]['typeresult'] = typeresult;

            }
        } catch (error) {
            console.log("runView.error",error)
            
        }
    }
    return listReturn;
}


async function getStatusCamp(accessToken,business_id,sessionID,idCamp){
    let promise = new Promise((resolve,reject)=>{
        var jsonParam = {
            "access_token":accessToken,
            "__activeScenarioIDs":'["f27d667be7d939c_1588574904203.65"]',
            "__activeScenarios":'["table_insights_footer_dd"]',
            "__business_id":business_id,
            "_app":"ADS_MANAGER",
            "_priority":"HIGH",
            "_reqName":'objects":"ynamic_campaign_group',
            "_reqSrc":"AdsDynamicAdObjectDataManager",
            "_sessionID":sessionID,
            "am_call_tags":'{"data_manager":"AdsDynamicAdObjectDataManager"}',
            "fields":'["delivery_status{extra_data,status,substatuses}"]',
            "ids":idCamp,
            "include_headers":"false",
            "locale":"en_GB",
            "method":"get",
            "pretty":"0",
            "suppress_http_code":"1",
            "xref":"f10fa5b74e95f4c",
        }
        let stringGet = "";
        for(let[key,value] of Object.entries(jsonParam)){
            stringGet += key + "="+encodeURI(value)+"&";
        }
        var stringUrlGetSoLieu = 'https://graph.facebook.com/v5.0/?'+stringGet;
        $.get(stringUrlGetSoLieu)
        .done(function(data){
            let status = data[idCamp].delivery_status
            resolve(status)
        });
    })
    let result = await promise;
    return result;

}

async function getInfoLink(link,name){
    let promise = new Promise((resolve,reject)=>{
        $.get(link)
        .done( function(data){
            var accessToken = GetBetween(data,"\"access_token\":\"","\"}");
            var sessionID = GetBetween(data,"sessionID\":\"","\"");
            var listScript = data.split("<script>");
            for(var i =0; i<listScript.length;i++){
                if(listScript[i].includes("get/v5.0/{") && listScript[i].includes(name)){
                    eval("var nameList = "+GetBetween(listScript[i],"\"yesterday_spent\\\"]}\":","}}]") + "}");
                }
            }
           if(typeof nameList === undefined) reject("Không lấy được dữ liệu!")
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

        var jsonParam = {
            "access_token":accessToken,
            "__activeScenarioIDs":"[]",
            "__activeScenarios":"[]",
            "__business_id":business_id,
            "_app" : "ADS_MANAGER",
            "_priority" : "HIGH",
            "_reqName" : "adaccount/am_tabular",
            "_reqSrc" : "AdsPETableDataFetchingPolicy.fetchBody.stats>fetchSync",
            "_sessionID": sessionID,
            "action_attribution_windows": '["default"]',
            "column_fields": ' ["results","objective","reach","impressions","cpm","cost_per_result","actions","spend","campaign_id"]',
            "filtering": '[{"field":"campaign.delivery_info","operator":"IN","value":["active","archived","completed","inactive","limited","not_delivering","not_published","pending_review","permanently_deleted","recently_completed","recently_rejected","rejected","scheduled"]},{"field":"campaign.id","operator":"IN","value":['+stringListId+']}]',
            "include_headers": false,
            "level": 'campaign',
            "limit": '5000',
            "locale": 'en_GB',
            "method": 'get',
            "pretty": '0',
            "suppress_http_code": '1',
            "time_range": '{"since":"'+from+'","until":"'+end+'"}',
            "xref": "f3310b4f7446f7"
        }
        let stringGet = "";
        for(let[key,value] of Object.entries(jsonParam)){
            stringGet += key + "="+encodeURI(value)+"&";
        }
      
       

        var stringUrlGetSoLieu = 'https://graph.facebook.com/v5.0/act_'+actId+'/am_tabular?'+stringGet;
        console.log("debug 1",stringUrlGetSoLieu);
        $.get(stringUrlGetSoLieu)
        .done(function(data){
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