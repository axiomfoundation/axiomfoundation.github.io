var articleAPI = {
    ArticleContract: web3.eth.contract(articleAbi)
}

articleAPI.articleAt = function(articleAddress) {
    return new Promise((resolve, reject) => {
        articleAPI.ArticleContract.at(articleAddress, function (error, articleInstance) {
            if (error) {
                reject(new Error('Error at retrieving article at address ' + error));
                return;
            }

            resolve(articleInstance)
        })
    })
}

articleAPI.createObjectFromArticleAt = function(articleAddress) {
    let article = {};
    let articleFields = ['meta', 'title', 'authors', 'pdf', 'timestamp'];

    return new Promise((resolve, reject) => {
        articleAPI.ArticleContract.at(articleAddress, function (error, articleInstance) {
            if (error) {
                reject(new Error('Error at retrieving article at address ' + error));
                return;
            }

            article.articleAddress = articleAddress;

            let promises = [];

            for (let i = 0; i < articleFields.length; i++) {
                let field = articleFields[i];

                promises.push(new Promise((resolve, reject) => {
                    articleInstance[field]((error, result) => {
                        article[field] = result;
                        resolve(result);
                    })
                }));
            }

            Promise.all(promises).then(values => {
                resolve(article);
            }).catch(error => {
                reject(new Error('Error retrieving article ' + error));
            })
        })
    })
}

articleAPI.deployArticle = function(title, authors, meta, pdf) {
    return new Promise((resolve, reject) => {
        articleAPI.ArticleContract.new(
            meta,
            pdf,
            title,
            authors,
            {
                gas: '1000000',
                from: web3.eth.accounts[0],
                data: articleBytecode,
            }, function (error, contract) {
                if (error) {
                    reject(new Error('Failed registering article: ' + error));
                    return;
                }

                resolve(contract);
            })
    })
}