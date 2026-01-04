import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ReportPostModal = ({ post, onClose }) => {
  const [step, setStep] = useState(1); // 1: Reason, 2: Details
  const [selectedReason, setSelectedReason] = useState(null);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();

  const reportReasons = [
    {
      id: 'hate_speech',
      title: 'Hate speech or violence',
      description: 'Attacks person or groups based on protected characteristics'
    },
    {
      id: 'harassment',
      title: 'Harassment or bullying',
      description: 'Threatens, harasses, or bullies another person'
    },
    {
      id: 'misinformation',
      title: 'Misinformation',
      description: 'Contains false or misleading information'
    },
    {
      id: 'spam',
      title: 'Spam or scam',
      description: 'Suspicious content designed to deceive'
    },
    {
      id: 'sexual_content',
      title: 'Sexual content',
      description: 'Contains inappropriate sexual material'
    },
    {
      id: 'self_harm',
      title: 'Self-harm or suicide',
      description: 'Promotes or encourages self-harm'
    },
    {
      id: 'copyright',
      title: 'Copyright infringement',
      description: 'Violates intellectual property rights'
    },
    {
      id: 'other',
      title: 'Something else',
      description: 'Other reason'
    }
  ];

  const followUpQuestions = {
    hate_speech: [
      'Does this content target a specific person?',
      'Is this attacking a protected characteristic?',
      'Does it encourage violence or harm?'
    ],
    harassment: [
      'Is this directed at a specific person?',
      'Does it contain threats?',
      'Is it repeated or severe?'
    ],
    misinformation: [
      'Is this factually incorrect?',
      'Could this cause harm?',
      'Is this medical or election-related misinformation?'
    ],
    spam: [
      'Is this promoting a scam?',
      'Is this unsolicited advertising?',
      'Does it contain malicious links?'
    ],
    sexual_content: [
      'Does this contain nudity?',
      'Is this child exploitation material?',
      'Is this non-consensual intimate content?'
    ],
    self_harm: [
      'Does this promote self-harm?',
      'Does this encourage suicide?',
      'Does this glorify eating disorders?'
    ],
    copyright: [
      'What type of content is being infringed?',
      'Do you own the rights to this content?',
      'Have you already submitted a DMCA?'
    ]
  };

  const handleSubmitReport = async () => {
    if (!selectedReason || !details.trim()) {
      toast.error('Please provide details for your report');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      await api.post('/api/report/post', {
        post_id: post._id,
        reason: selectedReason,
        details,
        timestamp: new Date()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Thank you for your report. We\'ll review it shortly.');
      onClose();
    } catch (error) {
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">
            {step === 1 ? 'Report Post' : 'More Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            // Step 1: Select Reason
            <>
              <p className="text-sm text-gray-600 mb-4">
                Why are you reporting this post?
              </p>
              <div className="space-y-3">
                {reportReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => {
                      setSelectedReason(reason.id);
                      setStep(2);
                    }}
                    className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                      selectedReason === reason.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{reason.title}</p>
                    <p className="text-sm text-gray-600">{reason.description}</p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            // Step 2: Provide Details
            <>
              <div className="mb-6">
                <p className="font-semibold text-gray-800 mb-4">
                  {reportReasons.find(r => r.id === selectedReason)?.title}
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Help us understand the issue better:
                </p>
                <div className="space-y-2 mb-6">
                  {followUpQuestions[selectedReason]?.map((question, idx) => (
                    <label key={idx} className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm text-gray-700">{question}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Please provide any additional information..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                  rows="5"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setDetails('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmitReport}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportPostModal;
