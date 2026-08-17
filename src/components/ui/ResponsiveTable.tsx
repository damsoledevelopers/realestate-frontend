import { ReactNode } from 'react';

interface ResponsiveTableProps {
  children: ReactNode;
  mobile: ReactNode;
  tableClassName?: string;
}

export function MobileDataCard({ children }: { children: ReactNode }) {
  return <article className="mobile-data-card">{children}</article>;
}

export function MobileDataRow({
  label,
  children,
  align = 'end',
}: {
  label: string;
  children: ReactNode;
  align?: 'start' | 'end';
}) {
  return (
    <div className={`mobile-data-row ${align === 'start' ? 'mobile-data-row-start' : ''}`}>
      <span className="mobile-data-label">{label}</span>
      <div className="mobile-data-value">{children}</div>
    </div>
  );
}

export default function ResponsiveTable({
  children,
  mobile,
  tableClassName = 'table-data-lg',
}: ResponsiveTableProps) {
  return (
    <>
      <div className="table-wrap hidden md:block">
        <table className={tableClassName}>{children}</table>
      </div>
      <div className="mobile-data-list md:hidden">{mobile}</div>
    </>
  );
}
