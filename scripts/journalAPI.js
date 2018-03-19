var journalAPI = new genericAPI();
journalAPI.setContract(journalAbi, journalBytecode);
journalAPI.setDeploymentGas(600000); 
journalAPI.setContractFields(['title', 'description', 'publicationCost']);