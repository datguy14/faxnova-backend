// src/components/DataTable.jsx
export default function DataTable({ rows }) {
  if (!rows.length) {
    return <p className="text-gray-600">No faxes found.</p>;
  }

  return (
    <table className="w-full border-collapse bg-white shadow-sm rounded-lg overflow-hidden">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="p-3">Fax ID</th>
          <th className="p-3">To</th>
          <th className="p-3">Provider</th>
          <th className="p-3">Status</th>
          <th className="p-3">Pages</th>
          <th className="p-3">Sent At</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((fax) => (
          <tr key={fax.faxId} className="border-t hover:bg-gray-50">
            <td className="p-3">{fax.faxId}</td>
            <td className="p-3">{fax.toNumber}</td>
            <td className="p-3">{fax.provider}</td>
            <td className="p-3">
              <span
                className={`px-2 py-1 rounded text-sm ${
                  fax.status === "delivered"
                    ? "bg-green-100 text-green-700"
                    : fax.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {fax.status}
              </span>
            </td>
            <td className="p-3">{fax.pages}</td>
            <td className="p-3">
              {fax.sentAt ? new Date(fax.sentAt).toLocaleString() : "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
