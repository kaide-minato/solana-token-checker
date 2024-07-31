const {getRecentTokens} = require('./src/recentTokens');
const {checkRugChecker} = require('./src/checkRugChecker');

const monitorTokens = async () => {
    const recentTokens = await getRecentTokens();
    if(recentTokens.length > 0) {
        for(const token of recentTokens) {
            if(token.platform) {
                const address = token.platform.token_address;
                if(address) {
                    const rugResult = await checkRugChecker(address);
                }
            }
        }
    }
     
}


monitorTokens();