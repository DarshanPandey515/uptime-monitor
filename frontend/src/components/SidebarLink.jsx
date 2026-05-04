import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import * as Icons from 'phosphor-react';

const T = {
  black: '#000000',
  secondary: '#4e4e4e',
  muted: '#777169',
  surface: '#f5f5f5',
  border: '#e5e5e5',
};

const SidebarLink = ({ to, icon, label, isActive }) => {
  const [hovered, setHovered] = useState(false);
  const IconComponent = Icons[icon];

  const highlighted = isActive || hovered;

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 10px', borderRadius: 9,
        fontSize: 14, fontWeight: 500,
        color: isActive ? T.black : hovered ? T.secondary : T.muted,
        background: isActive
          ? 'rgba(0,0,0,0.05)'
          : hovered
            ? 'rgba(0,0,0,0.03)'
            : 'none',
        textDecoration: 'none',
        transition: 'background 0.15s, color 0.15s',
        letterSpacing: '0.14px',
        boxShadow: isActive ? 'rgba(0,0,0,0.04) 0px 0px 0px 1px' : 'none',
      }}
    >
      {IconComponent && (
        <IconComponent
          size={16}
          weight={isActive ? 'fill' : 'bold'}
          style={{ flexShrink: 0 }}
          color={isActive ? T.black : highlighted ? T.secondary : T.muted}
        />
      )}
      <span>{label}</span>
    </Link>
  );
};

export default SidebarLink;
