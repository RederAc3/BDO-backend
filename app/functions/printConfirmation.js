import axios from 'axios';
import { domain } from '../config.js';

const printConfirmation = async (kpoId, token) => {
    let config = {
        headers: {
            accept: "application/json",
            ContentType: "application/json",
            Authorization: `Bearer ${token}`
        },
    };

    try {
        const response = await axios.get(`${domain}/api/WasteRegister/DocumentService/v1/kpo/confirmation?KpoId=${kpoId}`, config)
        return response.data
    } catch (err) {
        console.log(`[ printConfirmation ] - ${err}`)
        return err
    }
}

export default printConfirmation;