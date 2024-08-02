import axios from "axios";
import dotenv from 'dotenv';
dotenv.config();

export const checkScamToken = async (tokenAddress: string) => {
    console.log("scam part: token address : ", tokenAddress);
    try {
        const response = await axios.get(`${process.env.CHECK_API_URL}${tokenAddress}`);
        const {data} = response.data;
        console.log(data);
        return Object.keys(data).length == 0;
    }catch(err) {
        console.log("ERROR: CHECK SCAM TOKEN ERROR !!!");
    }
}