var networkName;
var journalInstance;
var scienceTokenInstance;

var staff = [];
var staffCount;

window.onload = function () {
    if (typeof web3 === 'undefined') {
        $('#meta-mask-required').html("You will need <a href='https://metamask.io/'>MetaMask</a> browser plugin or local web3 instance to see this website");
    }
    else {
        if (web3.eth.accounts.length != 0) {
            web3.version.getNetwork((err, netId) => {
                networkName = networkIdToName(netId);
                $('#coinbaseAddress').html('Logged in as: ' + web3.eth.coinbase + ' <b><i>' + networkName + '</i></b>');
                populateHtmlElements();
            })
        } else {
            $('#coinbaseAddress').html('Please unlock your web3 account');
        }
    }
}

function populateHtmlElements() {
    journalAddress = window.location.href.split('#')[1];
    $('#journalAddress').html('Journal Address: ' + journalAddress);

    var journalContract = web3.eth.contract(journalAbi);
    journalContract.at(journalAddress, function (error, result) {
        journalInstance = result;

        var initTokenInstance = new Promise((resolve, reject) => {
            var ScienceTokenContract = web3.eth.contract(ERC20Abi);
            ScienceTokenContract.at(tokenAddress, function (error, tokenInstance) {
                if (error) {
                    reject('Failed initializing token contract: ' + error);
                    return
                }
                scienceTokenInstance = tokenInstance;
                resolve('Token instance initialized.');
            })
        }).then(() => {
            journalAddress = window.location.href.split('#')[1];
            $('#journalAddress').html('Journal Address: ' + journalAddress);
            var journalContract = web3.eth.contract(journalAbi);
            journalContract.at(journalAddress, function (error, result) {
                journalInstance = result;

                journalInstance.title(function (error, result) {
                    $('#journalTitle').html(result);
                })

                journalInstance.publicationCost(function (error, result) {
                    $('#setPublicationCostField').val(result / 1e18);
                })

                journalInstance.description(function (error, result) {
                    $('#setDescriptionField').val(result);
                })

                journalInstance.isOwner(web3.eth.coinbase, function (error, _isOwner) {
                    if (_isOwner) {
                        $('#update-area').show();
                        $('#editJournalAlert').html('');
                    } else {
                        $('#editJournalAlert').html('Editing only allowed to journal owners. Please switch to correct account.<br><br>');
                        $('#update-area').hide();
                    }
                })
                getStaff();
            })
        })
    })
}

function addressExistsInArray(address, userArray) {
    for (let i = 0; i < userArray.length; i++) {
        if (address === userArray[i].address) {
            return i;
        }
    }
    return null;
}

function isOwner(staffMember) {
    return new Promise((resolve, reject) => {
        journalInstance.isOwner(staffMember.address, (error, result) => {
            if (error) {
                reject('Error on isOwner: ' + error);
                return;
            }
            staffMember.isOwner = result ? true : false;
            resolve('isOwner completed.');
        })
    })
}

function isEditor(staffMember) {
    return new Promise((resolve, reject) => {
        journalInstance.isEditor(staffMember.address, (error, result) => {
            if (error) {
                reject('Error on isEditor: ' + error);
                return
            }
            staffMember.isEditor = result ? true : false;
            resolve('isEditor completed.');
        })
    })
}

function isReviewer(staffMember) {
    return new Promise((resolve, reject) => {
        journalInstance.isReviewer(staffMember.address, (error, result) => {
            if (error) {
                reject('Error on isReviewer: ' + error);
                return;
            }
            staffMember.isReviewer = result ? true : false;
            resolve('isReviewer completed.');
        })
    })
}

function getAllowanceFrom(staffMember) {
    return new Promise((resolve, reject) => {
        scienceTokenInstance.allowance(journalInstance.address, staffMember.address, (error, result) => {
            if (error) {
                reject('Error retrieving allowance: ' + error);
                return;
            }
            staffMember.allowance = result.c[0] / 1e4;
            resolve('Retrieving allowance completed. Allowance: ' + staffMember.allowance);
        })
    })
}

