import fs from 'fs';

const saveFile = async (data, type, kpoId) => {
    fs.writeFile(`./pdf/${type}/${kpoId}.pdf`, data, "base64", (error) => {
        if (error) {
            throw error;
        } else {
            console.log("Zapisane!");
        }
    });
};

export default saveFile;