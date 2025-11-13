import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function PgReturn() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [status, setStatus] = useState('Verifying payment...');

  useEffect(() => {
    if (orderId) {
      fetch('/api/verify-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'PAID' || data.status === 'SUCCESS') {
          setStatus('Payment successful! Your order has been placed.');
        } else {
          setStatus(`Payment status: ${data.status}. Please contact support if unsure.`);
        }
      })
      .catch(() => {
        setStatus('Could not verify payment. Please try again or contact support.');
      });
    }
  }, [orderId]);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <h2>Payment Confirmation</h2>
      <p>{status}</p>
      {/* Add a link/button to return to orders or home if you want */}
    </div>
  );
}
