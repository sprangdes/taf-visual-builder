import type { ReactNode } from "react";

interface SectionHeaderProps {
  step: string;
  title: string;
  description: string;
  aside?: ReactNode;
}

export default function SectionHeader({ step, title, description, aside }: Readonly<SectionHeaderProps>) {
  return (
    <header className="workbench-section-header">
      <div className="workbench-section-title">
        <span className="workbench-step" aria-hidden="true">{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      {aside && <div className="workbench-section-aside">{aside}</div>}
    </header>
  );
}
