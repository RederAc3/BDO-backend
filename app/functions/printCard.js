import axios from 'axios';
import { domain } from '../config.js';

const printCard = async (kpoId, token) => {
    let config = {
        headers: {
            accept: "application/json",
            ContentType: "application/json",
            Authorization: `Bearer ${token}`
        },
    };

    try {
        const response = await axios.get(`${domain}/api/WasteRegister/DocumentService/v1/kpo/printingpage?KpoId=${kpoId}`, config)
        return response.data
    } catch (err) {
        console.log(`[ printCard ] - ${err}`)
        return err
    }
}

export default printCard;