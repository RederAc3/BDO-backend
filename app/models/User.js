import mongoose from 'mongoose';

const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
    },
    ClientId: {
        type: String,
        required: true
    },
    ClientSecret: {
        type: String,
        required: true
    },
    initialPrintCode : { 
        type: String
    },
    printers: {
        type: Array
    }
})

const User =  mongoose.model('User', UserSchema);

export default User;