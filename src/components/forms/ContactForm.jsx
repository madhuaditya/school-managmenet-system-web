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

  const onSubmit = async (values) => {
    setResultMessage('');
    setIsError(false);

    try {
      const payload = {
        ...values,
        type: 'contact',
      };

      const result = await submitContact(payload);
      setResultMessage(result.msg || 'Your contact request has been submitted successfully.');
      reset();
    } catch (error) {
      setIsError(true);
      setResultMessage(error?.response?.data?.msg || 'Failed to submit contact request. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-200">
      <h3 className="font-heading text-xl font-bold text-slate-900">Contact Us</h3>
      <p className="text-sm text-slate-600">Contact us for collaboration, support, and product details.</p>

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
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <input
          type="tel"
          {...register('phone', {
            required: 'Phone number is required',
            pattern: {
              value: /^[6-9]\d{9}$/,
              message: 'Enter a valid 10-digit mobile number',
            },
          })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
        <textarea
          rows={4}
          {...register('message', {
            required: 'Message is required',
            minLength: {
              value: 12,
              message: 'Message should be at least 12 characters',
            },
          })}
          className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm outline-none focus:border-cyan-500"
        />
        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Contact Request'}
      </button>

      {resultMessage && (
        <p className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-600'}`}>
          {resultMessage}
        </p>
      )}
    </form>
  );
}

export default ContactForm;
