/*
Animal {
  _id: ObjectId // animal's ID
  name: string // animal's name
  hoursTrained: number // total number of hours the animal has been trained for
  owner: ObjectId // id of the animal's owner
  dateOfBirth?: Date // animal's date of birth
  profilePicture?: string // pointer to animal's profile picture in cloud storage --> used in Expert level
}
*/

import mongoose from 'mongoose';

const animal = new mongoose.Schema({
    name: String,
    hoursTrained: Number,
    owner: mongoose.Schema.Types.ObjectId,
    dateOfBirth: Date,
    profilePicture: String
});

export default mongoose.model('Animal', animal);