import React from 'react';
import { Clock } from 'lucide-react';

const MessageStatus = ({ status, message }) => {
  // Support both direct status prop or message object
  const actualStatus = status || 
    (message?.read || message?.read_at ? 'read' : 
     message?.delivered || message?.delivered_at ? 'delivered' : 
     message?.sent ? 'sent' : 
     'pending');
  
  // Pending/Sending - clock icon
  if (actualStatus === 'pending' || actualStatus === 'sending') {
    return <Clock size={14} className="text-gray-500" />;
  }

  // Read (double green check) - WhatsApp style
  if (actualStatus === 'read' || actualStatus === 'seen') {
    return (
      <div className="relative flex items-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-green-600">
          <path d="M3 8.5L5.5 11L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 8.5L9 11L12.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  // Delivered (double gray check)
  if (actualStatus === 'delivered') {
    return (
      <div className="relative flex items-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-500">
          <path d="M3 8.5L5.5 11L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6.5 8.5L9 11L12.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  // Sent (single gray check)
  if (actualStatus === 'sent') {
    return (
      <div className="relative flex items-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-500">
          <path d="M4 8.5L6.5 11L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    );
  }

  // Default - clock
  return <Clock size={14} className="text-gray-500" />;
};

export default MessageStatus;
