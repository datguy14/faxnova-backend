import React, { useState } from "react";
import adminApi from "../lib/adminApi";
import AuditTable from "./AuditTable";
import BillingTable from "./BillingTable";

export default function TenantAnalytics() {
  const [tenantId, setTenantId] = useState("");
  const [data, setData] = useState(null);

  const loadTenant = async () => {
    const result = await adminApi.getTenantOverview(tenantId);
    setData(result);
  };

  return (
    <div className="tenant-analytics">
      <h2>Tenant Analytics</h2>

      <input
        placeholder="Enter Tenant ID"
        value={tenantId}
        onChange={(e) => setTenantId(e.target.value)}
      />
      <button onClick={loadTenant}>Load</button>

      {data && (
        <>
          <ul>
            <li>Outbound Faxes: {data.outboundCount}</li>
            <li>Inbound Faxes: {data.inboundCount}</li>
            <li>Delivered: {data.deliveredCount}</li>
            <li>Failed: {data.failedCount}</li>
            <li>Errors: {data.errorCount}</li>
            <li>Failovers: {data.failoverCount}</li>
          </ul>

          <AuditTable events={data.auditEvents} />
          <BillingTable events={data.billingEvents} />
        </>
      )}
    </div>
  );
}
