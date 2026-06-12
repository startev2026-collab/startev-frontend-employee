import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineOfficeBuilding, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ store_id: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.store_id, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card slide-up">
        <div className="login-brand">
          <img src="/logo.jpeg" alt="StartEv" style={{ height: '80px', objectFit: 'contain', margin: '0 auto var(--space-md)', display: 'block' }} />
          <p>Sign in with your store credentials</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Store ID</label>
            <input className="form-input" placeholder="e.g. S001" value={form.store_id}
              onChange={(e) => setForm({ ...form, store_id: e.target.value })} required />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="form-input" type={showPassword ? "text" : "password"} placeholder="Enter password" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} required 
                style={{ paddingRight: '40px', width: '100%' }} />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ 
                  position: 'absolute', right: '10px', background: 'none', border: 'none', 
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' 
                }}
              >
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading} type="submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
