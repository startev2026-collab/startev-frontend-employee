import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineCog } from 'react-icons/hi';

export default function ActiveRentals() {
  const [rentals, setRentals] = useState([]);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Equipment Modal State
  const [equipmentRental, setEquipmentRental] = useState(null);
  const [batteryNumber, setBatteryNumber] = useState('');
  const [chargerNumber, setChargerNumber] = useState('');
  const [savingEquipment, setSavingEquipment] = useState(false);

  useEffect(() => {
    fetchRentals();
  }, [filter]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await api.get(`/employees/store-rentals${params}`);
      setRentals(res.data.rentals);
    } catch (err) {
      toast.error('Failed to load rentals');
    } finally {
      setLoading(false);
    }
  };

  const filtered = rentals.filter((r) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.users?.name?.toLowerCase().includes(s) ||
      r.users?.phone?.includes(s) ||
      r.bikes?.bike_number?.toLowerCase().includes(s) ||
      r.bikes?.bike_model?.toLowerCase().includes(s)
    );
  });

  const statusBadge = (status) => {
    const map = { active: 'badge-success', expired: 'badge-error', returned: 'badge-info' };
    return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
  };

  const openEquipmentModal = (rental) => {
    setEquipmentRental(rental);
    setBatteryNumber(rental.battery_number || '');
    setChargerNumber(rental.charger_number || '');
  };

  const handleSaveEquipment = async (e) => {
    e.preventDefault();
    setSavingEquipment(true);
    try {
      await api.put(`/rentals/${equipmentRental.id}/equipment`, {
        battery_number: batteryNumber,
        charger_number: chargerNumber
      });
      toast.success('Equipment details updated successfully');
      setEquipmentRental(null);
      fetchRentals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update equipment');
    } finally {
      setSavingEquipment(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600 }}>Rentals</h2>
        <div className="search-bar" style={{ width: 280 }}>
          <HiOutlineSearch />
          <input className="form-input" placeholder="Search user or bike..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="tabs">
        {['active', 'returned', 'expired', 'all'].map((f) => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No rentals found</h3>
          <p>No rentals match your criteria.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Bike</th>
                <th>Plan</th>
                <th>Start</th>
                <th>Expiry</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.users?.name}</td>
                  <td>{r.users?.phone}</td>
                  <td>
                    <div>{r.bikes?.bike_model}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>#{r.bikes?.bike_number}</div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{r.rental_plan}</td>
                  <td>{new Date(r.start_date).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(r.expiry_date).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontWeight: 600 }}>₹{parseFloat(r.amount).toLocaleString('en-IN')}</td>
                  <td>{statusBadge(r.rental_status)}</td>
                  <td>
                    {r.rental_status === 'active' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => openEquipmentModal(r)}>
                        <HiOutlineCog /> Equipment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Equipment Modal */}
      {equipmentRental && (
        <div className="modal-overlay fade-in">
          <div className="modal-content slide-up" style={{ maxWidth: '400px' }}>
            <h3 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
              Update Equipment
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
              Update battery and charger numbers for {equipmentRental.bikes?.bike_model} (#{equipmentRental.bikes?.bike_number})
            </p>

            <form onSubmit={handleSaveEquipment}>
              <div className="form-group">
                <label className="form-label">Battery Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. BAT-12345"
                  value={batteryNumber}
                  onChange={(e) => setBatteryNumber(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Charger Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. CHG-98765"
                  value={chargerNumber}
                  onChange={(e) => setChargerNumber(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEquipmentRental(null)} disabled={savingEquipment}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingEquipment}>
                  {savingEquipment ? 'Saving...' : 'Save Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
