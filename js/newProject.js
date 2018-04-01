var projectMetadata;

/*************************************************** */
/** Stage 1 - create initial meta-data */
function makeArticleHtml(json) {
    var html = "";
    html += "<h1>" + json.Title + "</h1>";
    html += "<h3>" + json.Authors + "</h3>";
    html += "<h3>" + json.Affiliations + "</h3>";
    html += "<p>Abstract:</p>";
    html += "<p><b>" + json.Abstract + "</b></p>";
    html += "<p>Tags:</p>";
    html += "<p><b>" + json.Tags  + "</b></p>";
    return html;
}

function makeArticleJson() {
    var json = {}
    json.Title = $("#metaTitle").val()
    json.Authors = $("#metaAuthors").val()
    json.Affiliations = $("#metaAffiliations").val()
    json.Abstract = $("#metaAbstract").val()
    json.Tags = $("#metaTags").val()
    return json;
}


function confirmMeta() {
    projectMetadata = makeArticleJson()
    $("#metaForm").html(makeArticleHtml(projectMetadata))
    $("#submitMeta").show()
}

function submitMeta() {
    $("#submitMeta").hide()
    $("#uploadData").show()
}
/*************************************************** */

/*************************************************** */
/** Stage 2 - upload files */
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
           // filesize: bytes.length
        })
    }, false);
    if (file) {
        reader.readAsArrayBuffer(input.files[0]);
    }
};

function submitArticle() {
    var ipfs = window.IpfsApi('ipfs.infura.io', '5001', { protocol: 'https' })
    ipfs.files.add(SelectedFile, 
        {progress: (prog) => 
            $("#uploadedPerc").html("Uploaded " + prog + " of " + SelectedFile[0].filesize + " bytes") })
        .then((response) => {
            projectMetadata.ArticleSource = response[0].hash
        }).catch((err) => {
            console.error(err)
        })
}
/*************************************************** */