import React from "react";
import AnalyticsOverview from "./components/AnalyticsOverview";
import TenantAnalytics from "./components/TenantAnalytics";
import ProviderMetrics from "./components/ProviderMetrics";

export default function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <h1>FaxNova Admin Dashboard</h1>

      <AnalyticsOverview />

      <ProviderMetrics />

      <TenantAnalytics />
    </div>
  );
}
