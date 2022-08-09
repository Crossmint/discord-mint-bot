require('dotenv').config();
const fetch = require("node-fetch");
const { Headers } = fetch;

// secret sauce 

// == Mints an NFT with given parameters using CrossMint API ==
async function mint(data){
    const reqHeader = new Headers();
    reqHeader.append("x-client-secret", process.env.CrossMintAPIKey);
    reqHeader.append("x-project-id", process.env.CrossMintProjectID);
    reqHeader.append("Content-Type", "application/json");

    // handle email vs web3 wallet. 
    // should make a function to *cleanly* handle parsing this on both mint command and here - due to time issues this was not done.
    var recipient;
    if(data.nft_deliveryMethod == 'email'){
        recipient = data.nft_deliveryMethod+":"+data.nft_recipient+":"+data.nft_network;
    }
    else {
        recipient = data.nft_network+":"+data.nft_recipient
    }

    const reqBody = JSON.stringify({
        "mainnet": false,
        "metadata": {
            "name": data.nft_name,
            "image": data.nft_image,
            "description": data.nft_description
        // would love to add optional traits here...
        },
        "recipient": recipient
    });

    var requestOptions = {
        method: 'POST',
        headers: reqHeader,
        body: reqBody,
        redirect: 'follow'
      };

      let mint_result;
      await fetch(process.env.crossmintAPIEndpoint, requestOptions)
        .then(response => response.json())
        .then(result => mint_result = result)
        .catch(error => console.log('error', error));
    return mint_result;
}

// == Checks the status of a mint against CrossMint API ==
async function checkStatus(mintingID){
    const reqHeader = new Headers();
    reqHeader.append("x-client-secret", process.env.CrossMintAPIKey);
    reqHeader.append("x-project-id", process.env.CrossMintProjectID);

    const requestOptions = {
    method: 'GET',
    headers: reqHeader,
    redirect: 'follow'
    };

    let check_result;
    await fetch(`${process.env.crossmintAPIEndpoint}/${mintingID}/status`, requestOptions)
    .then(response => response.json())
    .then(result => check_result = result)
    .catch(error => console.log('error', error));
    return check_result;
}

module.exports = {mint, checkStatus};