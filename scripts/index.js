var web3;
var journalInstance;
var JournalContract;
var publicationArray = [];
var loggedUser;
var userIsOwner = false;

window.onload = function () {
    if (navigator.appName == 'Microsoft Internet Explorer' ||  !!(navigator.userAgent.match(/Trident/) || navigator.userAgent.match(/rv:11/)) || (typeof $.browser !== "undefined" && $.browser.msie == 1))
    {
        $("#IEmessage").show();
    }

    //setHeaderLinks(); //ne sme u index da se koristi utilities
    $("#publishArticle").attr("href", "./article.html#" + JOURNAL_ADDRESS);
    $("#ownerAccess").attr("href", "./editjournal.html#" + JOURNAL_ADDRESS);
    //check for metamask for owner edit
    try{
        var metaweb3 = new Web3(web3.currentProvider);
        loggedUser = metaweb3.eth.coinbase;
    }
    catch(error){} //don't care
    //use infura for the rest (for users without metamask)
    web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io"));
    JournalContract = web3.eth.contract(journalAbi)
    $("#journalAddress").html("Journal Address: " + JOURNAL_ADDRESS);
    JournalContract.at(JOURNAL_ADDRESS, function(error, result){
        journalInstance = result;
        result.title(function(error, result){
            $("#journalTitle").html(result);
            $("#noPublicationInfo").hide();
        });
        result.publicationCost(function(error, result){
            $("#publicationCost").html('Publication Cost: ' + result / 1e18 + " SCI");
        });
        result.articleCount(function(error, articlecount){
            if (articlecount == 0) {
                $("#noPublicationInfo").show();
                $("#noPublicationInfo").html("No publications :(");
            }
            else {
                currentLocation = loadArticleChunk(articlecount-1, 20);
            }
        });
        result.isOwner(loggedUser, function(error, result){
            userIsOwner = result;
            if (userIsOwner){
                $("#ownerAccess").show();
            }
        });
    });
}

var currentLocation;
var finish; 
var thereSmore;

function loadArticleChunk(from, length) {
    $("#spinner").show();
    finish = from - length + 1;
    if (finish < 0) {
        length += finish;
        finish = 0; 
    }
    var processed = 0;
    publicationArray = [];
    for(i = from; i >= finish; i--){
        journalInstance.articles(i, function(error, articleAddress) {
            if (articleAddress === "0x0000000000000000000000000000000000000000")
            {
                processed++;      
            } else {
                articleAPI.createObjectFromArticleAt(articleAddress).then(article => {
                    publicationArray.push(article);
                }).catch(error => {
                    console.error('Error retrieving article at address: ' + articleAddress + ' :' + error);
                }).then(results => {
                    if (++processed == length){
                        createTable();
                    };
                });
            }
        })
    }
    //return finish-1;
    if (finish > 0){
        thereSmore = true;
        $("#loadMore").hide();
    } else {
        thereSmore = false;
        $("#loadMore").hide();
    }
}

function createTable() {
    publicationArray.sort(function(x, y){
        return y[0] - x[0];
    })
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    
    publicationArray.forEach(function (article) {
        var timestamp = article.timestamp;
        var ipfsLink = article.meta;
        var title = article.title;
        var authors = article.authors;
        var pdf = article.pdf;
        var date = new Date(timestamp * 1000);
        var articleAddress = article.articleAddress;
        var row = ''
        row += '<tr>'
        row += '<td id="journalTitle">&#8226</td>' 
        row += '<td width="99%" id="journalTitle">' + title 
        row += '<div id = "authors">by ' + authors + '</div>'
        row += '<div id = "authors">' + date.toLocaleDateString('en-EN', options) + '</div>'
        row += '</td>'
        row += '<td><a href="https://ipfs.infura.io/ipfs/' + ipfsLink + '">Summary</a><br><a href="https://ipfs.infura.io/ipfs/' + pdf + '">Pdf</a>'
        if (userIsOwner){
            row += '<br><a href="article.html#' + JOURNAL_ADDRESS + "#" + articleAddress + '">EDIT</a>'
        }
        row += "</td></tr>"
        $("#publicationList").append(row);    
        if (thereSmore){
            $("#loadMore").attr("onclick", "loadArticleChunk(" + (finish-1) + ", 20)")
            $("#loadMore").show();
        }   
        else
        {
            $("#loadMore").attr("disabled", true);
            $("#loadMore").hide();
        } 
        $("#spinner").hide();
    });
}
