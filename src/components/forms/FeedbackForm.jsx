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

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #E6E6E6',
    borderRadius: '6px',
    outline: 'none',
    color: '#303841',
    backgroundColor: '#FFFFFF',
  };

  const focusStyle = {
    borderColor: '#76ABAE',
  };

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
      setResultMessage(
        error?.response?.data?.msg || 'Failed to submit feedback. Please try again.'
      );
    }
  };

  return (
    <form
      id="feedback"
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >

      <h3 className="text-xl font-bold" style={{ color: '#303841' }}>
        Feedback Form
      </h3>

      <p className="text-sm" style={{ color: '#303841', opacity: 0.7 }}>
        Share your experience and suggestions to help us improve.
      </p>

      {/* NAME */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Name
        </label>

        <input
          type="text"
          {...register('name', { required: 'Name is required' })}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
        />

        {errors.name && (
          <p className="mt-1 text-xs" style={{ color: '#FF5722' }}>
            {errors.name.message}
          </p>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Email
        </label>

        <input
          type="email"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^\S+@\S+\.\S+$/,
              message: 'Enter a valid email address',
            },
          })}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
        />

        {errors.email && (
          <p className="mt-1 text-xs" style={{ color: '#FF5722' }}>
            {errors.email.message}
          </p>
        )}
      </div>

      {/* RATING */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Rating
        </label>

        <select
          {...register('rating', { required: 'Please select rating' })}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
        >
          <option value="">Select rating</option>
          <option value="5">5 - Excellent</option>
          <option value="4">4 - Very Good</option>
          <option value="3">3 - Good</option>
          <option value="2">2 - Fair</option>
          <option value="1">1 - Needs Improvement</option>
        </select>

        {errors.rating && (
          <p className="mt-1 text-xs" style={{ color: '#FF5722' }}>
            {errors.rating.message}
          </p>
        )}
      </div>

      {/* MESSAGE */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Feedback Message
        </label>

        <textarea
          rows={4}
          {...register('message', {
            required: 'Feedback message is required',
            minLength: {
              value: 10,
              message: 'Feedback should be at least 10 characters',
            },
          })}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
        />

        {errors.message && (
          <p className="mt-1 text-xs" style={{ color: '#FF5722' }}>
            {errors.message.message}
          </p>
        )}
      </div>

      {/* BUTTON */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="px-5 py-2 text-sm font-semibold transition disabled:opacity-60"
        style={{
          backgroundColor: '#303841',
          color: '#ffffff',
          borderRadius: '6px',
        }}
      >
        {isSubmitting ? 'Sending...' : 'Submit Feedback'}
      </button>

      {/* RESULT */}
      {resultMessage && (
        <p
          className="text-sm"
          style={{
            color: isError ? '#FF5722' : '#76ABAE',
          }}
        >
          {resultMessage}
        </p>
      )}
    </form>
  );
}

export default FeedbackForm;