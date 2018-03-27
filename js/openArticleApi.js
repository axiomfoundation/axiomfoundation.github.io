const openArticleAPI = new genericAPI();
openArticleAPI.setContract(openarticleABI, openarticleByteCode);
openArticleAPI.setDeploymentGas(600000); 
openArticleAPI.setContractFields([]);

const emptyVersion = function() {
    this.ipfsHash = undefined;
    this.reviews = [];
    this.additionalData = [];
    this.entryData = [];
}

/*
Promise: Retrieves information shared by all versions of the article.
VERSIONS, AUTHORS AND COMMENTS
*/
openArticleAPI.getGlobalData = function(articleAddress) {
    return openArticleAPI.getArrayFields(articleAddress, 'versions', 'authors', 'comments');
}

openArticleAPI.getVersion = function (articleAddress, versionHash) {
    return new Promise((resolve, reject) => {
        let version = new emptyVersion();
        version.ipfsHash = versionHash;
        let promises = [];

        openArticleAPI.at(articleAddress).then(articleInstance => {
            let reviewsPromise = openArticleAPI.invokeMethodOn(articleInstance, 'getReviews', versionHash).then(result => {
                version.reviews = result;
            })
    
            let additionalDataPromise = openArticleAPI.invokeMethodOn(articleInstance, 'getAdditionalData', versionHash).then(result => {
                version.additionalData = result;
            })
    
            let entryDataPromise = openArticleAPI.invokeMethodOn(articleInstance, 'getEntryData', versionHash).then(result => {
                version.entryData = result;
            })
    
            promises = [reviewsPromise, additionalDataPromise, entryDataPromise];
    
            Promise.all(promises).then(results => {
                resolve(version);
            }).catch(error => {
                reject(new Error('Error retrieving version ' + error));
            })
        });
    })
}

/*
Promise: Returns an object containing all article data.
Global
*/
openArticleAPI.getArticle = function(articleAddress) {
    let article = {
        address: articleAddress,
        versions: [],
        authors: undefined,
        comments: undefined
    };

    return new Promise((resolve, reject) => {
        openArticleAPI.getGlobalData(articleAddress).then(result => {
            article.address = articleAddress;
            article.authors = result.authors;
            article.comments = result.comments;

            let promises = [];
                        
            for(let i = 0; i < result.versions.length; i++) {
                let promise = openArticleAPI.getVersion(articleAddress, result.versions[i]).then(result => {
                    article.versions.push(result);
                });

                promises.push(promise);
            }

            Promise.all(promises).then(results => {
                resolve(article);
            }).catch(error => {
                reject(error);
            })
        })
    })
}

openArticleAPI.sortVersionsByTimestamp = function(versions) {

}