function getStaffMember(i, staffMember) {
    return new Promise((resolve, reject) => {
        let staffMember = {};
        let promises = [];

        journalInstance.staff(i, (error, result) => {
            if (error) {
                reject('Error retrieving staff member ' + i + ' ' + error);
                return;
            }

            staffMember.address = result;

            let isOwnerPromise = isOwner(staffMember);
            let isEditorPromise = isEditor(staffMember);
            let isReviewerPromise = isReviewer(staffMember);
            let allowancePromise = getAllowanceFrom(staffMember);

            promises.push(isOwnerPromise);
            promises.push(isEditorPromise);
            promises.push(isReviewerPromise);
            promises.push(allowancePromise);

            Promise.all(promises).then((result) => {
                staff.push(staffMember);
                resolve('Successfully retrieved staff member ' + i);
            }).catch((error) => {
                reject('Error retrieving staff member ' + i + ' ' + error);
            })
        })
    })
}

function getStaff() {
    disableFields();
    staffRetrieved = false;
    staff = [];
    var promises = [];

    new Promise((resolve, reject) => {
        journalInstance.staffCount((error, result) => {
            if (error) {
                reject('Error retrieving staffCount: ' + error);
                return;
            }

            staffCount = result;
            for (let i = 0; i < staffCount; i++) {
                let staffMember = {};
                promises.push(getStaffMember(i, staffMember));
            }

            Promise.all(promises).then((result) => {
                console.log('Successfully retrieved all staff members.');
                enableFields();
                staffRetrieved = true;
                console.log(staff);
            }).catch((error) => {
                console.error('Error retrieving staff members: ' + e);
            }).then(() => {
                enableFields();
                createStaffTable();
            })
        })
    })
}

function createStaffTable() {
    let table = $('#staff-table');
    table.html('');
    addRowToUsersTable(tableHeader);

    for (let i = 0; i < staff.length; i++) {
        let row = createTableRow(staff[i]);
        addRowToUsersTable(row);
    }
}

const tableHeader = `<tr>
                        <th>address</th>
                        <th>isOwner</th> 
                        <th>isEditor</th>
                        <th>isReviewer</th>
                        <th>allowance</th>
                        <th></th>
                    </tr>`

function addRowToUsersTable(rowData) {
    let table = $('#staff-table');
    table.append(rowData);
}

function createTableRow(staffMember) {
    let row = '';
    row += '<tr id=row-' + staffMember.address + '>';
    row += '<td>' + staffMember.address + '</td>';
    row += '<td align=center>' + (staffMember.isOwner ? '✓' : 'x') + '</td>';
    row += '<td align=center>' + (staffMember.isEditor ? '✓' : 'x') + '</td>';
    row += '<td align=center>' + (staffMember.isReviewer ? '✓' : 'x') + '</td>';
    row += '<td align=center>' + staffMember.allowance + '</td>';
    row += '<td align=center><a onClick="removeStaffMember(\'' + staffMember.address + '\')"><font color="red" style="cursor: pointer">x</font></a></td>';
    row += '</tr>';
    return row;
}

function setPublicationCost() {
    var newCost = $('#setPublicationCostField').val() * 1e18;
    journalInstance.setPublicationCost(newCost, { from: web3.eth.coinbase, gas: 49000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setPublicationCost');
    })
}

function stringToBool(val) {
    if (val === 'true')
        return true;
    else if (val === 'false')
        return false;
    else
        return undefined;
}

function setOwner() {
    const newOwnerAddress = $('#setOwnerField').val();
    let isOwner = $('#setOwnerBool').val();
    isOwner = stringToBool(isOwner);

    if (typeof isOwner !== 'boolean') {
        console.error('Incorrect boolean input!');
        return;
    }

    let existsAtIndex = addressExistsInArray(newOwnerAddress, staff) 
    if (existsAtIndex) {
        if (staff[existsAtIndex].isOwner === isOwner) {
            alert('This value already set!');
            return;
        }
    }

    journalInstance.setOwner(newOwnerAddress, isOwner, { from: web3.eth.coinbase, gas: 320000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setOwner');
    })
}

function setEditor() {
    const newEditorAddress = $('#setEditorField').val();
    let isEditor = $('#setEditorBool').val();
    isEditor = stringToBool(isEditor);

    if (typeof isEditor !== 'boolean') {
        console.error('Incorrect boolean input!');
        return;
    }

    let existsAtIndex = addressExistsInArray(newEditorAddress, staff)
    if (existsAtIndex) {
        if (staff[existsAtIndex].isEditor === isEditor) {
            alert('This value already set!');
            return;
        }
    }    

    journalInstance.setEditor(newEditorAddress, isEditor, { from: web3.eth.coinbase, gas: 320000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setEditor');
    })
}

