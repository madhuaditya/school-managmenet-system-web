import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitFeedback } from '../../services/publicService';

function FeedbackForm() {
  const [resultMessage, setResultMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setResultMessage('');
    setIsError(false);

    try {
      const payload = {
        ...values,
        type: 'feedback',
      };

      const result = await submitFeedback(payload);
      setResultMessage(result.msg || 'Thanks for your feedback.');
      reset();
    } catch (error) {
      setIsError(true);
      setResultMessage(error?.response?.data?.msg || 'Failed to submit feedback. Please try again.');
    }
  };

  return (
    <form
      id="feedback"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-200"
    >
      <h3 className="font-heading text-xl font-bold text-slate-900">Feedback Form</h3>
      <p className="text-sm text-slate-600">Share your experience and suggestions to help us improve.</p>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Enter a valid email address',
            },
          })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Rating</label>
        <select
          {...register('rating', { required: 'Please select rating' })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        >
          <option value="">Select rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very Good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Fair</option>
          <option value="1">1 - Needs Improvement</option>
        </select>
        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Feedback Message</label>
        <textarea
          rows={4}
          {...register('message', {
            required: 'Feedback message is required',
            minLength: {
              value: 10,
              message: 'Feedback should be at least 10 characters',
            },
          })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Sending...' : 'Submit Feedback'}
      </button>

      {resultMessage && (
        <p className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
          {resultMessage}
        </p>
      )}
    </form>
  );
}

export default FeedbackForm;
