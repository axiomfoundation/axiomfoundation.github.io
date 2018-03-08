

function setHeaderLinks(){
    $("#publishArticle").attr("href", "./article.html#" + JOURNAL_ADDRESS);
    $("#ownerAccess").attr("href", "./editjournal.html#" + JOURNAL_ADDRESS);
}

function setEtherIcon(ethAddress, elementId){
    var icon = document.getElementById(elementId);
    icon.style.backgroundImage = 'url(' + blockies.create({ seed:ethAddress.toLowerCase() ,size: 8,scale: 16}).toDataURL()+')'
}

var hexToBytes = function(hex) {
    hex = hex.toString(16);

    hex = hex.replace(/^0x/i,'');

    for (var bytes = [], c = 0; c < hex.length; c += 2)
        bytes.push(parseInt(hex.substr(c, 2), 16));
    return bytes;
};

web3.eth.getTransactionReceiptMined = function getTransactionReceiptMined(txHash, interval) {
    console.log('Mining started on transaction: ' + txHash);
    const self = this;
    const transactionReceiptAsync = function(resolve, reject) {
        self.getTransactionReceipt(txHash, (error, receipt) => {
            if (error) {
                reject(error);
            } else if (receipt == null) {
                setTimeout(
                    () => transactionReceiptAsync(resolve, reject),
                    interval ? interval : 500);
            } else {
                resolve(receipt);
            }
        });
    };

    if (Array.isArray(txHash)) {
        return Promise.all(txHash.map(
            oneTxHash => self.getTransactionReceiptMined(oneTxHash, interval)));
    } else if (typeof txHash === "string") {
        return new Promise(transactionReceiptAsync);
    } else {
        throw new Error("Invalid Type: " + txHash);
    }
};

const networkIdToName = (networkID) => {
    let networkName
    switch (networkID) {
        case "1":
            networkName = ''
            break
        case "2":
            networkName = 'deprecated Morden test network.'
            break
        case "3":
            networkName = 'Ropsten test network.'
            break
        case "4":
            networkName = 'Rinkeby test network.'
            break
        case "42":
            networkName = 'Kovan test network.'
            break
        default:
            networkName = 'Unknown network.'
    }
    return networkName
}
