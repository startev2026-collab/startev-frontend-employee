import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineShieldCheck, HiOutlineMinusCircle } from 'react-icons/hi';

export default function DepositManagement() {
  const [tab, setTab] = useState('store'); // 'store' or 'search'
  const [storeUsers, setStoreUsers] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDeposit, setUserDeposit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deductModal, setDeductModal] = useState(false);
  const [deductForm, setDeductForm] = useState({ amount: '', notes: '' });
  const [deducting, setDeducting] = useState(false);

  useEffect(() => {
    if (tab === 'store') fetchStoreUsers();
  }, [tab]);

  const fetchStoreUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/deposits/store-users');
      setStoreUsers(res.data.users);
    } catch (err) {
      toast.error('Failed to load store users');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setLoading(true);
    try {
      const res = await api.get(`/deposits/search-users?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data.users);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    try {
      const res = await api.get(`/deposits/user/${user.id}`);
      setUserDeposit(res.data);
    } catch (err) {
      toast.error('Failed to load user deposit info');
    }
  };

  const handleDeduct = async (e) => {
    e.preventDefault();
    if (!selectedUser || !deductForm.amount) return;
    
    const deductAmount = parseFloat(deductForm.amount);
    if (deductAmount > userDeposit.deposit_balance) {
      toast.error(`Cannot deduct more than the current balance (₹${userDeposit.deposit_balance})`);
      return;
    }

    setDeducting(true);
    try {
      await api.post('/deposits/deduct', {
        user_id: selectedUser.id,
        amount: parseFloat(deductForm.amount),
        notes: deductForm.notes,
      });
      toast.success(`₹${deductForm.amount} deducted successfully`);
      setDeductModal(false);
      setDeductForm({ amount: '', notes: '' });
      // Refresh
      handleSelectUser(selectedUser);
      if (tab === 'store') fetchStoreUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Deduction failed');
    } finally {
      setDeducting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      verified: { cls: 'badge-success', label: '✅ Verified' },
      partial: { cls: 'badge-warning', label: '⚠️ Partial' },
      pending: { cls: 'badge-warning', label: '⚠️ Pending' },
    };
    const badge = map[status] || { cls: 'badge-info', label: status };
    return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
  };

  const txTypeBadge = (type) => {
    const map = {
      deposit: { cls: 'badge-success', label: '💰 Deposit' },
      deduction: { cls: 'badge-error', label: '📉 Deduction' },
      refund: { cls: 'badge-info', label: '↩️ Refund' },
    };
    const badge = map[type] || { cls: 'badge-info', label: type };
    return <span className={`badge ${badge.cls}`}>{badge.label}</span>;
  };

  const users = tab === 'store' ? storeUsers : searchResults;

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
        Deposit Management
      </h2>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
        <button className={`tab ${tab === 'store' ? 'active' : ''}`} onClick={() => { setTab('store'); setSelectedUser(null); setUserDeposit(null); }}>
          Store Active Users
        </button>
        <button className={`tab ${tab === 'search' ? 'active' : ''}`} onClick={() => { setTab('search'); setSelectedUser(null); setUserDeposit(null); }}>
          Search Any User
        </button>
      </div>

      {/* Search Bar (search tab) */}
      {tab === 'search' && (
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 400 }}>
            <HiOutlineSearch />
            <input className="form-input" placeholder="Search by phone or name..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
          </div>
          <button className="btn btn-primary" onClick={handleSearch}>Search</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr 1fr' : '1fr', gap: 'var(--space-xl)' }}>
        {/* Users List */}
        <div>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <h3>{tab === 'store' ? 'No active rental users' : 'Search for users'}</h3>
              <p>{tab === 'store' ? 'No users have active rentals at your store.' : 'Enter a phone number or name to search.'}</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Deposit</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} onClick={() => handleSelectUser(u)}
                      style={{ cursor: 'pointer', background: selectedUser?.id === u.id ? 'rgba(99, 102, 241, 0.1)' : undefined }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</td>
                      <td>{u.phone}</td>
                      <td style={{ fontWeight: 600 }}>₹{parseFloat(u.deposit_balance || 0).toLocaleString('en-IN')}</td>
                      <td>{statusBadge(u.deposit_status || (parseFloat(u.deposit_balance || 0) >= 2000 ? 'verified' : 'pending'))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Selected User Detail */}
        {selectedUser && userDeposit && (
          <div>
            <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <h3 style={{ fontWeight: 700 }}>{userDeposit.user.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
                    {userDeposit.user.phone} {userDeposit.user.email ? `• ${userDeposit.user.email}` : ''}
                  </p>
                </div>
                {statusBadge(userDeposit.status)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Deposit Balance</p>
                  <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: userDeposit.is_verified ? 'var(--success)' : 'var(--warning)' }}>
                    ₹{userDeposit.deposit_balance.toLocaleString('en-IN')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>Required</p>
                  <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>₹{userDeposit.required_amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <button className="btn btn-secondary" onClick={() => setDeductModal(true)}
                disabled={userDeposit.deposit_balance <= 0}>
                <HiOutlineMinusCircle /> Deduct from Deposit
              </button>
            </div>

            {/* Transactions */}
            {userDeposit.transactions?.length > 0 && (
              <div className="card">
                <h4 style={{ fontWeight: 600, marginBottom: 'var(--space-md)' }}>Transaction History</h4>
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr><th>Date</th><th>Type</th><th>Amount</th><th>Notes</th></tr>
                    </thead>
                    <tbody>
                      {userDeposit.transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td style={{ fontSize: 'var(--font-size-sm)' }}>
                            {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td>{txTypeBadge(tx.transaction_type)}</td>
                          <td style={{ fontWeight: 600, color: tx.amount > 0 ? 'var(--success)' : 'var(--error)' }}>
                            {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                          </td>
                          <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>{tx.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Deduct Modal */}
      {deductModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }} onClick={() => setDeductModal(false)}>
          <div className="card" style={{ width: 420, maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
              Deduct from {selectedUser?.name}'s Deposit
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
              Current balance: ₹{userDeposit?.deposit_balance?.toLocaleString('en-IN')}
            </p>
            <form onSubmit={handleDeduct}>
              <div className="form-group">
                <label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" min="1" max={userDeposit?.deposit_balance}
                  value={deductForm.amount} onChange={(e) => setDeductForm({ ...deductForm, amount: e.target.value })}
                  placeholder="Enter amount to deduct" required />
              </div>
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="form-textarea" value={deductForm.notes}
                  onChange={(e) => setDeductForm({ ...deductForm, notes: e.target.value })}
                  placeholder="e.g., Damage to bike, fine, etc." required />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                <button className="btn btn-primary" type="submit" disabled={deducting}>
                  {deducting ? 'Processing...' : 'Confirm Deduction'}
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => setDeductModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
