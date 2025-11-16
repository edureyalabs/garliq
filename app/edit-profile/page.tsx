'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, AlertCircle, CheckCircle2, Loader2, User, AtSign, FileText, Upload, X } from 'lucide-react';
import Link from 'next/link';

interface ValidationState {
  username: {
    isValid: boolean;
    message: string;
    isChecking: boolean;
  };
  display_name: {
    isValid: boolean;
    message: string;
  };
  bio: {
    isValid: boolean;
    message: string;
  };
}

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
    avatar_url: ''
  });
  const [validation, setValidation] = useState<ValidationState>({
    username: { isValid: true, message: '', isChecking: false },
    display_name: { isValid: true, message: '' },
    bio: { isValid: true, message: '' }
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [usernameCheckTimer, setUsernameCheckTimer] = useState<NodeJS.Timeout | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/auth');
      return;
    }

    setUserId(session.user.id);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (data) {
      setFormData({
        username: data.username || '',
        display_name: data.display_name || '',
        bio: data.bio || '',
        avatar_url: data.avatar_url || ''
      });
      setOriginalUsername(data.username || '');
      if (data.avatar_url) {
        setAvatarPreview(data.avatar_url);
      }
    }
    
    setLoading(false);
  };

  const validateUsername = (username: string) => {
    if (!username || username.length === 0) {
      return { isValid: false, message: 'Username is required' };
    }
    if (username.length < 3) {
      return { isValid: false, message: 'Username must be at least 3 characters' };
    }
    if (username.length > 20) {
      return { isValid: false, message: 'Username must be 20 characters or less' };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { isValid: false, message: 'Only letters, numbers, and underscores allowed' };
    }
    if (/^_|_$/.test(username)) {
      return { isValid: false, message: 'Cannot start or end with underscore' };
    }
    return { isValid: true, message: '' };
  };

  const validateDisplayName = (name: string) => {
    if (!name || name.length === 0) {
      return { isValid: false, message: 'Display name is required' };
    }
    if (name.length < 2) {
      return { isValid: false, message: 'Display name must be at least 2 characters' };
    }
    if (name.length > 50) {
      return { isValid: false, message: 'Display name must be 50 characters or less' };
    }
    return { isValid: true, message: '' };
  };

  const validateBio = (bio: string) => {
    if (bio.length > 200) {
      return { isValid: false, message: 'Bio must be 200 characters or less' };
    }
    return { isValid: true, message: '' };
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username === originalUsername) {
      setValidation(prev => ({
        ...prev,
        username: { isValid: true, message: 'Current username', isChecking: false }
      }));
      return;
    }

    const formatValidation = validateUsername(username);
    if (!formatValidation.isValid) {
      setValidation(prev => ({
        ...prev,
        username: { ...formatValidation, isChecking: false }
      }));
      return;
    }

    setValidation(prev => ({
      ...prev,
      username: { isValid: true, message: 'Checking availability...', isChecking: true }
    }));

    try {
      const response = await fetch('/api/profiles/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, userId })
      });

      const { available, error } = await response.json();

      if (available) {
        setValidation(prev => ({
          ...prev,
          username: { isValid: true, message: 'Username available ✓', isChecking: false }
        }));
      } else {
        setValidation(prev => ({
          ...prev,
          username: { isValid: false, message: error || 'Username taken', isChecking: false }
        }));
      }
    } catch (error) {
      setValidation(prev => ({
        ...prev,
        username: { isValid: false, message: 'Failed to check availability', isChecking: false }
      }));
    }
  };

  const handleUsernameChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setFormData(prev => ({ ...prev, username: sanitized }));

    if (usernameCheckTimer) {
      clearTimeout(usernameCheckTimer);
    }

    const formatValidation = validateUsername(sanitized);
    if (!formatValidation.isValid) {
      setValidation(prev => ({
        ...prev,
        username: { ...formatValidation, isChecking: false }
      }));
      return;
    }

    const timer = setTimeout(() => {
      checkUsernameAvailability(sanitized);
    }, 500);
    setUsernameCheckTimer(timer);
  };

  const handleDisplayNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, display_name: value }));
    const result = validateDisplayName(value);
    setValidation(prev => ({
      ...prev,
      display_name: result
    }));
  };

  const handleBioChange = (value: string) => {
    setFormData(prev => ({ ...prev, bio: value }));
    const result = validateBio(value);
    setValidation(prev => ({
      ...prev,
      bio: result
    }));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setErrorMessage('');
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview('');
    setFormData(prev => ({ ...prev, avatar_url: '' }));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return formData.avatar_url || null;

    setUploading(true);
    try {
      const formDataObj = new FormData();
      formDataObj.append('file', avatarFile);
      formDataObj.append('userId', userId);

      const response = await fetch('/api/profiles/upload-avatar', {
        method: 'POST',
        body: formDataObj
      });

      const { success, url, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to upload avatar');
      }

      return url;
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      setErrorMessage('Failed to upload avatar: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Final validation
    const usernameVal = validateUsername(formData.username);
    const displayNameVal = validateDisplayName(formData.display_name);
    const bioVal = validateBio(formData.bio);

    if (!usernameVal.isValid || !displayNameVal.isValid || !bioVal.isValid) {
      setErrorMessage('Please fix the errors before saving');
      return;
    }

    if (validation.username.isChecking) {
      setErrorMessage('Please wait for username availability check');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Upload avatar first if there's a new file
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (!uploadedUrl) {
          throw new Error('Failed to upload avatar');
        }
        avatarUrl = uploadedUrl;
      }

      const response = await fetch('/api/profiles/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          avatar_url: avatarUrl || null
        })
      });

      const { success, error } = await response.json();

      if (!success || error) {
        throw new Error(error || 'Failed to update profile');
      }

      setSuccessMessage('✅ Profile updated successfully!');
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      setErrorMessage('❌ ' + (error.message || 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="text-6xl"
        >
          🧄
        </motion.div>
      </div>
    );
  }

  const canSave = 
    validation.username.isValid && 
    validation.display_name.isValid && 
    validation.bio.isValid &&
    !validation.username.isChecking &&
    !uploading;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="bg-black/80 backdrop-blur-xl border-b border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <ArrowLeft size={24} />
            <span className="text-xl font-bold">Edit Profile</span>
          </Link>
          
          <motion.button
            onClick={handleSave}
            disabled={!canSave || saving}
            whileHover={canSave && !saving ? { scale: 1.05 } : {}}
            whileTap={canSave && !saving ? { scale: 0.95 } : {}}
            className={`px-6 py-2.5 rounded-full font-bold flex items-center gap-2 transition-all ${
              canSave && !saving
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg'
                : 'bg-gray-700 cursor-not-allowed opacity-50'
            }`}
          >
            {saving || uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </motion.button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
          >
            <CheckCircle2 className="text-green-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-300 text-sm">{successMessage}</p>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-300 text-sm">{errorMessage}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Form (2/3 width) */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-6 sm:p-8 space-y-6"
            >
              {/* Avatar Upload */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3">
                  <Upload size={16} />
                  Profile Picture
                </label>
                
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-gray-800 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-black">
                        {formData.display_name[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarFileChange}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-block px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors text-sm font-semibold"
                    >
                      Choose File
                    </label>
                    
                    {(avatarPreview || formData.avatar_url) && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="ml-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-sm font-semibold text-red-400 transition-colors"
                      >
                        <X size={16} className="inline mr-1" />
                        Remove
                      </button>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      JPG, PNG, GIF or WEBP • Max 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3">
                  <AtSign size={16} />
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    className={`w-full px-4 py-3 bg-black/50 rounded-xl border transition-colors focus:outline-none ${
                      !validation.username.isValid
                        ? 'border-red-500 focus:border-red-500'
                        : validation.username.message === 'Username available ✓'
                        ? 'border-green-500 focus:border-green-500'
                        : 'border-gray-700 focus:border-purple-500'
                    }`}
                    placeholder="username_123"
                    maxLength={20}
                  />
                  {validation.username.isChecking && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 size={18} className="text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
                
                {validation.username.message && (
                  <p className={`mt-2 text-xs flex items-center gap-1 ${
                    validation.username.isValid 
                      ? validation.username.message === 'Username available ✓' 
                        ? 'text-green-400' 
                        : 'text-gray-400'
                      : 'text-red-400'
                  }`}>
                    {!validation.username.isValid && <AlertCircle size={12} />}
                    {validation.username.isValid && validation.username.message === 'Username available ✓' && (
                      <CheckCircle2 size={12} />
                    )}
                    {validation.username.message}
                  </p>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  3-20 characters • Letters, numbers, and underscores only • {formData.username.length}/20
                </p>
              </div>

              {/* Display Name */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3">
                  <User size={16} />
                  Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className={`w-full px-4 py-3 bg-black/50 rounded-xl border transition-colors focus:outline-none ${
                    !validation.display_name.isValid
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-700 focus:border-purple-500'
                  }`}
                  placeholder="Your Name"
                  maxLength={50}
                />
                
                {!validation.display_name.isValid && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {validation.display_name.message}
                  </p>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  Your public display name • {formData.display_name.length}/50
                </p>
              </div>

              {/* Bio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold text-gray-400 mb-3">
                  <FileText size={16} />
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleBioChange(e.target.value)}
                  className={`w-full h-32 px-4 py-3 bg-black/50 rounded-xl border transition-colors focus:outline-none resize-none ${
                    !validation.bio.isValid
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-700 focus:border-purple-500'
                  }`}
                  placeholder="Tell us about yourself..."
                  maxLength={200}
                />
                
                {!validation.bio.isValid && (
                  <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle size={12} />
                    {validation.bio.message}
                  </p>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  Optional • {formData.bio.length}/200 characters
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="text-purple-400" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-purple-300 mb-1">Profile Tips</h4>
                    <ul className="text-xs text-gray-400 space-y-1">
                      <li>• Choose a unique username that represents you</li>
                      <li>• Upload a clear profile picture (5MB max)</li>
                      <li>• Your display name can include spaces and special characters</li>
                      <li>• Your bio helps others understand who you are</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Buttons (Mobile) */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 lg:hidden">
                <motion.button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  whileHover={canSave && !saving ? { scale: 1.02 } : {}}
                  whileTap={canSave && !saving ? { scale: 0.98 } : {}}
                  className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    canSave && !saving
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg'
                      : 'bg-gray-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  {saving || uploading ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      {uploading ? 'Uploading...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Changes
                    </>
                  )}
                </motion.button>

                <Link href="/dashboard" className="flex-1">
                  <button
                    className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Right: Preview (1/3 width) - Sticky */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-gray-900/50 to-black/50 border border-gray-800 rounded-2xl p-6 sticky top-24"
            >
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <User size={20} className="text-purple-400" />
                Profile Preview
              </h3>
              
              <div className="space-y-6">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-black overflow-hidden border-4 border-gray-800">
                    {avatarPreview ? (
                      <img 
                        src={avatarPreview} 
                        alt="Avatar preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      formData.display_name[0]?.toUpperCase() || '?'
                    )}
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="text-center">
                  <h4 className="text-2xl font-bold mb-1">
                    {formData.display_name || 'Your Name'}
                  </h4>
                  <p className="text-sm text-gray-500 mb-4">
                    @{formData.username || 'username'}
                  </p>
                  
                  {formData.bio && (
                    <div className="pt-4 border-t border-gray-800">
                      <p className="text-sm text-gray-400 leading-relaxed text-left">
                        {formData.bio}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stats Preview */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-purple-400">0</div>
                    <div className="text-xs text-gray-500">Posts</div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                    <div className="text-xl font-black text-pink-400">0</div>
                    <div className="text-xs text-gray-500">Garliqs</div>
                  </div>
                </div>

                {/* Action Buttons (Desktop) */}
                <div className="hidden lg:flex flex-col gap-3 pt-4">
                  <motion.button
                    onClick={handleSave}
                    disabled={!canSave || saving}
                    whileHover={canSave && !saving ? { scale: 1.02 } : {}}
                    whileTap={canSave && !saving ? { scale: 0.98 } : {}}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      canSave && !saving
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:shadow-lg'
                        : 'bg-gray-700 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {saving || uploading ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        {uploading ? 'Uploading...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save Changes
                      </>
                    )}
                  </motion.button>

                  <Link href={`/profiles/${userId}`}>
                    <button
                      className="w-full py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-bold transition-colors"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}