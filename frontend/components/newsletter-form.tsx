'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});
type FormValues = z.infer<typeof schema>;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setStatus('idle');
    try {
      const res = await fetch(`${API_URL}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Something went wrong.');
      setStatus('success');
      setMessage(body.message || 'Check your inbox to confirm your subscription.');
      reset();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          className="focus-ring h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="focus-ring h-10 shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      {status === 'success' && <p className="text-xs text-live">{message}</p>}
      {status === 'error' && <p className="text-xs text-red-500">{message}</p>}
    </form>
  );
}
