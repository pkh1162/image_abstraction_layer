var express = require("express");
var request = require("request");
var mongo = require("mongodb").MongoClient;
var dbUrl = process.env.MONGO_URI_IMAGE_ABSTRACTION;

var searchTerm = "";
var count = 10;
var offset = 0;
var recentSearches = {};
var recentCount = 1;
var recentSearchesCount = 0;


var app = express();
app.set("view engine", "pug");

var options = {
    url : "https://api.cognitive.microsoft.com/bing/v5.0/images/search?q=" + searchTerm + "&count=" + count + "&offset=" + offset + "&mkt=en-us HTTP/1.1",
    headers : {
        "Ocp-Apim-Subscription-Key" : "e5350f328cbe4a3580defdc1b467696f"
    }
};






app.get("/", function(req, res){
    
    //res.render("index");
    if (Object.keys(req.query).length == 0){
        res.render("index");
    }
    else {
        
        initParams(req.query);
    //console.log(options);
    
    request(options, function(err, response){
        if (!err){
            console.log("response sent.")
   //         console.log(typeof response.body);
            var images = JSON.parse(response.body);
            
            var jsonResults = filterResults(images.value, offset, count);
           // console.log(p);
            res.write(JSON.stringify(jsonResults));
            res.end();
            
        }
        else{
            console.log("error thrown");
            throw err;
            
        }
    })
        
    }
    
    
    
    
    
})


app.get("/recent", function(req, res){
    
    var searchCount = 0;
    
    mongo.connect(dbUrl, function(err, db){
        if (err){
            console.log("Not connected");
            throw err;
        }
        else{
            console.log("Connected");
            var collection = db.collection("image_abstraction_recentSearches");
            collection.count(function(err, count){
                if (err){
                    throw err;
                }
                else{
                    searchCount = count;
        
                    if (searchCount == 0 || searchCount == undefined){
                        recentSearches["no_searches"] = "No searches have been made.";
                        res.json(recentSearches);
                        recentSearches = {};
                    }
                    else{
                        getSearchesFromDb(res);
                    }
                }
               
                db.close();
            })
        }
        
       
        
    })
    
    
//    res.writeHead(200, {"Content-Type" : "application/json"});
    
//    getSearchesCount(afterCount, res);
  
  
    
    
    
    
    
})





app.listen(process.env.PORT || 8080, function(){
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
    
    addToDb(recentSearches[count]);
    
    
}


function addToDb(searchMetaResult) {
    
    mongo.connect(dbUrl, function(err, db){
        if (err){
            console.log("Couldn't connect to the database");
            throw err;
        }
        else{
            console.log("Connected to the database");
            var searchesCollection = db.collection("image_abstraction_recentSearches");
            
            
            
            searchesCollection.insert(searchMetaResult, function(err, data){
                if (err){
                    console.log("Couldn't insert search into the database");
                }
                else{
                    console.log("Search inserted successfully");
                }
            })
            
            searchesCollection.count(function(err, count){
                if (err){
                    console.log("Problem counting");
                    throw err;
                }
                //else console.log(count);
            })
        }
        db.close();
        return;
    })
    
    
}


function getSearchesFromDb(res) {
    
    mongo.connect(dbUrl, function(err, db){
        if (err){
            console.log("Problem connecting to db (recent searches)");
            throw err;
        }
        else{
            var searchesCollection = db.collection("image_abstraction_recentSearches");
            searchesCollection.find({}, {_id : 0}, {sort: {_id : -1}, limit : 10}).toArray(function(err, data){
                if (err){
                    console.log("Problem getting recent seaches from db");
                    throw err;
                }
                
               
                res.json(data);
            //   console.log(data);
               
            });
            
        }
        db.close();
        
    })
}

