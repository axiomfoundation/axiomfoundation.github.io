const genericAPI = function() {
    this.Contract = undefined;
    this.contractFields = undefined;
    this.contractBytecode = undefined;
    this.contractABI = undefined;
    this.deploymentGas = undefined;

    this.setContract = function(_contractABI, _contractByteCode) {
        this.contractABI = _contractABI;
        this.Contract = web3.eth.contract(_contractABI);
        this.contractBytecode = _contractByteCode;
    }

    this.setContractFields = function(_contractFields) {
        this.contractFields = _contractFields;
    }
    
    this.setDeploymentGas = function(_gas) {
        this.deploymentGas = _gas;
    }

    /*
    Promise: Calls contract method by specified name with zero
    or more arguments.
    */
    this.invokeMethod = function(methodName, ...args) { 
        return this.invokeMethodOn(this.Contract, methodName, ...args);
    }

    /*
    Promise: Calls specified method on PROVIDED contract instance with zero
    or more arguments.
    */
    this.invokeMethodOn = function(contractInstance, methodName, ...args) { 
        let self = this;
        return new Promise((resolve, reject) => {
            contractInstance[methodName](...args, (error, result) => {
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

    /*
    Promise: Deploys contract with specified arguments.
    */
    this.deploy = function(...args) {
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
    this.at = function (contractAddress) {
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
    this.getPrimitiveFields = function(contractAddress, ...fieldsToRetrieve) {
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
                contractObject.contractInstance = contractInstance;

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
    Promise: Takes contract address and /array/ field name as input and returns an
    array containing field values. IMPORTANT: getter must be defined in the 
    contract as get{FieldName} and VIEW modifier.
    */
    this.getArrayField = function(contractAddress, field) {
        return new Promise((resolve, reject) => {
            this.at(contractAddress).then(contractInstance => {
                let getterMethodName = 'get' + field.charAt(0).toUpperCase() + field.slice(1);
                contractInstance[getterMethodName]((error, result) => {
                    if (error) {
                        reject(new Error('Error retrieving array field at ' + contractAddress + ' :' + error));
                        return;
                    }

                    resolve(result);
                })
            })
        })                
    }


    /*
    Promise: Takes contract address and /array/ field names as input and returns an
    object containing arrays.
    */
    this.getArrayFields = function(contractAddress, ...fieldsToRetrieve) {
        let self = this;
        let contractObject = {};

        return new Promise((resolve, reject) => {
            self.Contract.at(contractAddress, function(error, contractInstance) {
                if (error) {
                    reject(new Error('Error retrieving contract at address ' + error));
                    return;
                }

                contractObject.address = contractAddress;
                contractObject.contractInstance = contractInstance;

                let promises = [];

                for (let i = 0; i < fieldsToRetrieve.length; i++) {
                    let field = fieldsToRetrieve[i];

                    promises.push(self.getArrayField(contractAddress, field).then(result => {
                        contractObject[field] = result;
                    }));
                }

                Promise.all(promises).then(values => {
                    resolve(contractObject);
                }).catch(error => {
                    reject(new Error('Error building object from array fields of contract at address: ' + contractAddress + ' :' + error));
                })
            })
        })
    }
}
