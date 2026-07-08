import React, { useEffect, useState } from "react";
import adminApi from "../lib/adminApi";

export default function AnalyticsOverview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminApi.getSystemOverview().then(setData);
  }, []);

  if (!data) return <div>Loading system analytics...</div>;

  return (
    <div className="analytics-overview">
      <h2>System Overview</h2>
      <ul>
        <li>Outbound Faxes: {data.outboundCount}</li>
        <li>Inbound Faxes: {data.inboundCount}</li>
        <li>Delivered: {data.deliveredCount}</li>
        <li>Failed: {data.failedCount}</li>
        <li>Errors: {data.errorCount}</li>
        <li>Failovers: {data.failoverCount}</li>
      </ul>
    </div>
  );
}
