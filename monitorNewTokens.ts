import { rayFee, solanaConnection } from './constants';
import { storeData } from './utils';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import fetch from 'node-fetch';
import { Connection } from '@solana/web3.js';
import { checkScamToken } from './checkScamToken';

const dataPath = path.join(__dirname, 'data', 'new_solana_tokens.json');

async function fetchTokenMetadata(tokenAddress) {
  try {
    const response = await fetch(`https://public-api.solscan.io/token/meta?tokenAddress=${tokenAddress}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error fetching token metadata: ${error}`);
    return null;
  }
}

function checkTokenConditions(tokenMetadata) {
  return {
    isRenounced: tokenMetadata.owner === '0x0000000000000000000000000000000000000000',
    hasVerifiedContract: tokenMetadata.verified,
    hasMental: tokenMetadata.tags.includes('mental'),
    isBurned: tokenMetadata.burned,
    hasPauseTransfer: tokenMetadata.features.includes('pause_transfer'),
    hasTradingCooldown: tokenMetadata.features.includes('trading_cooldown'),
    hasHiddenOwner: tokenMetadata.owner_hidden,
    hasSelfDestruct: tokenMetadata.features.includes('self_destruct'),
    isProxyContract: tokenMetadata.proxy,
    canReturnOwnership: tokenMetadata.features.includes('return_ownership'),
    hasBlacklist: tokenMetadata.features.includes('blacklist'),
    hasTaxModification: tokenMetadata.features.includes('tax_modification'),
    hasExternalCallRisk: tokenMetadata.features.includes('external_call_risk'),
    cannotBuy: tokenMetadata.features.includes('cannot_buy'),
    hasIndividualTaxes: tokenMetadata.features.includes('individual_taxes'),
    hasWhaleProtection: tokenMetadata.features.includes('whale_protection'),
    isModifiableWhaleProtection: tokenMetadata.features.includes('modifiable_whale_protection')
  };
}

async function monitorNewTokens(connection: Connection) {
  console.log(chalk.green('Monitoring new Solana tokens...'));

  try {
    connection.onLogs(
      rayFee,
      async ({ logs, err, signature }) => {
        if (err) {
          console.error(chalk.red(`Connection contains error: ${err}`));
          return;
        }

        console.log(chalk.bgGreen(`Found new token signature: ${signature}`));

        let signer = '';
        let baseAddress = '';
        let baseDecimals = 0;
        let baseLpAmount = 0;
        let quoteAddress = '';
        let quoteDecimals = 0;
        let quoteLpAmount = 0;
        let isBaseTokenScam = false;
        let isQuoteTokenScam = false;

        try {
          const parsedTransaction = await connection.getParsedTransaction(
            signature,
            {
              maxSupportedTransactionVersion: 0,
              commitment: 'confirmed',
            }
          );

          if (parsedTransaction && parsedTransaction.meta.err === null) {
            console.log('Successfully parsed transaction');

            signer =
              parsedTransaction.transaction.message.accountKeys[0].pubkey.toString();

            console.log(`Creator: ${signer}`);

            const postTokenBalances = parsedTransaction.meta.postTokenBalances;

            const baseInfo = postTokenBalances.find(
              (balance) =>
                balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint !== 'So11111111111111111111111111111111111111112'
            );

            if (baseInfo) {
              baseAddress = baseInfo.mint;
              baseDecimals = baseInfo.uiTokenAmount.decimals;
              baseLpAmount = baseInfo.uiTokenAmount.uiAmount;
            }

            const quoteInfo = postTokenBalances.find(
              (balance) =>
                balance.owner === '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1' &&
                balance.mint === 'So11111111111111111111111111111111111111112'
            );

            if (quoteInfo) {
              quoteAddress = quoteInfo.mint;
              quoteDecimals = quoteInfo.uiTokenAmount.decimals;
              quoteLpAmount = quoteInfo.uiTokenAmount.uiAmount;
            }

            const baseTokenMetadata = await fetchTokenMetadata(baseAddress);
            const quoteTokenMetadata = await fetchTokenMetadata(quoteAddress);

            const baseTokenConditions = checkTokenConditions(baseTokenMetadata);
            const quoteTokenConditions = checkTokenConditions(quoteTokenMetadata);
            
            isBaseTokenScam = baseAddress ? await checkScamToken(baseAddress) : true;
            isQuoteTokenScam = quoteAddress ? await checkScamToken(quoteAddress) : true;

            console.log(`Base Token: ${baseTokenMetadata ? baseTokenMetadata.symbol : 'N/A'}`);
            console.log(`Quote Token: ${quoteTokenMetadata ? quoteTokenMetadata.symbol : 'N/A'}`);

            console.log('Base Token Conditions:', baseTokenConditions);
            console.log('Quote Token Conditions:', quoteTokenConditions);
          }

          const newTokenData = {
            lpSignature: signature,
            creator: signer,
            timestamp: new Date().toISOString(),
            baseInfo: {
              baseAddress,
              baseDecimals,
              baseLpAmount,
            },
            quoteInfo: {
              quoteAddress,
              quoteDecimals,
              quoteLpAmount,
            },
            logs,
            isBaseTokenScam,
            isQuoteTokenScam
          };
          // Store new tokens data in data folder
          await storeData(dataPath, newTokenData);
        } catch (error) {
          const errorMessage = `Error occurred in new Solana token log callback function: ${JSON.stringify(error, null, 2)}`;
          console.log(chalk.red(errorMessage));
          // Save error logs to a separate file
          fs.appendFile('errorNewLpsLogs.txt', `${errorMessage}\n`, (err) => {
            if (err) console.log('Error writing error logs:', err);
          });
        }
      },
      'confirmed'
    );
  } catch (error) {
    const errorMessage = `Error occurred in new Sol LP monitor: ${JSON.stringify(error, null, 2)}`;
    console.log(chalk.red(errorMessage));
    // Save error logs to a separate file
    fs.appendFile('errorNewLpsLogs.txt', `${errorMessage}\n`, (err) => {
      if (err) console.log('Error writing error logs:', err);
    });
  }
}

monitorNewTokens(solanaConnection);
