import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function daysSince(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getProjectBadgeClass(count: number): string {
  if (count >= 6) return 'badge-gold';
  if (count >= 3) return 'badge-blue';
  return 'badge-gray';
}

export function getRoleTagClass(role: string): string {
  switch (role) {
    case 'SCIENTIST': return 'tag-scientist';
    case 'ECONOMIC_BUYER': return 'tag-economic-buyer';
    case 'LOGISTICS': return 'tag-logistics';
    case 'SPOC': return 'tag-spoc';
    default: return 'tag-other';
  }
}

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'SCIENTIST': return 'Scientist';
    case 'ECONOMIC_BUYER': return 'Economic Buyer';
    case 'LOGISTICS': return 'Logistics';
    case 'SPOC': return 'SPOC';
    default: return 'Other';
  }
}

export function getTimelineDotClass(inquiryType: string | null): string {
  if (!inquiryType) return 'timeline-dot-other';
  const lower = inquiryType.toLowerCase();
  if (lower.includes('in-stock') || lower.includes('in stock') || lower.includes('instock')) return 'timeline-dot-instock';
  if (lower.includes('on-demand') || lower.includes('on demand') || lower.includes('ondemand')) return 'timeline-dot-ondemand';
  return 'timeline-dot-other';
}

export function getPriorityClass(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'badge-red';
    case 'HIGH': return 'badge-orange';
    case 'MEDIUM': return 'badge-blue';
    default: return 'badge-gray';
  }
}

export function getTaskStatusClass(status: string): string {
  switch (status) {
    case 'DONE': return 'badge-green';
    case 'IN_PROGRESS': return 'badge-blue';
    case 'CANCELLED': return 'badge-gray';
    default: return 'badge bg-yellow-100 text-yellow-800';
  }
}

export function truncate(str: string | null | undefined, maxLen = 40): string {
  if (!str) return '—';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}
