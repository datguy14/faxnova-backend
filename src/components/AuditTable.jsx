// src/components/AuditTable.jsx

export default function AuditTable({ logs }) {
  if (!logs.length) {
    return <p className="text-gray-600">No audit logs found.</p>;
  }

  return (
    <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="p-3">Timestamp</th>
          <th className="p-3">Action</th>
          <th className="p-3">Fax ID</th>
          <th className="p-3">Provider</th>
          <th className="p-3">Details</th>
        </tr>
      </thead>

      <tbody>
        {logs.map((log) => (
          <tr key={log.id || log._id} className="border-t hover:bg-gray-50">
            <td className="p-3">
              {log.timestamp
                ? new Date(log.timestamp).toLocaleString()
                : "—"}
            </td>
            <td className="p-3 font-medium">{log.action}</td>
            <td className="p-3">{log.faxId || "—"}</td>
            <td className="p-3">{log.provider || "—"}</td>
            <td className="p-3 text-sm text-gray-700">
              {log.details || JSON.stringify(log.metadata || {}, null, 2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
