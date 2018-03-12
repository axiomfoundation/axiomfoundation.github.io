var networkName;
var articleAddress; 
var journalAddress; 
var publicationCost;

window.onload = function () {
    setHeaderLinks();
    if (typeof web3 === 'undefined') {
        $('#meta-mask-required').html('You will need <a href="https://metamask.io/">MetaMask</a> browser plugin or local myWeb3 instance to see this website')
    }
    else {
        //web3 = new myWeb3(myWeb3.currentProvider);
        journalAddress = window.location.href.split('#')[1];
        articleAddress = window.location.href.split('#')[2];
        setJournalDetails();
        if (articleAddress) {
            setArticleAdrress();
        }
        var checker = setInterval(function(){
            if (web3.eth.accounts.length != 0)
            {
                web3.version.getNetwork((err, netId) => {
                    networkName = networkIdToName(netId)               
                    $('#coinbaseAddress').html("Logged in as: " + web3.eth.coinbase + " <b><i>" + networkName + "</i></b>");
                    $('#webpage').show();
                    clearInterval(checker);
                })
            }
            else
            {
                $('#coinbaseAddress').html('Please unlock your web3 account');     
                $('#webpage').hide();          
            }
        }, 250)
    }
}

function initJournal() {
    return new Promise((resolve, reject) => {
        const JournalContract = web3.eth.contract(journalAbi);
        const journalAddress = window.location.href.split('#')[1];
        JournalContract.at(journalAddress, (error, journal) => {
            if (error) {
                reject(new Error('Error initializing Journal Contract: ' + error));
                return;
            }

            resolve(journal);
        })
    })
}

function initToken() {
    return new Promise((resolve, reject) => {
        const ScienceToken = web3.eth.contract(ERC20Abi);
        ScienceToken.at(tokenAddress, (error, token) => {
            if (error) {
                reject(new Error('Error initializing Token Contract: ' + error))
                return;
            }         
            
            resolve(token);
        });
    });
}

function setArticleAdrress() {
    if (!articleAddress) {
        articleAddress = $('#articleAddress').val();
    }
    history.pushState(null, null, 'article.html#' + journalAddress + "#" + articleAddress)

    initJournal().then(result => {
        const journal = result;

        journal.isPublished(articleAddress, (error, _isPublished) => {
            if (_isPublished) {
                $("#approvedArticle").html("The article is already published in this journal.");
                journal.isEditor(web3.eth.coinbase, function (error, isEditor) {
                    if (isEditor) {
                        $("#deleteField").show();
                    }
                })
            } else {
                journal.publicationCost(function (error, result) {
                    publicationCost = result;
                    $("#publicationCost").html('Publication Cost: ' + publicationCost / 1e18 + " SCI");
                    $("#publishArticle").prepend("Publish the article for " + publicationCost / 1e18 + " SCI: ");
                });
    
                journal.isApprovedPublication(articleAddress, function (error, isApproved) {
                    if (isApproved) {
                        $("#approvedArticle").html("The article can be published.");
                        $("#publishField").show();
                        $("#approveButton").html("Dissapprove");
                        $("#approveButton").attr("onclick", "approve(false)")
                        updateMyTokenBalance();
                    }
                    else {
                        $("#approvedArticle").html("The article is not approved for publication.");
                        $("#approveButton").html("Approve");
                        $("#approveButton").attr("onclick", "approve(true)")
                    }
    
                    journal.isEditor(web3.eth.coinbase, function (error, isEditor) {
                        if (isEditor) {
                            $("#journalField").show();
                            if (!userIsAuthor) {
                                $("#publishField").hide();
                            }
                            $("#approveField").show();
                        }
                    })
                })
            }
        })
    }).catch(error => {
        window.alert(error);
    })

    articleAPI.articleAt(articleAddress).then(result => {
        const article = result;

        article.author(function(error, author){
            if (author !== null) {
                if (author == web3.eth.coinbase){
                    $("#journalField").show();
                    userIsAuthor = true;
                } else {
                    $("#isAuthor").html("You are not the author of this article");
                }
            } else {
                $("#articleLink").html("This seems not to be the address of a published article");
            }
        })

        article.meta(function(error, meta){
            if (meta !== null){
                $("#articleLink").html("Link to the article published at " + articleAddress);
                $("#articleLink").attr("href", "https://ipfs.infura.io/ipfs/" + meta);
                $("#articleInput").hide();
            }
            else {
                $("#articleLink").html("This seems not to be the address of a published article");
            }
        })
    }).catch(error => {
        window.alert(error)
    })
}

