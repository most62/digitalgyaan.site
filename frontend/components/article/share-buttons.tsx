'use client';

import { useEffect, useState } from 'react';
import { Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function ShareButtons({ postId, title }: { postId: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
    // Records a deduplicated view for this post; safe to call for guests too.
    fetch(`${API_URL}/posts/${postId}/view`, { method: 'POST', credentials: 'include' }).catch(
      () => {}
    );
  }, [postId]);

  function copyLink() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const links = [
    {
      label: 'Share on Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: 'Share on Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: 'Share on LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
        >
          <link.icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className="focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
      >
        {copied ? <Check className="h-4 w-4 text-live" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}
