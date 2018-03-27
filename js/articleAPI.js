var articleAPI = new genericAPI();
articleAPI.setContract(articleAbi, articleBytecode);
articleAPI.setDeploymentGas(1400000);
articleAPI.setContractFields(['meta', 'title', 'authors', 'pdf', 'timestamp']);