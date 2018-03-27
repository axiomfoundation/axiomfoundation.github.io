var networkName;
var metamaskInjected = false;

window.onload = function () {
    if (typeof web3 === 'undefined') {
        $('#meta-mask-required').html('You will need <a href="https://metamask.io/">MetaMask</a> browser plugin or local web3 instance to see this website')
    }
    else {
        //web3 = new Web3(web3.currentProvider);
        $('#webpage').show();
        let checkFunction = setInterval(function () {
            if (web3.eth.accounts.length != 0) {
                if (!metamaskInjected) {
                    web3.version.getNetwork((err, netId) => {
                        networkName = networkIdToName(netId)
                        $('#coinbaseAddress').html("Registering with: " + web3.eth.coinbase + " <b><i>" + networkName + "</i></b>");
                        $('#submitJournalForm').show();
                        metamaskInjected = true;
                        //clearInterval(checkFunction);
                    })
                }
            }
            else {
                $('#coinbaseAddress').html('Please unlock your web3 account');
                $('#submitJournalForm').hide();
            }
        }, 250);
    }
}

var journalAddress;

function submitJournal() {
    var title = $("#journalTitle").val();
    var JournalContract = web3.eth.contract(journalAbi);
    var journal = JournalContract.new(
        title,
        tokenAddress,
        {
            from: web3.eth.coinbase,
            data: journalBytecode,
            gas: '3000000'
        }, function (error, contract) {
            disableFields(contract.transactionHash);
            web3.eth.getTransactionReceiptMined(contract.transactionHash).then(function (receipt) {
                journalAddress = receipt.contractAddress;
                enableFields(journalAddress);
                if (receipt.status == 1)
                    console.log('Journal contract transaction mined successfully.')
                else
                    console.log('Journal contract transaction mined, but failed.')
            });
        })
}

function disableFields(txHash) {
    $('#spinner-wrapper').show();
    $("#submitJournalButton").attr("disabled", true);
    $("#journalTitle").attr("disabled", true);
    $("#transactionInfo").show();
    $("#transactionHash").html("TX Hash: " + txHash);
}

function enableFields(_journalAddress) {
    $("#transactionHash").html('Contract mined! Journal address: <b>' + _journalAddress)
    $('#spinner-wrapper').hide();
    $("#transactionInfo").hide();
    $("#editLink").attr("href", "editjournal.html#" + _journalAddress);
    $("#editLink").html("Edit the journal");
}

