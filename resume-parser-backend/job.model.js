const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  descriptionStructured: { type: Object }, // AI-parsed structured job description
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Job = mongoose.model('Job', JobSchema);
module.exports = Job; 