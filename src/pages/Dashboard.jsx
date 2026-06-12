import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineTruck, HiOutlineUsers, HiOutlineClipboardList,
  HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineCurrencyRupee
} from 'react-icons/hi';

export default function Dashboard() {
  const { employee } = useAuth();
  const [stats, setStats] = useState(null);
  const [expiredRentals, setExpiredRentals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, rentalsRes] = await Promise.all([
        api.get('/employees/store-stats'),
        api.get('/employees/store-rentals?status=expired')
      ]);
      setStats(statsRes.data);
      setExpiredRentals(rentalsRes.data.rentals || []);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (rentalId) => {
    if (!confirm('Are you sure you want to mark this bike as returned?')) return;
    try {
      await api.put(`/rentals/${rentalId}/return`);
      toast.success('Bike marked as returned successfully!');
      fetchData(); // Refresh both stats and expired rentals list
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to return bike');
    }
  };



  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 'var(--space-xl)' }}>
        <h2 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
          Store Dashboard
        </h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-sm)' }}>
          Store: {employee?.store_id} • Welcome, {employee?.name}
        </p>
      </div>

      <div className="card-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><HiOutlineTruck /></div>
          <div className="stat-info">
            <h3>{stats?.total_bikes || 0}</h3>
            <p>Total Bikes</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><HiOutlineCheckCircle /></div>
          <div className="stat-info">
            <h3>{stats?.available_bikes || 0}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><HiOutlineClipboardList /></div>
          <div className="stat-info">
            <h3>{stats?.rented_bikes || 0}</h3>
            <p>Rented</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><HiOutlineExclamation /></div>
          <div className="stat-info">
            <h3>{stats?.maintenance_bikes || 0}</h3>
            <p>Maintenance</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><HiOutlineUsers /></div>
          <div className="stat-info">
            <h3>{stats?.active_rentals || 0}</h3>
            <p>Active Rentals</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)' }}><HiOutlineCurrencyRupee /></div>
          <div className="stat-info">
            <h3>₹{(stats?.total_revenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p>Total Revenue</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue" style={{ background: 'rgba(59, 130, 246, 0.15)', color: 'var(--info)' }}><HiOutlineCurrencyRupee /></div>
          <div className="stat-info">
            <h3>₹{(stats?.total_deposit || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p>Total Deposits</p>
          </div>
        </div>
      </div>

      {/* Expired Rentals Section */}
      <div style={{ marginTop: 'var(--space-2xl)' }}>
        <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-md)', color: 'var(--error)' }}>
          ⚠️ Action Required: Expired Rentals
        </h3>
        
        {expiredRentals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No expired rentals at the moment.
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Bike Model</th>
                  <th>Bike Number</th>
                  <th>User Phone</th>
                  <th>Amount Due</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {expiredRentals.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.bikes?.bike_model}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>#{r.bikes?.bike_number}</td>
                    <td>{r.users?.phone}</td>
                    <td style={{ fontWeight: 600, color: 'var(--error)' }}>
                      ₹{parseFloat(r.amount + (r.fine_amount || 0)).toLocaleString('en-IN')}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-primary" onClick={() => handleReturn(r.id)}>
                        Mark Returned
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
