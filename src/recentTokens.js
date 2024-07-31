const axios = require('axios');
require('dotenv').config();


const getRecentTokens = async () => {
    try{
        const response = await axios.get("https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest", {
            headers: {
                'X-CMC_PRO_API_KEY': "1e745534-6c67-4898-8777-53582091acf4",
            },
            params: {
                start: 1,
                limit: 5000,
                sort: 'date_added',
                sort_dir: 'asc',
                convert: "USD",
            }
        });
        const {data} = response.data;
        let tokens = [];
        if(data) {
            tokens = data.filter((token) => token.symbol == 'SOL');
            console.log(tokens);
        }
        return tokens;
    }catch(err) {
        console.log(err);
    }
}

module.exports = {getRecentTokens}