const axios = require('axios');
require('dotenv').config();

const checkRugChecker = async (tokenAddress) => {
    try {
        const response = await axios.get(`${process.env.RUG_CHECK_API_URL}${tokenAddress}`);
        if(response.data) return false;
    }catch(err) {
        return true;
    }
}
        

module.exports = {checkRugChecker};