function setJournalDetails(){
    var JournalContract = web3.eth.contract(journalAbi);
    JournalContract.at(journalAddress, function(error, journal){
        journal.title(function(error, result){
            $("#journalTitle").html(result);
        })
        journal.publicationCost(function(error, result){
            publicationCost = result;
            $("#publicationCost").html('Publication Cost: ' + publicationCost / 1e18 + " SCI");
        })
    })
}

function updateMyTokenBalance(){    
    initToken().then(result => {
        const token = result;

        token.balanceOf(web3.eth.coinbase, function(error, balance) {
            $("#myFunds").html("My balance: " + balance/1e18 + " SCI");
        })
    })
}

function publish(){
    if(publicationCost == 0){
        freePublication();
    }
    else{
        paidPublication();
    }
}

function freePublication(){
    var JournalContract = web3.eth.contract(journalAbi);
    JournalContract.at(journalAddress, function(error, journal){
        try{
            journal.publishArticle(articleAddress, function(error, result){
                disableFields(result);
                web3.eth.getTransactionReceiptMined(result).then(function (receipt) {
                    enableFields();
    
                    if (receipt.status == 1)
                        console.log('Transaction mined successfully.')
                    else
                        console.log('Transaction mined, but failed.')
                });
            });
        }
        catch (error){
            window.alert(error);
        }
    });
}

function paidPublication(){
    var ScienceToken = web3.eth.contract(ERC20Abi);
    ScienceToken.at(tokenAddress, function(error, token){
        try{
            var articleAddressBytes = new Uint8Array(20);
            articleAddressBytes = hexToBytes(articleAddress);
            token.approveAndCall(journalAddress, publicationCost, String.fromCharCode.apply(null, articleAddressBytes), function(error, result){
                disableFields(result);
                web3.eth.getTransactionReceiptMined(result).then(function (receipt) {
                    enableFields();
    
                    if (receipt.status == 1)
                        console.log('Transaction mined successfully.')
                    else
                        console.log('Transaction mined, but failed.')
                });
            })
        }
        catch (error){
            window.alert(error);
        }
    });
}

function approve(status){
    initJournal().then(result => {
        const journal = result;

        journal.changePublicationStatus(articleAddress, status, function(error, result){
            disableFields(result);
            web3.eth.getTransactionReceiptMined(result).then(function (receipt) {
                enableFields();

                if (receipt.status == 1){
                    console.log('Transaction mined successfully.');
                } else {
                    console.log('Transaction mined, but failed.');
                }
            })
        })
    })
}

function deleteArticle(){
    if (!confirm("Are you absolutely sure you want to delete this article?\nTHERE IS NO UNDO FOR THIS OPERATION!")){
        return;
    }

    initJournal().then(result => {
        const journal = result;

        journal.removeArticle(articleAddress, function (error, result) {
            disableFields(result);
            web3.eth.getTransactionReceiptMined(result).then(function (receipt) {
                enableFields();

                if (receipt.status == 1)
                    console.log('Transaction mined successfully.')
                else
                    console.log('Transaction mined, but failed.')
            })
        })
    })
}

function disableFields(_transactionHash) {
    $("#spinner-wrapper").show();
    $("#publishArticle").hide();
    $("#approveField").hide();
    $("#deleteField").hide();
    $("#transactionInfo").show();
    $("#transactionHash").html("TX Hash: " + _transactionHash);
}

function enableFields() {
    $("#spinner-wrapper").hide();
    $("#transactionHash").html('Finished. Please check the journal website');
    $("#transactionInfo").hide();
    location.reload();
}