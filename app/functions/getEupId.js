import axios from 'axios';
import { domain } from '../config.js'

const getEupId = async ({ ClientId, ClientSecret }) => {

    let config = {
        headers: {
            accept: "application/json",
            ContentType: "application/json",
        }
    }
    const data = {
        ClientId,
        ClientSecret,
        PaginationParameters: {
            Order: {
                IsAscending: true,
            },
            Page: {
                Index: 0,
                Size: 50
            }
        }
    }

    try {
        const response = await axios.post(`${domain}/api/WasteRegister/v1/Auth/getEupList`, data, config)

        return {
            eupId: response.data.items[0].eupId, 
            companyId: response.data.items[0].companyId
        }

    } catch (err) {

        console.log(`[ getEupId ] - ${err}`)

        return err
    }
}

export default getEupId;