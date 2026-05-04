import React from 'react';
import * as Icons from 'phosphor-react';

const T = {
  white: '#ffffff',
  surface: '#f5f5f5',
  black: '#000000',
  secondary: '#4e4e4e',
  muted: '#777169',
  border: '#e5e5e5',
  shadowCard: 'rgba(0,0,0,0.06) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 4px',
  shadowInset: 'rgba(0,0,0,0.075) 0px 0px 0px 0.5px inset',
};

const iconMap = {
  '🌐': Icons.Globe,
  '📊': Icons.ChartBar,
  '⚡': Icons.Lightning,
  '✅': Icons.CheckCircle,
  '⚠️': Icons.Warning,
  '🔄': Icons.ArrowsClockwise,
};

const KPICard = ({ title, value, icon, sub }) => {
  const IconComponent = iconMap[icon] ?? Icons.Circle;

  return (
    <div
      style={{
        background: T.white,
        borderRadius: 16,
        padding: '20px 22px',
        boxShadow: T.shadowCard,
        display: 'flex', flexDirection: 'column', gap: 14,
        transition: 'box-shadow 0.2s, transform 0.2s',
        cursor: 'default',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = 'rgba(0,0,0,0.08) 0px 0px 0px 1px, rgba(0,0,0,0.06) 0px 4px 12px';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = T.shadowCard;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 11, fontWeight: 500, color: T.muted,
          textTransform: 'uppercase', letterSpacing: '0.1em',
        }}>
          {title}
        </span>

        {/* Icon chip */}
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: T.surface,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: T.shadowInset,
        }}>
          <IconComponent size={15} color={T.secondary} weight="bold" />
        </div>
      </div>

      {/* Value + optional sub-label */}
      <div>
        <div style={{
          fontSize: 30, fontWeight: 300, color: T.black, lineHeight: 1,
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}>
          {value}
        </div>
        {sub && (
          <div style={{
            fontSize: 12, color: T.muted, marginTop: 4, letterSpacing: '0.14px',
          }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
};

export default KPICard;
