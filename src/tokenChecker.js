const {checkRugChecker} = require('./checkRugChecker');

// API URLs
const TOKEN_SNIFFER_API_URL = 'https://api.tokensniffer.com/';
const SAYRUM_API_URL = 'https://api.sayrum.com/';
const RAYDIUM_API_URL = 'https://api.raydium.io/';

// Function to check token scam status using multiple APIs
const checkTokenScam = async (tokenAddress) => {

  try {
    const rug = await checkRugChecker(tokenAddress);
    
  } catch (error) {
    console.error('Error checking token scam status:', error);
  }
  return rug;
};

module.exports = {
  checkTokenScam
};