import { useState, useRef } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  HiOutlineCamera, HiOutlineIdentification, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineX
} from 'react-icons/hi';

const ID_PROOF_TYPES = [
  { value: 'aadhar', label: 'Aadhaar Card' },
  { value: 'driving_licence', label: 'Driving License' },
  { value: 'passport', label: 'Passport' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'pan', label: 'PAN Card' },
];

function createAllIdProofs() {
  return ID_PROOF_TYPES.map(t => ({
    id: t.value,
    file: null,
    preview: null,
    type: t.value,
    label: t.label,
    isVerifiedOriginal: false,
  }));
}

const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    if (!file || file.type === 'application/pdf') {
      resolve(file);
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default function RegisterUser() {
  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '',
    purpose: '', platform_id: '', alt_phone: '', dob: '',
    permanent_address: '', current_address: '', father_name: '',
  });
  const [selfie, setSelfie] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [idProofs, setIdProofs] = useState(createAllIdProofs());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [registered, setRegistered] = useState(false);
  const selfieRef = useRef(null);
  const idProofRefs = useRef({});

  // ── Helpers ──────────────────────────────────────────────────

  const handleChange = (field, value) => {
    const updatedForm = { ...form, [field]: value };
    setForm(updatedForm);
    
    // Clear existing error for this field
    const newErrors = { ...errors };
    delete newErrors[field];

    // Real-time validation
    if (field === 'phone' || field === 'alt_phone') {
      const phoneVal = field === 'phone' ? value : updatedForm.phone;
      const altPhoneVal = field === 'alt_phone' ? value : updatedForm.alt_phone;
      
      if (phoneVal && altPhoneVal && phoneVal === altPhoneVal) {
        newErrors.alt_phone = 'Alternate phone must be different from primary phone';
      } else if (field === 'alt_phone' && value && value.length !== 10) {
        newErrors.alt_phone = 'Phone number must be exactly 10 digits';
      } else {
        delete newErrors.alt_phone;
      }

      if (field === 'phone' && value && value.length !== 10) {
         newErrors.phone = 'Phone number must be exactly 10 digits';
      } else if (field === 'phone' && (!value || value.length === 10)) {
         delete newErrors.phone;
      }
    }

    if (field === 'email' && value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors.email = 'Enter a valid email address';
      }
    }

    setErrors(newErrors);
  };

  const handleSelfieChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelfie(file);
      const reader = new FileReader();
      reader.onloadend = () => setSelfiePreview(reader.result);
      reader.readAsDataURL(file);
      if (errors.selfie) setErrors(prev => ({ ...prev, selfie: null }));
    }
  };

  const removeSelfie = () => {
    setSelfie(null);
    setSelfiePreview(null);
    if (selfieRef.current) selfieRef.current.value = '';
  };

  const handleIdProofFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setIdProofs(prev => {
          const updated = [...prev];
          updated[index] = { ...updated[index], file, preview: reader.result };
          return updated;
        });
      };
      reader.readAsDataURL(file);
      if (errors.idProofs) setErrors(prev => ({ ...prev, idProofs: null }));
    }
  };

  const handleIdProofTypeChange = (index, value) => {
    setIdProofs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], type: value };
      return updated;
    });
    if (errors.idProofs) setErrors(prev => ({ ...prev, idProofs: null }));
  };

  const handleVerificationChange = (index) => {
    setIdProofs(prev =>
      prev.map((proof, i) => ({
        ...proof,
        isVerifiedOriginal: i === index ? !proof.isVerifiedOriginal : false,
      }))
    );
    if (errors.idVerified) setErrors(prev => ({ ...prev, idVerified: null }));
  };

  // All 5 ID proofs are fixed — no add/remove

  // ── Validation ──────────────────────────────────────────────

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.phone.trim()) errs.phone = 'Phone number is required';
    else if (form.phone.trim().length !== 10) errs.phone = 'Phone number must be exactly 10 digits';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';

    if (!form.alt_phone.trim()) errs.alt_phone = 'Alternate phone number is required';
    else if (form.alt_phone.trim().length !== 10) errs.alt_phone = 'Phone number must be exactly 10 digits';
    if (form.phone.trim() && form.alt_phone.trim() && form.phone.trim() === form.alt_phone.trim()) {
      errs.alt_phone = 'Alternate phone must be different from primary phone';
    }

    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.purpose) errs.purpose = 'Rental purpose is required';
    if (['blinkit', 'zepto', 'instamart'].includes(form.purpose) && !form.platform_id.trim()) {
      errs.platform_id = 'Platform ID is required for delivery purposes';
    }
    if (!form.current_address.trim()) errs.current_address = 'Current address is required';
    if (!form.permanent_address.trim()) errs.permanent_address = 'Permanent address is required';
    if (!selfie) errs.selfie = 'Selfie photo is required';

    // ID Proofs — all 5 are mandatory
    const missingDocs = idProofs.filter(p => !p.file);
    if (missingDocs.length > 0) {
      errs.idProofs = `All 5 ID proofs are required. Missing: ${missingDocs.map(p => p.label).join(', ')}`;
      missingDocs.forEach(p => {
        const idx = idProofs.findIndex(x => x.id === p.id);
        errs[`idFile_${idx}`] = `Upload ${p.label}`;
      });
    }

    const hasVerified = idProofs.some(p => p.file && p.isVerifiedOriginal);
    if (!hasVerified) errs.idVerified = 'At least one ID proof must be verified as original';

    return errs;
  };

  // ── Submit ──────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted errors before submitting');
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Compress selfie photo
      let finalSelfie = selfie;
      if (selfie) {
        try {
          finalSelfie = await compressImage(selfie, 1200, 1200, 0.7);
        } catch (compErr) {
          console.warn('Selfie compression failed, uploading original:', compErr);
        }
      }

      // Compress ID proof files concurrently
      const compressedProofs = await Promise.all(
        idProofs.map(async (proof) => {
          if (proof.file) {
            try {
              const compressedFile = await compressImage(proof.file, 1200, 1200, 0.7);
              return { ...proof, file: compressedFile };
            } catch (compErr) {
              console.warn(`Compression failed for ${proof.label}, uploading original:`, compErr);
              return proof;
            }
          }
          return proof;
        })
      );

      Object.entries(form).forEach(([key, val]) => {
        if (val) formData.append(key, val);
      });
      if (finalSelfie) formData.append('selfie', finalSelfie);

      // Append ID proofs
      const validProofs = compressedProofs.filter(p => p.file && p.type);
      formData.append('id_proof_count', validProofs.length.toString());
      validProofs.forEach((proof, i) => {
        formData.append(`id_proof_${i}`, proof.file);
        formData.append(`id_proof_type_${i}`, proof.type);
        formData.append(`id_proof_verified_${i}`, proof.isVerifiedOriginal ? 'true' : 'false');
      });

      await api.post('/employees/register-user', formData, {
        timeout: 180000, // 3 min — backend uploads 6 images to Cloudinary
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(pct);
          } else {
            setUploadProgress(50); // Fallback progress if total is not available
          }
        },
      });

      setRegistered(true);
      toast.success('Customer registered successfully!');
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        toast.error('Registration timed out. The server is still processing — please wait a minute and check before retrying.');
      } else if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.request) {
        toast.error('No response from server. Please check your connection and try again.');
      } else {
        toast.error('Registration failed: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setForm({
      name: '', phone: '', email: '', password: '',
      purpose: '', platform_id: '', alt_phone: '', dob: '',
      permanent_address: '', current_address: '', father_name: '',
    });
    setSelfie(null);
    setSelfiePreview(null);
    setIdProofs(createAllIdProofs());
    setErrors({});
    setRegistered(false);
  };

  // ── Render helpers ──────────────────────────────────────────

  const inputStyle = (field) => errors[field]
    ? { borderColor: 'var(--error)', boxShadow: '0 0 0 1px rgba(239,68,68,0.3)' }
    : {};

  const fieldError = (field) => errors[field] ? (
    <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <HiOutlineExclamationCircle size={14} /> {errors[field]}
    </div>
  ) : null;

  const showDeliveryFields = ['blinkit', 'zepto', 'instamart'].includes(form.purpose);

  // ── Success State ───────────────────────────────────────────

  if (registered) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="card" style={{ maxWidth: 500, textAlign: 'center', padding: 'var(--space-2xl)' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto var(--space-xl)',
          }}>
            <HiOutlineCheckCircle size={40} style={{ color: 'var(--success, #10b981)' }} />
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, marginBottom: 'var(--space-md)', color: 'var(--text-main)' }}>
            Registration Successful!
          </h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-xl)', lineHeight: 1.6 }}>
            Customer has been registered successfully. They can now log in to the user portal with their phone number and password.
          </p>
          <button className="btn btn-primary btn-lg" onClick={resetForm} style={{ width: '100%' }}>
            Register Another Customer
          </button>
        </div>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────────────

  return (
    <div className="fade-in">
      {/* Dynamic Keyframes for the Loading Overlay */}
      <style>{`
        @keyframes overlay-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes overlay-pulse {
          0%, 100% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes overlay-fade-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes overlay-scale-up {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Full Screen Blocking Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          pointerEvents: 'all',
          animation: 'overlay-fade-in 0.3s ease-out forwards',
        }}>
          <div style={{
            maxWidth: 480,
            width: '90%',
            padding: '40px',
            textAlign: 'center',
            background: 'rgba(30, 41, 59, 0.8)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            animation: 'overlay-scale-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          }}>
            {/* Spinning/pulse loader */}
            <div style={{ position: 'relative', width: 90, height: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                width: 80,
                height: 80,
                borderWidth: 4,
                borderStyle: 'solid',
                borderColor: 'var(--primary) transparent var(--primary) transparent',
                borderRadius: '50%',
                animation: 'overlay-spin 1.2s linear infinite'
              }}></div>
              <div style={{
                position: 'absolute',
                width: 54,
                height: 54,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.04)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <HiOutlineIdentification size={28} style={{ color: 'var(--primary)', animation: 'overlay-pulse 2s ease-in-out infinite' }} />
              </div>
            </div>

            <div>
              <h3 style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '10px',
                lineHeight: 1.4
              }}>
                Processing documents on server
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                fontWeight: 500
              }}>
                Please wait...
              </p>
            </div>

            {/* Progress indicator */}
            <div style={{ width: '100%', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {uploadProgress >= 100 ? 'Finalizing registration...' : 'Uploading files...'}
                </span>
                {uploadProgress < 100 && (
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{uploadProgress}%</span>
                )}
              </div>
              <div style={{
                height: '6px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: '3px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, var(--primary), var(--success))',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.4)', marginTop: '14px', lineHeight: 1.5 }}>
                Uploading 6 compressed files. This takes about a minute. Do not refresh or close this page.
              </p>
            </div>
          </div>
        </div>
      )}

      <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
        Register New Customer
      </h2>

      <div className="card" style={{ maxWidth: 860 }}>
        <form onSubmit={handleSubmit} noValidate>

          {/* ═══════════════════════════════════════════════════════
              SELFIE PHOTO
          ═══════════════════════════════════════════════════════ */}
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
            Profile Photo <span style={{ color: 'var(--error)' }}>*</span>
          </h3>
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            {selfiePreview ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--space-lg)',
                padding: 'var(--space-md)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg, 12px)', background: 'var(--bg-secondary, rgba(255,255,255,0.02))'
              }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={selfiePreview} alt="Selfie preview"
                    style={{
                      width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
                      display: 'block', border: '3px solid var(--primary)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                    }}
                  />
                  <div style={{
                    position: 'absolute', bottom: 0, right: 0, background: 'var(--success, #10b981)',
                    width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '2px solid var(--bg-main, #000)'
                  }}>
                    <HiOutlineCheckCircle size={14} color="#fff" />
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-all' }}>
                    {selfie?.name || 'Profile Photo'}
                  </h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                    {(selfie?.size / 1024).toFixed(1)} KB
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button" onClick={() => selfieRef.current?.click()}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '6px',
                        padding: '6px 12px', color: 'var(--text-main)', fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                      <HiOutlineCamera size={14} /> Change
                    </button>
                    <button
                      type="button" onClick={removeSelfie}
                      style={{
                        background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px',
                        padding: '6px 12px', color: 'var(--error)', fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                    >
                      <HiOutlineX size={14} /> Remove
                    </button>
                  </div>
                  <input ref={selfieRef} type="file" accept="image/*" onChange={handleSelfieChange} style={{ display: 'none' }} />
                </div>
              </div>
            ) : (
              <div
                className="file-upload"
                onClick={() => selfieRef.current?.click()}
                style={errors.selfie ? { borderColor: 'var(--error)', boxShadow: '0 0 0 1px rgba(239,68,68,0.3)' } : {}}
              >
                <input ref={selfieRef} type="file" accept="image/*" onChange={handleSelfieChange} style={{ display: 'none' }} />
                <div className="upload-icon"><HiOutlineCamera /></div>
                <p style={{ fontWeight: 500 }}>Click to capture or upload selfie</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>JPG, PNG up to 5MB</p>
              </div>
            )}
            {fieldError('selfie')}
          </div>

          {/* ═══════════════════════════════════════════════════════
              PERSONAL DETAILS
          ═══════════════════════════════════════════════════════ */}
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, marginBottom: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
            Personal Details
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" value={form.name} style={inputStyle('name')}
                onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter full name" />
              {fieldError('name')}
            </div>
            <div className="form-group">
              <label className="form-label">Father's Name</label>
              <input className="form-input" value={form.father_name}
                onChange={(e) => handleChange('father_name', e.target.value)} placeholder="Enter father's name (optional)" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Phone Number <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="tel" value={form.phone} maxLength={10}
                style={inputStyle('phone')}
                onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit phone number" />
              {fieldError('phone')}
            </div>
            <div className="form-group">
              <label className="form-label">Alternate Phone <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="tel" value={form.alt_phone} maxLength={10}
                style={inputStyle('alt_phone')}
                onChange={(e) => handleChange('alt_phone', e.target.value.replace(/\D/g, ''))}
                placeholder="Alternate number (different from primary)" />
              {fieldError('alt_phone')}
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="email" value={form.email}
                style={inputStyle('email')}
                onChange={(e) => handleChange('email', e.target.value)} placeholder="Email address" />
              {fieldError('email')}
            </div>
            <div className="form-group">
              <label className="form-label">Date of Birth <span style={{ color: 'var(--error)' }}>*</span></label>
              <input className="form-input" type="date" value={form.dob}
                style={inputStyle('dob')}
                onChange={(e) => handleChange('dob', e.target.value)} />
              {fieldError('dob')}
            </div>
          </div>
          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label">Password <span style={{ color: 'var(--error)' }}>*</span></label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input className="form-input" type={showPassword ? 'text' : 'password'} value={form.password}
                style={{ paddingRight: '40px', width: '100%', ...inputStyle('password') }}
                onChange={(e) => handleChange('password', e.target.value)} placeholder="Minimum 6 characters" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '10px', background: 'none', border: 'none',
                  color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center',
                }}>
                {showPassword ? <HiOutlineEyeOff size={20} /> : <HiOutlineEye size={20} />}
              </button>
            </div>
            {fieldError('password')}
          </div>

          {/* ═══════════════════════════════════════════════════════
              RENTAL PURPOSE
          ═══════════════════════════════════════════════════════ */}
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 'var(--space-xl) 0 var(--space-lg)', color: 'var(--text-secondary)' }}>
            Rental Purpose
          </h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Purpose <span style={{ color: 'var(--error)' }}>*</span></label>
              <select className="form-select" value={form.purpose}
                style={inputStyle('purpose')}
                onChange={(e) => handleChange('purpose', e.target.value)}>
                <option value="">Select purpose</option>
                <option value="blinkit">Blinkit</option>
                <option value="zepto">Zepto</option>
                <option value="instamart">Instamart</option>
                <option value="personal">Personal Use</option>
              </select>
              {fieldError('purpose')}
            </div>
            {showDeliveryFields && (
              <div className="form-group">
                <label className="form-label">Platform ID <span style={{ color: 'var(--error)' }}>*</span></label>
                <input className="form-input" value={form.platform_id}
                  style={inputStyle('platform_id')}
                  onChange={(e) => handleChange('platform_id', e.target.value)}
                  placeholder={`${form.purpose} delivery ID`} />
                {fieldError('platform_id')}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════
              ADDRESS
          ═══════════════════════════════════════════════════════ */}
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 'var(--space-xl) 0 var(--space-lg)', color: 'var(--text-secondary)' }}>
            Address
          </h3>
          <div className="form-group">
            <label className="form-label">Current Address <span style={{ color: 'var(--error)' }}>*</span></label>
            <textarea className="form-textarea" value={form.current_address}
              style={inputStyle('current_address')}
              onChange={(e) => handleChange('current_address', e.target.value)} placeholder="Current residential address" />
            {fieldError('current_address')}
          </div>
          <div className="form-group">
            <label className="form-label">Permanent Address <span style={{ color: 'var(--error)' }}>*</span></label>
            <textarea className="form-textarea" value={form.permanent_address}
              style={inputStyle('permanent_address')}
              onChange={(e) => handleChange('permanent_address', e.target.value)} placeholder="Permanent / home address" />
            {fieldError('permanent_address')}
          </div>

          {/* ═══════════════════════════════════════════════════════
              ID PROOF DOCUMENTS
          ═══════════════════════════════════════════════════════ */}
          <h3 style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, margin: 'var(--space-xl) 0 var(--space-lg)', color: 'var(--text-secondary)' }}>
            ID Proof Documents <span style={{ color: 'var(--error)' }}>*</span>
          </h3>

          {(errors.idProofs || errors.idVerified) && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 'var(--radius-md)', padding: 'var(--space-md)',
              marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px',
              color: 'var(--error)', fontSize: '13px',
            }}>
              <HiOutlineExclamationCircle size={18} />
              {errors.idProofs || errors.idVerified}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
            {idProofs.map((proof, index) => (
              <div key={proof.id} style={{
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg, 12px)',
                padding: 'var(--space-lg)',
                background: proof.isVerifiedOriginal
                  ? 'rgba(16,185,129,0.04)'
                  : 'var(--bg-secondary, rgba(255,255,255,0.02))',
                position: 'relative',
                transition: 'all 0.2s ease',
                ...(proof.isVerifiedOriginal ? { borderColor: 'rgba(16,185,129,0.4)' } : {}),
              }}>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 28, height: 28, borderRadius: '8px', fontSize: '13px', fontWeight: 700,
                      background: proof.file ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.06)',
                      color: proof.file ? '#10b981' : 'var(--text-muted)',
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {proof.label}
                    </span>
                  </div>
                  {proof.file && (
                    <span className="badge badge-green" style={{ fontSize: '11px' }}>Uploaded</span>
                  )}
                </div>
                {/* Upload area */}
                <div style={{ display: 'grid', gridTemplateColumns: proof.preview ? '1fr 1fr' : '1fr', gap: 'var(--space-md)' }}>
                  <div>
                    <div
                      className="file-upload"
                      onClick={() => {
                        if (!idProofRefs.current[index]) {
                          idProofRefs.current[index] = document.createElement('input');
                          idProofRefs.current[index].type = 'file';
                          idProofRefs.current[index].accept = 'image/*,.pdf';
                          idProofRefs.current[index].onchange = (e) => handleIdProofFileChange(index, e);
                        }
                        idProofRefs.current[index].click();
                      }}
                      style={{
                        padding: 'var(--space-md)',
                        minHeight: 'auto',
                        ...(errors[`idFile_${index}`] ? { borderColor: 'var(--error)' } : {}),
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <HiOutlineIdentification size={20} style={{ color: 'var(--primary)' }} />
                        <span style={{ fontSize: '13px' }}>
                          {proof.file ? proof.file.name : `Click to upload ${proof.label}`}
                        </span>
                      </div>
                      {proof.file && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {(proof.file.size / 1024).toFixed(0)} KB
                        </span>
                      )}
                    </div>
                    {errors[`idFile_${index}`] && (
                      <div style={{ color: 'var(--error)', fontSize: '11px', marginTop: '4px' }}>
                        {errors[`idFile_${index}`]}
                      </div>
                    )}
                  </div>

                  {/* Image Preview */}
                  {proof.preview && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{
                        borderRadius: 'var(--radius-md, 8px)', overflow: 'hidden',
                        border: '1px solid var(--border)', maxWidth: '100%',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                      }}>
                        <img src={proof.preview} alt={`ID Proof ${index + 1}`}
                          style={{ width: '100%', maxHeight: 180, objectFit: 'contain', display: 'block', background: '#0a0a12' }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        {ID_PROOF_TYPES.find(t => t.value === proof.type)?.label || 'Document'} Preview
                      </span>
                    </div>
                  )}
                </div>

                {/* Verification Checkbox */}
                {proof.file && proof.type && (
                  <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)' }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                      padding: '8px 12px', borderRadius: 'var(--radius-md, 8px)',
                      background: proof.isVerifiedOriginal ? 'rgba(16,185,129,0.1)' : 'transparent',
                      border: `1px solid ${proof.isVerifiedOriginal ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
                      transition: 'all 0.2s ease',
                    }}>
                      <input
                        type="checkbox"
                        checked={proof.isVerifiedOriginal}
                        onChange={() => handleVerificationChange(index)}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 22, height: 22, borderRadius: '6px',
                        border: `2px solid ${proof.isVerifiedOriginal ? '#10b981' : 'var(--border)'}`,
                        background: proof.isVerifiedOriginal ? '#10b981' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s ease', flexShrink: 0,
                      }}>
                        {proof.isVerifiedOriginal && <HiOutlineCheckCircle size={16} style={{ color: '#fff' }} />}
                      </div>
                      <div>
                        <span style={{
                          fontWeight: 600, fontSize: '13px',
                          color: proof.isVerifiedOriginal ? '#10b981' : 'var(--text-secondary)',
                        }}>
                          Original ID Verified
                        </span>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                          Tick only if the customer has presented the original physical document
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Upload count summary */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: 'var(--space-md)', marginBottom: 'var(--space-xl)',
            fontSize: '13px', color: 'var(--text-muted)',
            background: 'var(--bg-secondary, rgba(255,255,255,0.02))',
            borderRadius: 'var(--radius-md, 8px)',
          }}>
            <HiOutlineIdentification size={16} />
            {idProofs.filter(p => p.file).length} of 5 documents uploaded
          </div>

          {/* ═══════════════════════════════════════════════════════
              SUBMIT
          ═══════════════════════════════════════════════════════ */}
          <button className="btn btn-primary btn-lg" type="submit" disabled={loading}
            style={{ width: '100%', marginTop: 'var(--space-md)' }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                Registering Customer...
              </span>
            ) : 'Register Customer'}
          </button>
        </form>
      </div>
    </div>
  );
}
