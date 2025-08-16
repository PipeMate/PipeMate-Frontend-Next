import { CheckCircle, XCircle } from 'lucide-react';
import type { RefreshFeedback as RefreshFeedbackType } from '../hooks';

interface RefreshFeedbackProps {
  feedback: RefreshFeedbackType;
}

export default function RefreshFeedback({ feedback }: RefreshFeedbackProps) {
  if (!feedback.type) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 ${
        feedback.type === 'success'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      {feedback.type === 'success' ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      <span className="text-sm font-medium">{feedback.message}</span>
    </div>
  );
}
