import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewGridProps {
  images: string[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
  onImageClick?: (index: number) => void; // Opens fullscreen viewer
}

export const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({ images, onRemove, readOnly = false, onImageClick }) => {
  if (images.length === 0) return null;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '8px',
      marginTop: '8px'
    }}>
      {images.map((img, idx) => (
        <div 
          key={idx} 
          style={{
            position: 'relative',
            paddingBottom: '100%', // Create a perfect square aspect-ratio box
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            border: `1px solid ${onImageClick ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`,
            backgroundColor: '#0f172a', // fallback background color
            cursor: onImageClick ? 'zoom-in' : 'default',
            transition: 'border-color 0.15s ease, transform 0.15s ease'
          }}
          onClick={() => onImageClick?.(idx)}
          onMouseEnter={(e) => { if (onImageClick) e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; }}
          onMouseLeave={(e) => { if (onImageClick) e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; }}
        >
          <img 
            src={img} 
            alt={`Previsualización ${idx + 1}`} 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          {/* Zoom hint overlay */}
          {onImageClick && (
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: '4px',
              padding: '2px 5px',
              fontSize: '10px',
              color: 'rgba(255,255,255,0.8)',
              pointerEvents: 'none'
            }}>
              🔍
            </div>
          )}
          {!readOnly && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(idx);
              }}
              type="button"
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '22px',
                height: '22px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(239, 68, 68, 0.95)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                padding: 0,
                zIndex: 2,
                transition: 'background-color var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--danger-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.95)'}
            >
              <X size={12} strokeWidth={3} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default ImagePreviewGrid;