function setReviewer() {
    const newReviewerAddress = $('#setReviewerField').val();
    let isReviewer = $('#setReviewerBool').val();
    isReviewer = stringToBool(isReviewer);

    if (typeof isReviewer !== 'boolean') {
        console.error('Incorrect boolean input!');
        return;
    }

    let existsAtIndex = addressExistsInArray(newReviewerAddress, staff);
    if (existsAtIndex) {
        if (staff[existsAtIndex].isReviewer === isReviewer) {
            alert('This value already set!');
            return;
        }
    }

    journalInstance.setReviewer(newReviewerAddress, isReviewer, { from: web3.eth.coinbase, gas: 320000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setReviewer');
    })
}

function setDescription() {
    const newDescription = $('#setDescriptionField').val();

    journalInstance.setDescription(newDescription, { from: web3.eth.coinbase, gas: 4320000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setDescription');
    })
}

function setAllowance() {
    const allowanceReceiver = $('#setAllowanceField').val();
    let allowanceAmount = parseFloat($('#setAllowanceAmount').val()) * 1e18;

    journalInstance.setAllowance(allowanceReceiver, allowanceAmount, { from: web3.eth.coinbase, gas: 450000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'setAllowance');
    })
}

function removeStaffMember(address) {
    let numberOfOwners = 0;
    let atIndex = addressExistsInArray(address, staff);

    for (let i = 0; i < staff.length; i++) {
        if (staff[i].isOwner)
            numberOfOwners++;
    }

    if (address === web3.eth.coinbase) {
        alert('WARNING: You are about to remove YOURSELF as the journal owner and lose ability to edit this journal from this account!');
    }

    if (numberOfOwners == 1 && staff[atIndex].isOwner) {
        alert('WARNING: You are about to remove the only journal owner and permanently lose ability to edit this journal!');
    }

    journalInstance.removeStaff(address, { from: web3.eth.coinbase, gas: 220000 }, (error, txHash) => {
        handleTransactionReceipt(error, txHash, 'removeStaffMember');
    })
}

function handleTransactionReceipt(error, txHash, methodName) {
    if (error) {
        throw new Error('Failed to execute ' + methodName + ': ' + error);
    } else {
        disableFields();

        web3.eth.getTransactionReceiptMined(txHash).then(function (receipt) {
            enableFields();

            
            if (methodName != 'Description' && methodName != 'PublicationCost') {
                getStaff();
            }
        })
    }
}

function disableFields() {
    $('#spinner-wrapper').show();
    document.getElementById('spinner-wrapper').scrollIntoView(true);

    $('#setPublicationCostButton').attr('disabled', true);
    $('#setPublicationCostField').attr('disabled', true);

    $('#setOwnerField').attr('disabled', true);
    $('#setOwnerButton').attr('disabled', true);
    $('#setOwnerBool').attr('disabled', true);

    $('#setEditorField').attr('disabled', true);
    $('#setEditorButton').attr('disabled', true);
    $('#setEditorBool').attr('disabled', true);

    $('#setReviewerField').attr('disabled', true);
    $('#setReviewerButton').attr('disabled', true);
    $('#setReviewerBool').attr('disabled', true);

    $('#setDescriptionField').attr('disabled', true);
    $('#setDescriptionButton').attr('disabled', true);

    $('#setAllowanceField').attr('disabled', true);
    $('#setAllowanceAmount').attr('disabled', true);
    $('#setAllowanceButton').attr('disabled', true);
}

function enableFields() {
    $('#spinner-wrapper').hide();
    $('#setPublicationCostButton').attr('disabled', false);
    $('#setPublicationCostField').attr('disabled', false);

    $('#setOwnerField').attr('disabled', false);
    $('#setOwnerButton').attr('disabled', false);
    $('#setOwnerBool').attr('disabled', false);

    $('#setEditorField').attr('disabled', false);
    $('#setEditorButton').attr('disabled', false);
    $('#setEditorBool').attr('disabled', false);

    $('#setReviewerField').attr('disabled', false);
    $('#setReviewerButton').attr('disabled', false);
    $('#setReviewerBool').attr('disabled', false);

    $('#setDescriptionField').attr('disabled', false);
    $('#setDescriptionButton').attr('disabled', false);

    $('#setAllowanceField').attr('disabled', false);
    $('#setAllowanceAmount').attr('disabled', false);
    $('#setAllowanceButton').attr('disabled', false);
}