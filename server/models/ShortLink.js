import mongoose from 'mongoose';

const shortLinkSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  created_by: { type: String },
  created_at: { type: Date, default: Date.now },
  clicks: { type: Number, default: 0 }
});

const ShortLink = mongoose.model('ShortLink', shortLinkSchema);
export default ShortLink;
