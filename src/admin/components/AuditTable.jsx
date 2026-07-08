import React from "react";

export default function AuditTable({ events }) {
  return (
    <div className="audit-table">
      <h3>Audit Events</h3>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Details</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e._id}>
              <td>{e.type}</td>
              <td>{JSON.stringify(e.details)}</td>
              <td>{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
