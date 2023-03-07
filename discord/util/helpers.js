require('dotenv').config();
const Discord = require('discord.js');

// some of these could be cleaned up a tad bit nicer.... please make sure for fields you are returning non-empy STRINGS.

// == Create embed for minting information success ==
async function createMintedEmbed(nft_data) {
    try {
        const embed = new Discord.MessageEmbed()
        .setColor(process.env.botEmbedColor)
        .setTitle(`Your NFT was minted!`)
        .setDescription(`CrossMint ID: ${nft_data.crossmintid}\n\n**${nft_data.nft_name}**\n*${nft_data.nft_description}*`)
        .addFields(
            { name: 'Recipient:', value: nft_data.nft_recipient, inline: false  },
            { name: 'Owning Address:', value: nft_data.owner, inline: false },
            { name: 'Network:', value: nft_data.nft_network, inline: true },
            { name: 'Transaction:', value: `[Scanner Link](${getTxURL(nft_data.txId, nft_data.nft_network)})`, inline: true },
            { name: 'OpenSea:', value: `[Viewer Link](${getOpenSeaURL(nft_data.contractAddress, nft_data.tokenId, nft_data.nft_network)})`, inline: true })
        .setThumbnail(nft_data.nft_image)
        .setFooter({ text: `powered by crossmint.io`, iconURL: process.env.botLogo })
        .setTimestamp();
        return embed;
      } catch (e) {
        console.log(e)
      }
    }

// == helps generate a url for embed tx info ==
function getTxURL(txId, network){
    switch(network){
        case "polygon":
            if (process.env.staging){ // are we on testnet? if so, return accordingly.
                return process.env.polygonscan_mumbai + txId;
            }
            else{
                return process.env.polygonscan_mainnet + txId;
            }
        case "solana": // never implemented but you get the gist....
            return process.env.solscan + txId;
        default:
            return `${txId} not found on ${network}`
        }
}

//  == openseaurl generation, super lazy way though. ==
function getOpenSeaURL(contract, tokenid, network){

    switch(network){
        case "polygon":
            if (process.env.staging){
                return "https://testnets.opensea.io/assets/mumbai/" + contract + "/" + tokenid;
            }
            else{
                return "https://opensea.io/assets/matic/" + contract + "/" + tokenid;
            }
        case "solana":
            return "https://opensea.io/collection" + contract + "/" + tokenid;
        default:
            return `${tokenid} not found on ${contract} in ${network}`
        }
}

  module.exports = {createMintedEmbed};