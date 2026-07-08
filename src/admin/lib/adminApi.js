const API_BASE = "/admin/analytics";

export default {
  async getSystemOverview() {
    const res = await fetch(`${API_BASE}/system`);
    const json = await res.json();
    return json.data;
  },

  async getTenantOverview(tenantId) {
    const res = await fetch(`${API_BASE}/tenant/${tenantId}`);
    const json = await res.json();
    return json.data;
  }
};
