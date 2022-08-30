import bcrypt from 'bcrypt';
import User from '../models/User.js';

const createUser = async ({ username, password, ClientId, ClientSecret }) => {
    try {
        const salt = bcrypt.genSaltSync(10);
        const hash = await bcrypt.hash(password, salt);

        await new User({ username, password: hash, ClientId, ClientSecret }).save()
    } catch (err) {
        console.error(err.message)
        return err.message
    }
}

export default createUser;