/*
TrainingLog {
  _id: ObjectId // training log's id
  date: Date // date of training log
  description: string // description of training log
  hours: number // number of hours the training log records
  animal: ObjectId // animal this training log corresponds to
  user: ObjectId // user this training log corresponds to
  trainingLogVideo?: string // pointer to training log video in cloud storage --> used in Expert level
}
*/

import mongoose from 'mongoose';

const trainingLog = new mongoose.Schema({
    date: Date,
    description: String,
    hours: Number,
    animal: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId,
    trainingLogVideo: String
});

export default mongoose.model('TrainingLog', trainingLog);