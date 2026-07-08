import React, { useEffect, useState } from "react";
import adminApi from "../lib/adminApi";

export default function ProviderMetrics() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    adminApi.getSystemOverview().then((data) => {
      setMetrics({
        telnyxSuccessRate: data.deliveredCount / data.outboundCount,
        sinchSuccessRate: data.deliveredCount / data.outboundCount
      });
    });
  }, []);

  if (!metrics) return <div>Loading provider metrics...</div>;

  return (
    <div className="provider-metrics">
      <h2>Provider Metrics</h2>
      <ul>
        <li>Telnyx Success Rate: {(metrics.telnyxSuccessRate * 100).toFixed(2)}%</li>
        <li>Sinch Success Rate: {(metrics.sinchSuccessRate * 100).toFixed(2)}%</li>
      </ul>
    </div>
  );
}
