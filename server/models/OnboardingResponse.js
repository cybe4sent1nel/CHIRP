import mongoose from 'mongoose';

const onboardingResponseSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
    ref: 'User'
  },
  age_group: {
    type: String,
    required: true,
    enum: ['13-17', '18-24', '25-34', '35-44', '45-54', '55+']
  },
  interests: [{
    type: String,
    enum: [
      'technology',
      'sports',
      'music',
      'art',
      'gaming',
      'food',
      'travel',
      'fashion',
      'fitness',
      'business',
      'education',
      'entertainment',
      'photography',
      'books',
      'science',
      'other'
    ]
  }],
  referral_source: {
    type: String,
    required: true,
    enum: [
      'friend',
      'social_media',
      'search_engine',
      'advertisement',
      'news_article',
      'influencer',
      'app_store',
      'other'
    ]
  },
  referral_details: {
    type: String,
    maxLength: 200
  },
  content_preferences: {
    show_trending: { type: Boolean, default: true },
    show_recommended: { type: Boolean, default: true },
    filter_mature_content: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

const OnboardingResponse = mongoose.model('OnboardingResponse', onboardingResponseSchema);
export default OnboardingResponse;
