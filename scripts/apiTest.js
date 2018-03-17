journalAPI.getPrimitiveFields('0xf044deb5de6a164d389998be111a866ec2c32d1e', 'title', 'publicationCost').then(result => {
    console.log(result);
});

articleAPI.getPrimitiveFields('0xc0f0f7b06cd27c203df04c5b4694a2d7400415b0', 'title', 'authors', 'pdf', 'meta').then(result => {
    console.log(result);
})

openArticleAPI.getPrimitiveFields('0xb25832c5a39933eced914f188e69681ee9590cb4', 'getVersions', 'getAuthors').then(result => {
    console.log(result);
})