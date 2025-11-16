const mongoose = require('mongoose');

const PresentismoRecipientSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    roleLabel: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

PresentismoRecipientSchema.index({ active: 1 });

module.exports = mongoose.model('PresentismoRecipient', PresentismoRecipientSchema);