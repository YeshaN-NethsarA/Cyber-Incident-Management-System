import { Router } from 'express';
import mongoose from 'mongoose';
import Incident from '../models/Incident.js';
import requireAuth from '../middleware/auth.js';
const router = Router();
router.use(requireAuth);

const allowed = {
  category: ['Phishing', 'Malware', 'Unauthorized Access', 'Data Exposure', 'Network', 'Other'],
  priority: ['Low', 'Medium', 'High', 'Critical'],
  status: ['Open', 'Investigating', 'Contained', 'Resolved']
};
function cleanPayload(body, partial = false) {
  const out = {};
  for (const key of ['title', 'description', 'category', 'priority', 'status', 'affectedAsset']) {
    if (body[key] !== undefined) out[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
  }
  if (!partial) {
    if (!out.title || out.title.length < 4) throw Object.assign(new Error('Title must be at least 4 characters'), { status: 400 });
    if (!out.description || out.description.length < 10) throw Object.assign(new Error('Description must be at least 10 characters'), { status: 400 });
  }
  for (const key of ['category', 'priority', 'status']) {
    if (out[key] !== undefined && !allowed[key].includes(out[key])) throw Object.assign(new Error(`Invalid ${key}`), { status: 400 });
  }
  if (out.title && out.title.length > 120) throw Object.assign(new Error('Title is too long'), { status: 400 });
  if (out.description && out.description.length > 3000) throw Object.assign(new Error('Description is too long'), { status: 400 });
  if (out.affectedAsset && out.affectedAsset.length > 120) throw Object.assign(new Error('Affected asset is too long'), { status: 400 });
  return out;
}

router.get('/stats/summary', async (req, res, next) => {
  try {
    const owner = new mongoose.Types.ObjectId(req.userId);
    const [total, byStatus, byPriority, recent] = await Promise.all([
      Incident.countDocuments({ owner }),
      Incident.aggregate([{ $match: { owner } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Incident.aggregate([{ $match: { owner } }, { $group: { _id: '$priority', count: { $sum: 1 } } }]),
      Incident.find({ owner }).sort({ createdAt: -1 }).limit(5).select('title status priority category createdAt')
    ]);
    res.json({
      total,
      byStatus: Object.fromEntries(['Open', 'Investigating', 'Contained', 'Resolved'].map(k => [k, byStatus.find(x => x._id === k)?.count || 0])),
      byPriority: Object.fromEntries(['Low', 'Medium', 'High', 'Critical'].map(k => [k, byPriority.find(x => x._id === k)?.count || 0])),
      recent
    });
  } catch (err) { next(err); }
});

router.get('/', async (req, res, next) => {
  try {
    const filter = { owner: req.userId };
    for (const key of ['status', 'priority', 'category']) {
      if (req.query[key]) {
        if (!allowed[key]?.includes(req.query[key])) return res.status(400).json({ message: `Invalid ${key} filter` });
        filter[key] = req.query[key];
      }
    }
    if (req.query.search) {
      const safe = String(req.query.search).slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: { $regex: safe, $options: 'i' } }, { description: { $regex: safe, $options: 'i' } }, { affectedAsset: { $regex: safe, $options: 'i' } }];
    }
    const incidents = await Incident.find(filter).sort({ createdAt: -1 }).limit(200);
    res.json(incidents);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const payload = cleanPayload(req.body);
    const incident = await Incident.create({ ...payload, owner: req.userId });
    res.status(201).json(incident);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid incident ID' });
    const incident = await Incident.findOne({ _id: req.params.id, owner: req.userId });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid incident ID' });
    const payload = cleanPayload(req.body, true);
    if (!Object.keys(payload).length) return res.status(400).json({ message: 'No valid fields supplied' });
    const incident = await Incident.findOneAndUpdate({ _id: req.params.id, owner: req.userId }, payload, { new: true, runValidators: true });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json(incident);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid incident ID' });
    const incident = await Incident.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!incident) return res.status(404).json({ message: 'Incident not found' });
    res.json({ message: 'Incident deleted' });
  } catch (err) { next(err); }
});
export default router;
