import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineLightningBolt } from 'react-icons/hi';

export default function BikeManagement() {
  const [bikes, setBikes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBikes();
  }, [filter]);

  const fetchBikes = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/employees/store-bikes${params}`);
      setBikes(res.data.bikes);
    } catch (err) {
      toast.error('Failed to load bikes');
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status) => {
    const map = { available: 'badge-success', rented: 'badge-warning', maintenance: 'badge-error' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
        Store Bikes
      </h2>

      <div className="tabs">
        {['all', 'available', 'rented', 'maintenance'].map((f) => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : bikes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏍️</div>
          <h3>No bikes found</h3>
          <p>No bikes match the selected filter.</p>
        </div>
      ) : (
        <div className="card-grid">
          {bikes.map((bike) => (
            <div className="bike-card" key={bike.id}>
              <div className="bike-card-image">
                {bike.image_url ? <img src={bike.image_url} alt={bike.bike_model} /> : <HiOutlineLightningBolt />}
              </div>
              <div className="bike-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3>{bike.bike_model}</h3>
                  {statusBadge(bike.status)}
                </div>
                <div className="bike-meta">
                  <span>#{bike.bike_number}</span>
                  <span>•</span>
                  <span>{bike.bike_type || 'Electric'}</span>
                </div>
                <div className="bike-card-pricing">
                  <div className="price-option">
                    <div className="price">₹{bike.daily_price}</div>
                    <div className="duration">Day</div>
                  </div>
                  <div className="price-option">
                    <div className="price">₹{bike.weekly_price}</div>
                    <div className="duration">Week</div>
                  </div>
                  <div className="price-option">
                    <div className="price">₹{bike.monthly_price}</div>
                    <div className="duration">Month</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
