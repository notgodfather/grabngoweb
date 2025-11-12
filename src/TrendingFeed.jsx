import React from 'react';

const FireIcon = () => (
  <span style={{ fontSize: '1.2rem', marginRight: 8 }} role="img" aria-label="Trending">🔥</span>
);

export default function TrendingFeed({ items }) {
  if (!items || items.length === 0) {
    return null;
  }




const containerStyle = {
  marginTop: 24,
  marginBottom: 28,
  padding: '16px 20px',
  background: 'linear-gradient(to right, #fff7ed, #fff1e1)',
  borderRadius: 16,
  border: '1px solid #fed7aa'
};

const headingStyle = {
  margin: '0 0 12px 0',
  fontSize: '1.2rem',
  fontWeight: 600,
  color: '#9a3412',
  display: 'flex',
  alignItems: 'center'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
  gap: 16,
};

const itemStyle = {
  textAlign: 'center',
};

const imageStyle = {
  width: '100%',
  height: 90,
  borderRadius: 12,
  objectFit: 'cover',
  marginBottom: 8,
  border: '1px solid #fee2e2'
};

const nameStyle = {
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#333'
};

const countStyle = {
  fontSize: '0.8rem',
  color: '#c2410c'
};
