const genericAPI = {
    Contract: undefined,
    contractFields: undefined,
    contractBytecode: undefined,
    contractABI: undefined,
    deploymentGas: undefined
}

genericAPI.setContract = function(_contractABI, _contractByteCode, _contractFields, _deploymentGasCost) {
    this.contractABI = _contractABI;
    this.Contract = web3.eth.contract(_contractABI);
    this.contractBytecode = _contractByteCode;
}

genericAPI.setContractFields = function(_contractFields) {
    this.contractFields = _contractFields;
}

genericAPI.setDeploymentGas = function(_gas) {
    this.deploymentGas = _gas;
}

/*
Promise: Calls contract method by specified name with zero
or more arguments.
*/
genericAPI.invokeMethod = function(methodName, ...args) { 
    let self = this;
    return new Promise((resolve, reject) => {
        self.Contract[methodName](...args, (error, result) => {
            if (error) {
                reject(new Error('Error invoking ' + methodName + ': ' + error));
                return;
            }

            if (!result.transactionHash) {
                resolve(result);
                return;
            }

            web3.eth.getTransactionReceiptMined(result.transactionHash).then(receipt => {
                if (receipt.status === 0) {
                    reject(new Error('Transaction mined, but failed.'))
                    return;
                }

                resolve(receipt);
            })
        })
    })
}

genericAPI.deploy = function(...args) {
    console.log('evo ga u deploy: ' + this.deploymentGas)

    let deploymentOptions = {
        from: web3.eth.coinbase,
        gas: this.deploymentGas   
    }

    return this.invokeMethod('new', ...args, deploymentOptions);
}

/*
Promise: Takes contract address as input and retrieves contract instance.
*/
genericAPI.at = function (contractAddress) {
    return new Promise((resolve, reject) => {
        this.invokeMethod('at', contractAddress, (error, result) => {
            if (error) {
                reject(new Error('Error retrieving contract instance at address: ' + contractAddress + ': ' + error));
                return;
            }
    
            resolve(result);
        })
    })
}

/*
Promise: Takes contract address and contract field names as input and builds an
object containing speficied fields. If no fields are specified as the
second parameter, returns all contract fields.
*/
genericAPI.createObjectFromContractAt = function(contractAddress, ...fieldsToRetrieve) {
    let contractObject = {};
    let fields = fieldsToRetrieve.length == 0 ? this.contractFields : fieldsToRetrieve;
    
    return new Promise((resolve, reject) => {
        articleAPI.Contract.at(contractAddress, function (error, contractInstance) {
            if (error) {
                reject(new Error('Error at retrieving article at address ' + error));
                return;
            }

            contractObject.address = contractAddress;

            let promises = [];

            for (let i = 0; i < fields.length; i++) {
                let field = fields[i];

                promises.push(new Promise((resolve, reject) => {
                    contractInstance[field]((error, result) => {
                        contractObject[field] = result;
                        resolve(result);
                    })
                }));
            }

            Promise.all(promises).then(values => {
                resolve(contractObject);
            }).catch(error => {
                reject(new Error('Error building object from contract at address: ' + contractAddress + ' :' + error));
            })
        })
    })
}