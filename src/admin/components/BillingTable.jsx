import React from "react";

export default function BillingTable({ events }) {
  return (
    <div className="billing-table">
      <h3>Billing Events</h3>
      <table>
        <thead>
          <tr>
            <th>Event Type</th>
            <th>Provider</th>
            <th>Region</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e._id}>
              <td>{e.eventType}</td>
              <td>{e.provider}</td>
              <td>{e.region}</td>
              <td>{new Date(e.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
