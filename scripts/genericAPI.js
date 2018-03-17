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
    let deploymentOptions = {
        from: web3.eth.coinbase,
        gas: this.deploymentGas   
    }

    return this.invokeMethod('new', ...args, deploymentOptions);
}

/*
Promise: Takes contract address as input and retrieves contract instance.
Just a wrapper for invokeMethod('at', contractAddress), possibly redundant.
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
object containing speficied *primitive-non array* fields. If no fields are specified as the
second parameter, returns all primitive contract fields.
*/
genericAPI.getPrimitiveFields = function(contractAddress, ...fieldsToRetrieve) {
    let self = this;
    let contractObject = {};
    let fields = fieldsToRetrieve.length == 0 ? this.contractFields : fieldsToRetrieve;
    
    return new Promise((resolve, reject) => {
        self.Contract.at(contractAddress, function (error, contractInstance) {
            if (error) {
                reject(new Error('Error retrieving contract at address ' + error));
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

/*
Promise: Takes contract address and contract field name as input and returns an
array containing all field elements.
*/

/* WORK IN PROGRESS
genericAPI.getFieldElements = function(contractAddress, fieldName) {
    let elements = [];
    let promises = [];

    this.at(contractAddress).then(contractInstance => {

        contractInstance.invokeMethod = genericAPI.invokeMethod;
        let nullElement = undefined;

        for (let i = 0; !nullElement; i++) {
            if (nullElement)
                return;
            let promise = new Promise((resolve, reject) => {
                contractInstance[fieldName](i, (error, result) => {
                    if (error) {
                        reject('Error retrieving element ' + i + ': ' + error);
                        return;
                    }

                    if (result.length !== 42) {
                        nullElement = true;
                        console.log('da');
                    } else {
                        elements.push(result);
                        console.log(elements);
                    }
                })
            })

            promises.push(promise);
        }

        Promise.all(promises)
    })
}
*/