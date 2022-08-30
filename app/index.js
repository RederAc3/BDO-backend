import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import axios from 'axios';
import 'dotenv/config'

import { appCode, backend } from './config.js';

import User from './models/User.js';
import Printers from './models/Printers.js';

import printCard from './functions/printCard.js';
import saveFile from './functions/saveFile.js';
import printConfirmation from './functions/printConfirmation.js';
import getToken from './functions/getToken.js';
import getEupId from './functions/getEupId.js';
import createUser from './functions/createUser.js';

const app = express();

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('BDO system management application :)');
});

const isAvailableUsername = async username => !!(await User.find({ username })).length;

app.post('/app/:id/signin', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { username, password } = req.body

    try {
        mongoose.connect(process.env.DB_CONNECTION)
        console.log('Connected to DB')

        const userData = await User.find({ username })

        if (!userData.length) {
            res.json({ status: 'error', message: 'Dane nie pasują do żadnego użytkownika!' });
            return;
        }

        const result = await bcrypt.compare(password, userData[0].password)

        if (!result) {
            res.json({ status: 'error', message: 'Dane nie pasują do żadnego użytkownika!' });
            return;
        }

        const { eupId, companyId } = await getEupId(userData[0])
        const tokenInfo = await getToken(userData[0].ClientId, userData[0].ClientSecret, eupId)
        console.log('logged user: ', username)

        let resInfo = { ...tokenInfo, companyId }

        eupId ? res.json(resInfo) : res.json({ status: 'error' });

    } catch (err) { console.log(err) }
});

app.post('/app/:id/signup', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { username, password } = req.body

    try {
        mongoose.connect(process.env.DB_CONNECTION)
        console.log('Connected to DB')

        if (await isAvailableUsername(username)) {
            res.json({ status: 'error', message: 'User exist' })
        } else if (!password) {
            res.json({ status: 'success' })
        } else {
            await createUser(req.body);
            res.json({ status: 'success', message: 'User created' })
        }

    } catch (err) { console.log(err.message) }
});

app.post('/app/:id/save/card/:kpoId', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const token = req.body.token;
    const kpoId = req.params.kpoId;

    try {
        const data = await printCard(kpoId, token);
        await saveFile(data, 'cards', kpoId);

        res.json({ url: `${backend}/pdf/card/${kpoId}` });
    } catch (err) {
        console.log(`[ saveCard ] - ${err}`);
    }
});

app.post('/app/:id/save/confirmation/:kpoId', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const token = req.body.token;
    const kpoId = req.params.kpoId;

    try {
        const data = await printConfirmation(kpoId, token);
        await saveFile(data, 'confirmations', kpoId);

        res.json({ url: `${backend}/pdf/confirmation/${kpoId}` })
    } catch (err) {
        console.log(`[ saveConfirmation ] - ${err}`);
    }
});

// SOCKET connection

app.post('/app/:id/settings/printer/config', async (req, res) => {
    if (req.params.id != appCode) {
        res.status(404).json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { userId, code } = req.body;
    const data = { code, userId }

    mongoose.connect(process.env.DB_CONNECTION)

    const checkPrinterExists = async SOCKET => {
        const printersList = await Printers.find({ userId });
        const { printers } = printersList[0];
        let exists = false;

        if (printers.length) {
            printers.forEach(printer => {
                exists = printer.socketId === SOCKET
            });
        }
        return exists;
    }

    try {
        const checkValue = await checkPrinterExists(code);
        if (checkValue) {
            console.log({ status: 'error', message: 'Printer already exists' })
            res.json({ status: 'error', message: 'Printer already exists' })
            return
        }

        const response = await axios.post('http://localhost:5420/config', data, { timeout: 3000 });
        if (response.data.config) {
            const { socketId, printerName } = response.data;

            Printers.updateOne({ userId }, { printers: [{ name: printerName, socketId }] }, (err, result) => {
                if (err) {
                    res.send(err);
                    return;
                }
                res.json({ status: 'success', message: 'Printer configurated' });
            });
        }
        console.log(response.data)

    } catch (err) {
        console.log(err.message);
        console.log({ error: 'Kod niepoprawny' })
        res.json({ error: 'Kod niepoprawny' })
    }
})

// PRINTER

app.post('/app/:id/printer/print', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }
    const { link, userId } = req.body;

    res.json({ userId, data: link })
});

