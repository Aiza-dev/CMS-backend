const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Technical Issue', 'Billing / Payment', 'Account Issue', 'Service Issue', 'Product Issue', 'Other']
    },
    priority: { type: String, required: true, enum: ['Low', 'Medium', 'High'] },
    status: { type: String, default: 'Pending', enum: ['Pending', 'In Progress', 'Resolved'] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);