import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Incident from './models/Incident.js';

if (!process.env.MONGO_URI) throw new Error('Set MONGO_URI in server/.env');
await mongoose.connect(process.env.MONGO_URI);
const email = 'demo@example.com';
let user = await User.findOne({ email });
if (!user) user = await User.create({ name: 'Demo Analyst', email, passwordHash: await bcrypt.hash('DemoPass123!', 12) });
await Incident.deleteMany({ owner: user._id });
await Incident.insertMany([
  { owner: user._id, title: 'Suspicious email reported', description: 'Employee received an email asking for Microsoft 365 credentials and reported it to IT.', category: 'Phishing', priority: 'High', status: 'Investigating', affectedAsset: 'Employee mailbox' },
  { owner: user._id, title: 'Unusual login attempts', description: 'Multiple failed login attempts were detected for a test account from an unfamiliar IP address.', category: 'Unauthorized Access', priority: 'Critical', status: 'Open', affectedAsset: 'Test account' },
  { owner: user._id, title: 'Endpoint malware alert', description: 'A simulated endpoint alert flagged a suspicious executable. Device isolated for review.', category: 'Malware', priority: 'Medium', status: 'Contained', affectedAsset: 'LAB-PC-02' },
  { owner: user._id, title: 'Firewall rule review', description: 'A lab firewall rule appears broader than required and should be reviewed by the network team.', category: 'Network', priority: 'Low', status: 'Resolved', affectedAsset: 'Lab firewall' }
]);
console.log('Demo data ready: demo@example.com / DemoPass123!');
await mongoose.disconnect();
