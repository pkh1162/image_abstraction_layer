var express = require("express");
var request = require("request");

var searchTerm = "";
var count = 10;
var offset = 0;
var recentSearches = {};
var recentCount = 1;


var app = express();

var options = {
    url : "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + searchTerm + "&count=" + count + "&offset=" + offset + "&mkt=en-us HTTP/1.1",
    headers : {
        "Ocp-Apim-Subscription-Key" : "e5350f328cbe4a3580defdc1b467696f"
    }
};



app.get("/", function(req, res){
    
   
    
    initParams(req.query);
    //console.log(options);
    
    request(options, function(err, response){
        if (!err){
            console.log("response sent.")
   //         console.log(typeof response.body);
            var images = JSON.parse(response.body);
            
            var jsonResults = filterResults(images.value, offset, count);
           // console.log(p);
            res.json(jsonResults);
            res.end();
            
        }
        else{
            console.log("error thrown");
            throw err;
            
        }
    })
})


app.get("/recent", function(req, res){
//    res.writeHead(200, {"Content-Type" : "application/json"});

    if(recentCount == 1){
        recentSearches["no_searches"] = "No searches have been made.";
        res.json(recentSearches);
        recentSearches = {};
    }
    else{
        res.json(recentSearches);    
    }
    
    
    res.end();
})


app.listen(8080, function(){
    console.log("I'm listening...");
})


function filterResults(results, offset, count){
  //  var arr = [];
    var json = {};
    var time = new Date();
    if(searchTerm != ""){
        addToRecent(searchTerm, time);
    }
    
    if (results == ""){
        json["no results"] = "Sorry, your search turned up no results. Try something else." 
    }
    else{
        for (var img in results){
        var id = "a" + img.toString();
        json["search term"] = searchTerm;
        json["offset"] = offset.toString();
        json["count"] = count.toString();
        json[id] = {
            name : results[img]["name"],
            image_url : results[img]["contentUrl"],
            hostPage : results[img]["hostPageDisplayUrl"]
        };
       
     //   arr.push(results[img]["name"]);
            
    }    
    }
    
    
    return json;
}


function initParams(query){
    
    if (query.q){
        searchTerm = query.q;
 
    }
    else{
        searchTerm = ""
    }
    
    if (query.count){
        count = query.count;
    }
    else{
        count = 10;
    }
    
    if (query.offset){
        offset = query.offset;
    }
    else{
        offset = 0;
    }
    
    
    options = {
    url : "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + searchTerm + "&count=" + count + "&offset=" + offset + "&mkt=en-us HTTP/1.1",
    headers : {
        "Ocp-Apim-Subscription-Key" : "e5350f328cbe4a3580defdc1b467696f"
    }
    }
    
    
}


function addToRecent(searchedTerm, time){
    var count = "search_" + recentCount.toString();
    var formattedDate = time.getDate() + "/" + time.getMonth() + "/" + time.getFullYear();
    var formattedTime = time.getHours() + ":" + time.getMinutes();
    
    recentSearches[count] = {
        term_searched : searchedTerm,
        date : formattedDate,
        time : formattedTime
    }
    recentCount++;
}