const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['bread', 'pastry', 'cake', 'drink'],
    default: 'bread'
  },
  size: {
    type: String,
    enum: ['small', 'large', 'medium'],
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  images: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add bread-specific pricing
productSchema.statics.getBreadPricing = function() {
  return {
    small: 5,  // 5 Birr
    large: 11  // 11 Birr
  };
};

module.exports = mongoose.model('Product', productSchema);
