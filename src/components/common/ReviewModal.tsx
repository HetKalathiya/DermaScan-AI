import React, { useState } from 'react';
import { Star, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface ReviewModalProps {
  consultationId: string;
  doctorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({ consultationId, doctorId, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage('Please select a star rating between 1 and 5');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/reviews', {
        consultationId,
        doctorId,
        rating,
        comment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.msg || error.response?.data?.error || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0A1622] border border-white/10 rounded-2xl shadow-2xl p-6 w-full max-w-md relative text-white">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        
        <h2 className="text-xl font-bold mb-1 text-white">Rate & Review Doctor</h2>
        <p className="text-xs text-gray-400 mb-4">Share your consultation experience to help improve healthcare quality.</p>
        
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-center space-x-2 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(rating)}
                className="focus:outline-none transition-transform hover:scale-110 p-1"
              >
                <Star
                  className={`w-8 h-8 ${star <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`}
                />
              </button>
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Feedback & Comments (optional)
            </label>
            <textarea
              className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 focus:border-[#00E5FF]/50 focus:ring-1 focus:ring-[#00E5FF]/30 text-white placeholder-gray-500 text-sm outline-none resize-none"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How was your consultation and follow-up guidance?..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#00E5FF] to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold py-2.5 rounded-xl text-xs transition-all disabled:opacity-50 shadow-lg shadow-[#00E5FF]/20"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