app.post('/app/:id/settings/printer', async (req, res) => {
    if (req.params.id != appCode) {
        res.json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { userId, remotePrinting } = req.body;

    try {
        console.log(req.body)
        mongoose.connect(process.env.DB_CONNECTION)
        console.log('uuid: ' + userId)
        if (!userId) {
            res.status(404).json({ status: 'error', message: 'The user must not be empty' })
            return;
        }

        Printers.updateOne({ userId }, { remotePrinting }, (err, result) => {
            if (err) {
                res.send({ status: 'error', message: 'Error while updating' });
                return;
            }

            res.json({ status: 'success', remotePrinting })
        });

    } catch (err) {
        console.log(err.message);
        res.json({ error: 'Kod niepoprawny' })
    }
});

app.post('/app/:id/switchs/status', async (req, res) => {
    if (req.params.id != appCode) {
        res.status(404).json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { userId } = req.body;
    console.log(userId);

    if (!userId) {
        res.json({ status: 'error', message: 'The user must not be empty' })
        return;
    }

    try {
        mongoose.connect(process.env.DB_CONNECTION)
        Printers.findOne({ userId }, (err, result) => {
            if (err) {
                res.json({ status: 'error', message: err });
                return;
            }
            console.log('result: ', result)
            if (result) {
                console.log(result.remotePrinting)
                res.json({ remotePrinting: result.remotePrinting })
                return;
            }

            const printerSettings = new Printers({ userId, remotePrinting: false, printers: [{}] });
            printerSettings.save((err, result) => {
                if (err) {
                    res.json({ status: 'error', message: err });
                    return;
                }
                console.log('result: ', result)
                res.json({ status: 'success', remotePrinting: false })
            });
        });
    } catch (err) {
        console.log('errors', err.message);
    }
})

app.post('/app/:id/printers/list', async (req, res) => {
    if (req.params.id != appCode) {
        res.status(404).json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { userId } = req.body;
    console.log('userId: ' + userId);
    const printersList = await Printers.find({ userId });

    console.log(printersList[0].printers)
    res.json({ status: 'success', printers: printersList[0].printers });
});

app.post('/app/:id/settings/printer/remove', async (req, res) => {
    if (req.params.id != appCode) {
        res.status(404).json({ status: 'error', message: 'Connection to API failed' });
        return;
    }

    const { userId, socketId } = req.body;
    mongoose.connect(process.env.DB_CONNECTION)
    Printers.findOne({ userId }, (err, result) => {
        if (err) {
            res.json({ status: 'error', message: err });
            return;
        }

        if (result) {
            console.log(result)
            const { printers } = result;
            const filteredPrinters = printers.filter(value => {
                return value.socketId !== socketId;
            });

            console.log('Filtrowane: ', filteredPrinters);

            Printers.updateOne({ userId }, { printers: filteredPrinters }, (err, result) => {
                if (err) {
                    res.json({ status: 'error', message: err });
                    return;
                }
                
                res.json({ status: 'success', message: 'Printer removed' });
            });
        }
    });
})

// PDF

app.get('/pdf/confirmation/:kpoId', (req, res) => {
    res.sendFile(`pdf/confirmations/${req.params.kpoId}.pdf`, { root: '.' });
});

app.get('/pdf/card/:kpoId', (req, res) => {
    res.sendFile(`pdf/cards/${req.params.kpoId}.pdf`, { root: '.' });
});

app.get('/users/:code', async (req, res) => {
    const code = req.params.code;
    console.log(code)
    mongoose.connect(process.env.DB_CONNECTION)

    console.log('Connected to DB')

    const userData = await User.find({ initialPrintCode: code });

    if (userData[0]) {
        res.json({
            status: 'success',
            data: {
                id: userData[0].id,
                username: userData[0].username,
            }
        })
    } else res.json({ status: 'error', message: 'Code not found!' })
})

app.put('/users/:id', async (req, res) => {
    const _id = req.params.id;
    const printerLink = req.body.printer;

    console.log(req.body.printer)
    mongoose.connect(process.env.DB_CONNECTION)

    console.log('Connected to DB')
    const userData = await User.find({ printers: [printerLink] });

    if (userData[0]) {
        console.log('ta drukarka jest już przypisana do konta')
        res.json({ status: 'error', message: 'Drukarka jest już przypisana do tego konta' });
    } else {
        const updatePrinters = await User.updateOne({ _id }, { printers: [printerLink] });
        console.log(updatePrinters)

        console.log('Przypisano drukarkę do konta')
        if (updatePrinters.acknowledged) {
            res.json({
                status: 'success',
                message: 'Konfiguracja przebiegła pomyślnie. \nDrukarka dodana do konta.'
            });
        } else res.json({ status: 'error', message: 'Update printers error' });
    }
})

app.all('*', (req, res) => {
    res.redirect('/')
});

app.listen(3000);