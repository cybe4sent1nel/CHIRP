import React, { useState } from 'react';
import { X, AlertTriangle, Flag } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam', description: 'Misleading or repetitive content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying or targeting someone' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Attacks based on identity' },
  { value: 'violence', label: 'Violence', description: 'Threats or graphic violence' },
  { value: 'nudity', label: 'Nudity or Sexual Content', description: 'Inappropriate adult content' },
  { value: 'false_information', label: 'False Information', description: 'Misinformation or fake news' },
  { value: 'intellectual_property', label: 'Intellectual Property', description: 'Copyright or trademark violation' },
  { value: 'scam', label: 'Scam or Fraud', description: 'Deceptive or fraudulent content' },
  { value: 'other', label: 'Other', description: 'Something else' }
];

const ReportModal = ({ isOpen, onClose, itemType, itemId }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedReason) {
      toast.error('Please select a reason');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASEURL}/report/create`,
        {
          reported_item_type: itemType,
          reported_item_id: itemId,
          reason: selectedReason,
          description: description.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Report submitted successfully');
        onClose();
      }
    } catch (error) {
      console.error('Report error:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to submit report');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Report Content</h2>
              <p className="text-sm text-gray-500">Help us keep Chirp safe</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Why are you reporting this?
            </label>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <div
                  key={reason.value}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                    selectedReason === reason.value
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedReason(reason.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="reason"
                      value={reason.value}
                      checked={selectedReason === reason.value}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">{reason.label}</p>
                      <p className="text-sm text-gray-500">{reason.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Details (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context to help us understand the issue..."
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 resize-none"
              rows="4"
              maxLength="500"
            />
            <p className="text-xs text-gray-500 mt-1">{description.length}/500 characters</p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">Your report is anonymous</p>
              <p className="text-blue-700">
                The account you're reporting won't see who reported them. We'll review this
                report and take appropriate action.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportModal;
