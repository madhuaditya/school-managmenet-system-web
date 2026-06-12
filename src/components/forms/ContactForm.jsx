import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { submitContact } from '../../services/publicService';

function ContactForm() {
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
        type: 'contact',
      };

      const result = await submitContact(payload);
      setResultMessage(
        result.msg || 'Your contact request has been submitted successfully.'
      );
      reset();
    } catch (error) {
      setIsError(true);
      setResultMessage(
        error?.response?.data?.msg || 'Failed to submit contact request. Please try again.'
      );
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4"
    >

      <h3 className="text-xl font-bold" style={{ color: '#303841' }}>
        Contact Us
      </h3>

      <p className="text-sm" style={{ color: '#303841', opacity: 0.7 }}>
        Contact us for collaboration, support, and product details.
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

      {/* PHONE */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Phone
        </label>

        <input
          type="tel"
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Enter a valid 10-digit mobile number',
            },
          })}
          style={inputStyle}
          onFocus={(e) => Object.assign(e.target.style, focusStyle)}
          onBlur={(e) => (e.target.style.borderColor = '#E6E6E6')}
        />

        {errors.phone && (
          <p className="mt-1 text-xs" style={{ color: '#FF5722' }}>
            {errors.phone.message}
          </p>
        )}
      </div>

      {/* MESSAGE */}
      <div>
        <label className="mb-1 block text-sm" style={{ color: '#303841' }}>
          Message
        </label>

        <textarea
          rows={4}
          {...register('message', {
            required: 'Message is required',
            minLength: {
              value: 12,
              message: 'Message should be at least 12 characters',
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
        {isSubmitting ? 'Submitting...' : 'Submit Contact Request'}
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

export default ContactForm;