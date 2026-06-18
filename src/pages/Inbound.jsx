// src/pages/Inbound.jsx
import { useEffect, useState } from "react";
import { getInboundFaxes } from "../api/faxApi";
import DataTable from "../components/DataTable";

export default function Inbound() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInboundFaxes()
      .then((data) => setRows(data.faxes || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inbound Faxes</h1>

      {loading ? (
        <p className="text-gray-600">Loading inbound faxes…</p>
      ) : (
        <DataTable rows={rows} />
      )}
    </div>
  );
}
