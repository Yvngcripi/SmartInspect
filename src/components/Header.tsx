import React from 'react';
import { Clover, ArrowLeft } from 'lucide-react';

interface HeaderProps {
  title?: string;
  onBack?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onBack }) => {
  return (
    <header className="corporate-header">
      <div className="logo-container" style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        {onBack && (
          <button 
            onClick={onBack} 
            className="close-btn" 
            aria-label="Volver"
            style={{ marginRight: '4px' }}
          >
            <ArrowLeft size={22} />
          </button>
        )}
        {!onBack && <Clover className="logo-icon" size={26} />}
        <span className="logo-text" style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {title || 'Asesorías El Trébol'}
        </span>
      </div>
    </header>
  );
};

export default Header;
