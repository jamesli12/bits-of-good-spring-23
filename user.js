import mongoose from 'mongoose';

const user = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String
});

export default mongoose.model('User', user);