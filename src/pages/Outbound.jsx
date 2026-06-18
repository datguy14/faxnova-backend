// src/pages/Outbound.jsx
import { useEffect, useState } from "react";
import { getOutboundFaxes } from "../api/faxApi";
import DataTable from "../components/DataTable";

export default function Outbound() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOutboundFaxes()
      .then((data) => setRows(data.faxes || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Outbound Faxes</h1>

      {loading ? (
        <p className="text-gray-600">Loading outbound faxes…</p>
      ) : (
        <DataTable rows={rows} />
      )}
    </div>
  );
}
