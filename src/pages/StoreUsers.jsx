import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePhone, HiOutlineMail } from 'react-icons/hi';

const ID_TYPE_LABELS = {
  aadhar: 'Aadhaar Card',
  driving_licence: 'Driving License',
  passport: 'Passport',
  voter_id: 'Voter ID',
  pan: 'PAN Card',
  electricity_bill: 'Electricity Bill',
};

export default function StoreUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/employees/store-users');
      setUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to fetch store users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, color: 'var(--text-main)' }}>Store Customers</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: 'var(--space-xs)' }}>Customers registered at this store</p>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading" style={{ height: 200 }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Original ID</th>
                  <th>Purpose</th>
                  <th>Address</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{user.name}</div>
                      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        ID: {user.id}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlinePhone className="text-muted" /> {user.phone}
                      </div>
                      {user.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', marginTop: '4px' }}>
                          <HiOutlineMail className="text-muted" /> {user.email}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${user.is_first_login ? 'badge-blue' : 'badge-green'}`}>
                        {user.is_first_login ? 'New User' : 'Active'}
                      </span>
                    </td>
                    <td>
                      {user.id_proof_type ? (
                        <span className="badge badge-success" style={{ textTransform: 'capitalize', fontSize: '12px' }}>
                          {ID_TYPE_LABELS[user.id_proof_type] || user.id_proof_type.replace('_', ' ')}
                        </span>
                      ) : (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>None</span>
                      )}
                    </td>
                    <td>
                      {user.purpose ? (
                        <span style={{ textTransform: 'capitalize' }}>
                          {user.purpose}
                          {user.platform_id && <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}> ({user.platform_id})</span>}
                        </span>
                      ) : (
                        <span className="text-muted">Personal</span>
                      )}
                    </td>
                    <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.current_address || <span className="text-muted">N/A</span>}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-muted)' }}>
                      No customers have rented from your store yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
