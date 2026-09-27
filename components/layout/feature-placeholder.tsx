import { AppIcon, type AppIconName } from '@/components/ui/app-icon';

export function FeaturePlaceholder({ icon, eyebrow, title, description }: { icon: AppIconName; eyebrow: string; title: string; description: string }) {
  return (
    <section className="feature-placeholder">
      <span className="placeholder-icon"><AppIcon name={icon} aria-hidden="true" size={28} /></span>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <span className="coming-soon-pill">Foundation route ready</span>
    </section>
  );
}
