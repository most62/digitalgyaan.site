import { Twitter, Linkedin, Github, Globe } from 'lucide-react';
import type { AuthorProfile } from '@/lib/authors';

export function AuthorSocialLinks({ socialLinks }: { socialLinks?: AuthorProfile['socialLinks'] }) {
  if (!socialLinks) return null;

  const links = [
    { key: 'twitter', url: socialLinks.twitter, icon: Twitter, label: 'Twitter' },
    { key: 'linkedin', url: socialLinks.linkedin, icon: Linkedin, label: 'LinkedIn' },
    { key: 'github', url: socialLinks.github, icon: Github, label: 'GitHub' },
    { key: 'website', url: socialLinks.website, icon: Globe, label: 'Website' },
  ].filter((l) => l.url);

  if (links.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {links.map((link) => (
        <a
          key={link.key}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={link.label}
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors hover:bg-accent"
        >
          <link.icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}
