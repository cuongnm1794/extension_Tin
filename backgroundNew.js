chrome.runtime.onMessage.addListener(function(request , sender, sendResponse) {
    if(request.method == "View"){
        showResult(request)
    }else if(request.method == "openBackground"){
        chrome.tabs.create({url: chrome.extension.getURL('background.html')});
    }
})


function showResult(request){
    let listUrl = localStorage.getItem("listKey");
    listUrl = listKey[request.name]
    if(listUrl){
        runView(listUrl,request.name,request.from,request.end)
    }
}

async function runView(listLink,name,from,end){
    
    nameEncode = encodeURIComponent('"'+name+'"');
    console.log(name)
    console.log(listLink[0])
    console.log(from)
    console.log(end)

    for(i =0; i< listLink.length;i++){
        listLink[i] = listLink[i] + "&date="+from+"_"+end+"&filter_set=SEARCH_BY_CAMPAIGN_GROUP_NAME-STRING%1ECONTAIN%1E"+nameEncode;

        act = $.urlParam("act",listLink[i]);
        __business_id = $.urlParam("__business_id",listLink[i]);
        console.log(listLink[i])
        try {
            listName = await getInfoLink(listLink[i],name);
            getDataSubDetail = await getDataSub(act,listName.accessToken,__business_id,listName.sessionId,listName.stringListId,from,end);

            console.log(getDataSubDetail.data)
        } catch (error) {
            console.log(error)
            
        }
    }
}


async function getInfoLink(link,name){
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