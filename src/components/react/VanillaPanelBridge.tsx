import { useRef, useEffect } from 'react';

interface Props {
  panel: { getElement(): HTMLElement; destroy?(): void };
  className?: string;
}

export function VanillaPanelBridge({ panel, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const panelEl = panel.getElement();
    el.appendChild(panelEl);
    return () => {
      if (panel.destroy) panel.destroy();
      if (el.contains(panelEl)) el.removeChild(panelEl);
    };
  }, [panel]);

  return <div ref={ref} className={className} />;
}
