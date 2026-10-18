import mongoose from 'mongoose';
const incidentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, minlength: 4, maxlength: 120 },
  description: { type: String, required: true, trim: true, minlength: 10, maxlength: 3000 },
  category: { type: String, enum: ['Phishing', 'Malware', 'Unauthorized Access', 'Data Exposure', 'Network', 'Other'], default: 'Other' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  status: { type: String, enum: ['Open', 'Investigating', 'Contained', 'Resolved'], default: 'Open' },
  affectedAsset: { type: String, trim: true, maxlength: 120, default: '' },
  reportedAt: { type: Date, default: Date.now }
}, { timestamps: true });
incidentSchema.index({ owner: 1, createdAt: -1 });
export default mongoose.model('Incident', incidentSchema);
