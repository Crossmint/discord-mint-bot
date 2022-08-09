// Require the slash command builder
require('dotenv').config();
const { SlashCommandBuilder } = require('@discordjs/builders');
const CrossMint = require("../../crossmint/mint.js");
const Web3 = require('web3');
const DiscordHelper = require("../util/helpers.js")

// Export module for our command
module.exports = {
  data: new SlashCommandBuilder() // command details
    .setName('mint')
    .setDescription('>>>  Mint an NFT using CrossMint Minting API')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title of the NFT')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Description of the NFT')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('method')
        .setDescription('How are we delivering this NFT?')
        .setRequired(true)
        .addChoices(
          { name: 'E-mail', value: 'email' },
          { name: 'Web3 Wallet', value: 'web3' },
        ))
    .addStringOption(option =>
      option.setName('network')
        .setDescription('Which network do we use? Note, we only have one network for now.')
        .setRequired(true)
        .addChoices(
          { name: 'Polygon (Mumbai)', value: 'poly' } // based on shorthand in the API docs
          // https://docs.crossmint.io/mint-nfts/nft-minting-api/recipients#abbreviations
        ))
    .addStringOption(option =>
      option.setName('recipient')
        .setDescription('Your recipients address')
        .setRequired(true))
    .addAttachmentOption((option) => option
      .setRequired(true)
      .setName("image")
      .setDescription("Image you would like to convert into an NFT")),

  async execute(interaction) { // command functions
    /* flow:
    - let user know we are processing request
    - create object of parsed data
    - validate some parsed data
    - send data over to minting api, remember we are not adding traits or any of that. if all is well save the id
    - let the user know we are minting
    - check for successful transaction
    - when success is found, alert the user with all relevant info

    This is a great place to add database integrations to track all of your interactions. We suggest Firestore
    */
    
    
    try {
      await interaction.reply({ content: `Please wait, processing your request.`, ephemeral: true });
      // read inputs, parse them into our data object
      const nft_data = {
        discord_userid: interaction.user.id,
        nft_name: interaction.options.get("title").value,
        nft_description: interaction.options.get("description").value,
        nft_image: interaction.options.get("image").attachment.url,
        nft_deliveryMethod: interaction.options.get("method").value,
        nft_network: interaction.options.get("network").value,
        nft_recipient: interaction.options.get("recipient").value
      }

      // validate some inputs, leaving this open for now in the event other options pop up in the future
      // This could be cleaner but it certainly helps the user understand where their error is
      var validEmailRegex = RegExp('[a-z0-9]+@[a-z]+\.[a-z]{2,3}');
      if (nft_data.nft_deliveryMethod == "email") {
        if (!validEmailRegex.test(nft_data.nft_recipient)) {
          await interaction.followUp({ content: `You selected email as the delivery option. ${nft_data.nft_recipient} is not a valid email.`, ephemeral: true });
          return;
        } 
      }
      else {
        if (!Web3.utils.isAddress(nft_data.nft_recipient)) {
          await interaction.followUp({ content: `You selected web3 as the delivery option. ${nft_data.nft_recipient} is not a valid web3 wallet.`, ephemeral: true });
          return;
        }
      }

        // mint the nft, give the user relevant info
        const mint_data = await CrossMint.mint(nft_data);
        if (mint_data.error){
          await interaction.followUp({ content: `Our API is having some issues. Unable to finish this request.`, ephemeral: true });
          console.log(`[crossmint] * api error: ${mint_data.message}`)
          return;
        }

        // save additional information
        nft_data.crossmintid = mint_data.id;
        nft_data.contractAddress = mint_data.onChain.contractAddress;

        // let user know we are working on it
        await interaction.followUp({ content: `NFT minting in progress... I'll send you a message once it completes. This process will take anywhere from a few seconds to a few minutes depending on network speeds.\n**CrossMint Request ID: ${mint_data.id}**`, ephemeral: true });
        
        // check for a successful mint, alert the user. TODO: add a failure check
        let mint_status = await CrossMint.checkStatus(nft_data.crossmintid);
        while (mint_status.onChain.status != "success") {
          if(mint_status.error){
            await interaction.followUp({ content: `Error minting the NFT.`, ephemeral: true });
            return false;
          }
          await new Promise(r => setTimeout(r, 5000)); // 5 seconds
          mint_status = await CrossMint.checkStatus(nft_data.crossmintid);
        }

        // show user the results
        let embed = await DiscordHelper.createMintedEmbed(nft_data.crossmintid);
        await interaction.followUp({ embeds: [embed], ephemeral: true });
        console.log(`[discord] (/) successful mint (id: ${nft_data.crossmintid}) ${interaction.user.tag} | ${interaction.user.id}`);
      }
    catch (e) {
      console.log(`[discord] * (/) error processing mint command. ${e}`)
    }
  },
};