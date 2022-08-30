import axios from 'axios';
import { domain } from '../config.js'

const getToken = async (ClientId, ClientSecret, EupId) => {

    let config = {
        headers: {
            accept: "application/json",
            ContentType: "application/json",
        }
    }
    
    const data = {
        ClientId,
        ClientSecret,
        EupId
    }

    try {
        const response = await axios.post(`${domain}/api/WasteRegister/v1/Auth/generateEupAccessToken`, data, config)
        return {
            status: 'success',
            token: response.data
        }
    } catch (err) {

        console.log(`[ getToken ] - ${err}`)

        return {
            success: 'error',
            error: err.message
        }
    }
}

export default getToken;