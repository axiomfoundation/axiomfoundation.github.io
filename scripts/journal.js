var journalAddress;
var journalInstance;

window.onload = function () {
    if (typeof web3 === 'undefined') {
        document.getElementById('meta-mask-required').innerHTML = 'You will need <a href="https://metamask.io/">MetaMask</a> browser plugin to see this website'
    }
    else {
        $.ajax({
            url : "/sampleDescription.html",
            success : function(result){
                $("#journalDescription").html(result);
            }
        });

        journalAddress = window.location.href.split('#')[1];
        $("#journalAddress").html("Journal Address: " + journalAddress);

        var JournalContract = web3.eth.contract(journalAbi);

        JournalContract.at(journalAddress, function(error, result) {
            journalInstance = result;

            journalInstance.title(function(error, result){
                $("#journalTitle").html(result);
            });
            journalInstance.publicationCost(function(error, result){
                $("#publicationCost").html('Publication Cost: ' + result / 1e18 + " SCI");
            });
            journalInstance.articleCount(function(error, result){
                for (var i = result - 1; i >= 0; i--){
                    journalInstance.articles(i, function(error, result){
                        $("#publicationList").append('<li>' + result + '</li>');
                    })
                }
            });
            journalInstance.isEditor(web3.eth.coinbase, function(error, result){
                if (result === true){
                    $("#editorArea").show();
                }
            })
        });
    }
}

function clearForPublish(status) {
    const articleAddress = $("#clear-article-address").val()

    journalInstance.changePublicationStatus(articleAddress, status, {from: web3.eth.coinbase, gas: 220000 }, (error, txHash) => {
        disableFields();  
        if (error) {
            console.error("Failed to set clear for publish status for article " + articleAddress);
            return
        } 
        web3.eth.getTransactionReceiptMined(txHash).then(function (receipt) {
            if (receipt.status == 1)
                console.log('Article ' + articleAddress + ' cleared: ' + status + '. Transaction ' + txHash + ' mined successfully.')
            else
                console.log('Article ' + articleAddress + ' cleared status not set. Transaction ' + txHash + ' mined, but failed.')
            enableFields()
        });
    })
}

function removePublished() {
    const articleAddress = $("#remove-published-article-address").val()

    journalInstance.removeArticle(articleAddress, {from: web3.eth.coinbase, gas: 320000 }, (error, txHash) => {
        disableFields();  
        if (error) {
            console.error("Failed to remove article " + articleAddress);
            return
        } 
        web3.eth.getTransactionReceiptMined(txHash).then(function (receipt) {
            if (receipt.status == 1)
                console.log('Article ' + articleAddress + ' removed. Transaction ' + txHash + ' mined successfully.')
            else
                console.log('Failed to remove article ' + articleAddress + ' Transaction ' + txHash + ' mined, but failed.')
            enableFields()
        });
    })
}

function disableFields() {
    $("#spinner-wrapper").show()
    $("#clear-article-address").attr("disabled", true)
    $("#remove-submitted-article-address").attr("disabled", true)
    $("#remove-published-article-address").attr("disabled", true)
}

function enableFields() {
    $("#spinner-wrapper").hide()
    $("#clear-article-address").attr("disabled", false)
    $("#remove-submitted-article-address").attr("disabled", false)
    $("#remove-published-article-address").attr("disabled", false)
}