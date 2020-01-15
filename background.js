




//* chạy nền
let search = "";
let searchEncode = encodeURIComponent('"'+search+'"');

chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
    if(request.method == "view"){
        search = request.nameView;
        searchEncode = encodeURIComponent('"'+search+'"');
        listLink = request.listLinkView.split("\n");
        timex = getDate(request.time);
        for(i = 0; i < listLink.length;i++){
            listLink[i] = listLink[i] + "&date="+timex+"%2C"+request.time+"&filter_set=SEARCH_BY_CAMPAIGN_GROUP_NAME-STRING%1ECONTAIN%1E"+searchEncode;
        }
        run(listLink)
    }else if(request.method == "openBackground"){
        chrome.tabs.create({url: chrome.extension.getURL('background.html')});
    }
})
chrome.runtime.onMessage.addListener(async function(request , sender, sendResponse) {
    if(request.method == "getUrlTab"){
        let result = await getAllTab();
        chrome.runtime.sendMessage({
            method:"returnListDanhsach",
            list:result
        });
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

async function run(listLink){
    let abc = await getlink(listLink);
    abc = JSON.stringify(abc);
    chrome.tabs.create({url:listLink[0]}, function(tabs){
        idTab = tabs.id
        chrome.tabs.executeScript(idTab, {file: "jquery.js"}, function(){
            chrome.tabs.executeScript(idTab, { code: 'console.log("hello"); var listDanhSach = '+abc+' '}, function(){
                chrome.tabs.executeScript(idTab, {file: "addTable.js"}, function(){
                });
            });
        });
    })
}

function getDate(time){
    var date = new Date();
    var day = date.getDate();
    if(day < 10) day = "0"+day;
    var month = date.getMonth() +1;
    if(month < 10) month = "0"+month;
    var year = date.getFullYear();

    date.setDate(date.getDate() - 1);
    var dayYesterday = date.getDate();
    if(dayYesterday < 10) dayYesterday = "0"+dayYesterday;
    var monthYesterday = date.getMonth() +1;
    if(monthYesterday < 10) monthYesterday = "0"+monthYesterday;
    var yearYesterday = date.getFullYear();

    data = new Date();
    date.setDate(date.getDate() + 2);
    var dayTomorrow = date.getDate();
    if(dayTomorrow < 10) dayTomorrow = "0"+dayTomorrow;
    var monthTomorrow = date.getMonth() +1;
    if(monthTomorrow < 10) monthTomorrow = "0"+monthTomorrow;
    var yearTomorrow = date.getFullYear();

    var returnTime = "";
    if(time == "yesterday"){
        returnTime = yearYesterday+"-"+monthYesterday+"-"+ ( dayYesterday )+"_"+year+"-"+month+"-"+  day;
    }else if(time == "today"){
        returnTime = year+"-"+month+"-"+  day+"_"+yearTomorrow+"-"+monthTomorrow+"-"+ ( dayTomorrow );
    }
    return returnTime
}
async function getlink(listLink){
    uri = listLink;
    let returnabc = new Promise( async function(resolve,reject){
        let result = {};
        let returnKetQua = {};
        for(i =0;i<uri.length;i++){
            try {
                result[i] = await getName(uri[i]);
                result[i]['solieu'] = await getDuLieu(result[i].actId,result[i].accessToken,result[i].business_id,result[i].sessionID,result[i].stringListId)
                for(const [key,value] of Object.entries(result[i]['solieu'])){
                    var nameCamp = result[i]['listName'][value['campaign_id']]['name'];
                    var end = result[i]['listName'][value['campaign_id']]['end'];

                    if(typeof returnKetQua[nameCamp] === "undefined"){
                        returnKetQua[nameCamp] = {};
                        returnKetQua[nameCamp]["comment"] = 0;
                        returnKetQua[nameCamp]["spend"] =0;
                        returnKetQua[nameCamp]["newmessage"] =0;
                        returnKetQua[nameCamp]["messaging_connect"] =0;
                        returnKetQua[nameCamp]["reach"] =0;
                        returnKetQua[nameCamp]["results"] =0;
                        returnKetQua[nameCamp]["impressions"] =0;
                        returnKetQua[nameCamp]["end"] ="";
                    }

                    returnKetQua[nameCamp]["spend"] = parseInt(returnKetQua[nameCamp]["spend"]) + parseInt(value['spend']);
                    returnKetQua[nameCamp]["impressions"] = parseInt(returnKetQua[nameCamp]["impressions"]) + parseInt(value['impressions']);
                    returnKetQua[nameCamp]["reach"] = parseInt(returnKetQua[nameCamp]["reach"]) + parseInt(value['reach']);
                    returnKetQua[nameCamp]['end'] = (typeof end !=="undefined")?end:0;
                    if(typeof value['results'][0]['values'] != "undefined") returnKetQua[nameCamp]["results"] = parseInt(returnKetQua[nameCamp]["results"]) + parseInt(value['results'][0]['values'][0]['value'])

                    if(typeof value['actions'] !== "undefined" ){
                        for(j =0;j<value['actions'].length;j++){
                            if(value["actions"][j]["action_type"] == "comment") returnKetQua[nameCamp]["comment"] = parseInt(returnKetQua[nameCamp]["comment"]) +  parseInt(value["actions"][j]['value'])
                            if(value["actions"][j]["action_type"] == "onsite_conversion.messaging_first_reply") returnKetQua[nameCamp]["newmessage"] = parseInt(returnKetQua[nameCamp]["newmessage"]) +  parseInt(value["actions"][j]['value'])
                            if(value["actions"][j]["action_type"] == "onsite_conversion.messaging_block") returnKetQua[nameCamp]["messaging_connect"] = parseInt(returnKetQua[nameCamp]["messaging_connect"]) +  parseInt(value["actions"][j]['value'])
                            

                        }
                    }
                }

                //open link
                
            } catch (error) {
                reject(error);
            }

        };
        resolve(returnKetQua)
    });
    return returnabc;

}
  
async function getList(url){
    let actId = GetBetween(url,"act=","&");
    nameListReturn = [];
    let result = await new Promise((resolve,reject)=>{
        $.get(url)
        .done( function(data){
            var accessToken = GetBetween(data,"\"access_token\":\"","\"}]");
            var sessionID = GetBetween(data,"sessionID\":\"","\"");
            var business_id = GetBetween(url,"business_id=","&");
            var listScript = data.split("<script>");
            for(var i =0; i<listScript.length;i++){
                if(listScript[i].includes("get/v4.0/act_"+actId+"/insights")){
                    eval("var solieuList = {data:[" +GetBetween(listScript[i],"\":{data:[","}}]")+"}");
                }else if(listScript[i].includes("get/v4.0/{") && listScript[i].includes(search)){
                    eval("var nameList = "+GetBetween(listScript[i],"\"yesterday_spent\\\"]}\":","}}]") + "}");
                }
            }
            if(typeof solieuList == "undefined" || typeof nameList == "undefined") reject("Không lấy được dữ liệu!")
            solieuList = solieuList['data'];
            for(var i = 0 ; i < solieuList.length;i++){
                nameList[solieuList[i]['campaign_id']]["solieu"] = solieuList[i];
            }
            var listId = Object.keys(nameList);
            var listId = listId.filter(function(item){
                return /^\d+$/.test(item);
            });
            var stringListId = "\"" +listId.join("\",\"")+"\"";

            
            var stringUrlGetSoLieu = 'https://graph.facebook.com/v4.0/act_'+actId+'/insights?access_token='+accessToken+'&__activeScenarios=["insightsTable.view","table_insights_footer_dd","table_insights_body_dd"]&__business_id='+business_id+'&_app=ADS_MANAGER&_priority=HIGH&_reqName=adaccount/insights&_reqSrc=AdsPETableDataFetchingPolicy.fetchBody.stats>fetchSync&_sessionID='+sessionID+'&action_attribution_windows=["default"]&date_preset=yesterday&fields=["results","objective","reach","impressions","cpm","cost_per_result","actions","spend","campaign_id"]&filtering=[{"field":"campaign.delivery_info","operator":"IN","value":["active","archived","completed","inactive","limited","not_delivering","not_published","pending_review","permanently_deleted","recently_completed","recently_rejected","rejected","scheduled"]},{"field":"campaign.id","operator":"IN","value":['+stringListId+']}]&include_headers=false&level=campaign&limit=5000&locale=en_GB&method=get&pretty=0&suppress_http_code=1&';

            for (const [key,value] of Object.entries(nameList)){
                if(!key.match(/^[0-9]+$/)) {delete nameList[key];continue;}
                nameListReturn[key] = {
                    name:value['name']
                }
            }
            $.get(stringUrlGetSoLieu)
            .done(function(data){
                for(j = 0; j < data.data.length;j++){
                    nameListReturn[data.data[j]['campaign_id']] = data.data[j]
                }
            })
            resolve(nameListReturn)
            
        })
        .fail(function(){
            reject("Không lấy được thông tin")
        })
    })
    return result;
}

async function getName(url){
    let result = await new Promise((resolve,reject)=>{
        let actId = GetBetween(url,"act=","&");
        $.get(url)
        .done( function(data){
            var accessToken = GetBetween(data,"\"access_token\":\"","\"}]");
            var sessionID = GetBetween(data,"sessionID\":\"","\"");
            var business_id = GetBetween(url,"business_id=","&");
            var listScript = data.split("<script>");
            for(var i =0; i<listScript.length;i++){
                if(listScript[i].includes("get/v4.0/{") && listScript[i].includes(search)){
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
                actId:actId,
                accessToken:accessToken,
                sessionId:sessionID,
                business_id:business_id,
                listName:nameList,
                stringListId:stringListId
            };
            resolve(objreturn)
        }).fail((data)=>reject("error get name"))

    })
    return result;
}

async function getDuLieu(actId,accessToken,business_id,sessionID,stringListId){
    var stringUrlGetSoLieu = 'https://graph.facebook.com/v4.0/act_'+actId+'/insights?access_token='+accessToken+'&__activeScenarios=["insightsTable.view","table_insights_footer_dd","table_insights_body_dd"]&__business_id='+business_id+'&_app=ADS_MANAGER&_priority=HIGH&_reqName=adaccount/insights&_reqSrc=AdsPETableDataFetchingPolicy.fetchBody.stats>fetchSync&_sessionID='+sessionID+'&action_attribution_windows=["default"]&date_preset=today&fields=["results","objective","reach","impressions","cpm","cost_per_result","actions","spend","campaign_id"]&filtering=[{"field":"campaign.delivery_info","operator":"IN","value":["active","archived","completed","inactive","limited","not_delivering","not_published","pending_review","permanently_deleted","recently_completed","recently_rejected","rejected","scheduled"]},{"field":"campaign.id","operator":"IN","value":['+stringListId+']}]&include_headers=false&level=campaign&limit=5000&locale=en_GB&method=get&pretty=0&suppress_http_code=1&';
    console.log("stringUrlGetSoLieu",stringUrlGetSoLieu)
    let result = await new Promise((resolve,reject)=>{
        
        $.get(stringUrlGetSoLieu)
        .done( function(data){
            console.log("data",data)
            if(typeof data.error !== "undefined") reject("error get data")
            resolve(data.data);

        }).fail((data)=>reject("error get data"))

    })
    return result;
}

function GetBetween(content, start, end) {
    var r = content.split(start);
    if ((r[1])) {
        r = r[1].split(end);
        return r[0];
    }
    return 0;
}