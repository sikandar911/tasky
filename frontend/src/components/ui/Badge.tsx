type StatusType = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
type PriorityType = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

type BadgeVariant = StatusType | PriorityType;

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  TODO: 'bg-text-muted/20 text-text-secondary border-text-muted/30',
  IN_PROGRESS: 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30',
  REVIEW: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30',
  DONE: 'bg-accent-green/10 text-accent-green border-accent-green/30',
  LOW: 'bg-text-muted/20 text-text-secondary border-text-muted/30',
  MEDIUM: 'bg-accent-yellow/10 text-accent-yellow border-accent-yellow/30',
  HIGH: 'bg-accent-orange/10 text-accent-orange border-accent-orange/30',
  URGENT: 'bg-accent-red/10 text-accent-red border-accent-red/30',
};

const variantLabels: Record<BadgeVariant, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  REVIEW: 'REVIEW',
  DONE: 'DONE',
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
};

export default function Badge({ variant, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold font-mono border ${variantStyles[variant]} ${className}`}
    >
      {variantLabels[variant]}
    </span>
  );
}
