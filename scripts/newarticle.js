var web3;
var networkName;

window.onload = function () {
    setHeaderLinks();
    if (typeof web3 === 'undefined') {
        $('#meta-mask-required').html('You will need <a href="https://metamask.io/">MetaMask</a> browser plugin or local web3 instance to see this website')
    }
    else {
        //web3 = new Web3(web3.currentProvider);
        let checker = setInterval(function () {
            if (web3.eth.accounts.length != 0) {
                $("#meta-mask-required").html("");
                $('#webpage').show();
                web3.version.getNetwork((err, netId) => {
                    networkName = networkIdToName(netId)
                    //clearInterval(checker);
                })
            }
            else {
                $('#webpage').hide();
                $("#meta-mask-required").html('Please log into your <a href="https://metamask.io/">MetaMask</a> browser plugin or local web3 instance to see this website');
            }
        }, 250)
    }
}

var SelectedFile = [];

var openFile = function (event) {
    const Buffer = window.IpfsApi().Buffer;
    var input = event.target;
    var file = document.querySelector('input[type=file]').files[0];
    var filename = file.name;
    var reader = new FileReader();
    reader.addEventListener("load", function () {
        bytes = Buffer.from(reader.result);
        SelectedFile.push({
            path: filename,
            content: bytes,
            filesize: bytes.length
        })
    }, false);
    if (file) {
        reader.readAsArrayBuffer(input.files[0]);
    }
};

var ipfsIdPdf;

function submitArticle() {
    var ipfs = window.IpfsApi('ipfs.infura.io', '5001', { protocol: 'https' })
    ipfs.files.add(SelectedFile, { progress: (prog) => $("#uploadedPerc").html("Uploaded " + prog + " of " + SelectedFile[0].filesize + " bytes") })
        .then((response) => {
            console.log(response)
            ipfsIdPdf = response[0].hash
            console.log(ipfsIdPdf)
            $("#pdfLink").html("https://ipfs.infura.io/ipfs/" + ipfsIdPdf)
            $("#pdfLink").attr("href", "https://ipfs.infura.io/ipfs/" + ipfsIdPdf)
            $("#uploadButtons").hide();
            $("#metadataForm").show();
        }).catch((err) => {
            console.error(err)
        })
}

var ipfsIdMeta
var articleTitle
var articleAuthors

function makeArticleHtml() {
    articleTitle = $("#metaTitle").val();
    articleAuthors = $("#metaAuthors").val();
    var html = htmlHeader;
    html += "<h1>" + $("#metaTitle").val() + "</h1>";
    html += "<h3>" + $("#metaAuthors").val() + "</h3>";
    html += "<h3>" + $("#metaAffiliations").val() + "</h3>";
    html += "<p>Abstract:</p>";
    html += "<p><b>" + $("#metaAbstract").val() + "</b></p>";
    html += "<p>Tags:</p>";
    html += "<p><b>" + $("#metaTags").val() + "</b></p>";
    html += "<p>IPFS hash:</p>";
    html += "<p><b>" + ipfsIdPdf + "</b> ";
    html += "<a href=" + "https://ipfs.infura.io/ipfs/" + ipfsIdPdf + ">Open/Download pdf</a></p>";
    //   html += '<embed src="https://drive.google.com/viewerng/viewer?embedded=true&url=' + "https://ipfs.infura.io/ipfs/" + ipfsId + '" width="' + window.innerWidth + '" height="'+window.innerHeight+'">'
    html += htmlFooter;
    return html;
}


function submitMeta() {
    htmlBuffer = window.IpfsApi().Buffer.from(makeArticleHtml(), 'utf8');
    var ipfs = window.IpfsApi('ipfs.infura.io', '5001', { protocol: 'https' })
    ipfs.files.add(htmlBuffer)
        .then((response) => {
            console.log(response)
            ipfsIdMeta = response[0].hash
            console.log(ipfsIdMeta)
            $("#articleLink").html("https://ipfs.infura.io/ipfs/" + ipfsIdMeta)
            $("#articleLink").attr("href", "https://ipfs.infura.io/ipfs/" + ipfsIdMeta)
            $("#metadataButtons").hide();
            $("#submitArticleForm").show();
            $('#coinbaseAddress').html("Checking web3 accounts...")
            setInterval(function () {
                if (web3.eth.accounts.length != 0) {
                    web3.version.getNetwork((err, netId) => {
                        networkName = networkIdToName(netId)
                        $('#coinbaseAddress').html("Registering with: " + web3.eth.coinbase + " <b><i>" + networkName + "</i></b>");
                        $('#registerButton').show();
                    })
                }
                else {
                    $('#coinbaseAddress').html('Please unlock your web3 account');
                    $('#registerButton').hide();
                }
            }, 250)

        }).catch((err) => {
            console.error(err)
        })
}

function previewMeta() {
    var win = window.open("", "Preview", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=750,height=700");
    win.document.body.innerHTML = makeArticleHtml();
}

function registerArticle() {
    var meta = ipfsIdMeta;
    var pdf = ipfsIdPdf;
    var ArticleContract = web3.eth.contract(articleAbi);

    articleAPI.deployArticle(articleTitle, articleAuthors, meta, pdf).then(contract => {
        disableFields(contract.transactionHash);

        web3.eth.getTransactionReceiptMined(contract.transactionHash).then(function (receipt) {
            enableFields(receipt.contractAddress);

            if (receipt.status == 1)
                console.log('Transaction mined successfully.')
            else
                console.log('Transaction mined, but failed.')
        });
    }).catch(error => {
        throw new Error('Error registering article: ' + error);
    })
}

function disableFields(_transactionHash) {
    $("#spinner-wrapper").show();
    //$('#loadingThing').show();
    $("#submitArticleForm").hide();
    $("#transactionInfo").show();
    $("#transactionHash").html("TX Hash: " + _transactionHash);
}

function enableFields(_contractAddress) {
    $("#spinner-wrapper").hide();
    $("#transactionHash").html('Contract mined! Article address: <b>' + _contractAddress + '</b><br>Save this address')
    //$('#loadingThing').hide();
    $("#transactionInfo").hide();
}

var htmlHeader = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Distributed Article</title>
    <style>
        * {
            font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif
        }
        body {
            max-width: 60%;
            padding-top: 10px;
            padding-right: 20%;
            padding-left: 20%;
            color: #000F55;
        }
        p {
            font-size: 16px;
        }
        a {
            font-size: 16px;
        }
        li {
            font-size: 16px;
        }
</style>
</head>
<body>
`;

var htmlFooter = `</body></html>`;