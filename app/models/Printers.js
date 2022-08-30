import mongoose from 'mongoose';

const UserSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true
    },
    remotePrinting: {
        type: Boolean,
    },
    printers: {
        type: Array
    }
})

const Printers =  mongoose.model('Printers', UserSchema);

export default Printers;