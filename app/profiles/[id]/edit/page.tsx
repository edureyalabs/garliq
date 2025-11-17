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

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file');
      return;
    }

    setAvatarFile(file);
    
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
        router.push(`/profiles/${userId}`);
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
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
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
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-black">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a1a1a_1px,transparent_1px),linear-gradient(to_bottom,#1a1a1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href={`/profiles/${userId}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-bold">Edit Profile</span>
          </Link>
          
          <motion.button
            onClick={handleSave}
            disabled={!canSave || saving}
            whileHover={canSave && !saving ? { scale: 1.02 } : {}}
            whileTap={canSave && !saving ? { scale: 0.98 } : {}}
            className={`px-5 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-all ${
              canSave && !saving
                ? 'bg-white text-black hover:bg-gray-200'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving || uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {uploading ? 'Uploading...' : 'Saving...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </motion.button>
        </div>
      </nav>

      <div className="relative px-6 py-5">
        <div className="max-w-7xl mx-auto">
          {/* Success/Error Messages */}
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2"
            >
              <CheckCircle2 className="text-green-400 w-4 h-4" />
              <p className="text-green-300 text-xs">{successMessage}</p>
            </motion.div>
          )}

          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
            >
              <AlertCircle className="text-red-400 w-4 h-4" />
              <p className="text-red-300 text-xs">{errorMessage}</p>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4 space-y-4"
              >
                {/* Avatar Upload */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                    <Upload className="w-3.5 h-3.5" />
                    Profile Picture
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-800 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xl font-bold">
                          {formData.display_name[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarFileChange}
                          className="hidden"
                          id="avatar-upload"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="inline-block px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors text-xs font-semibold"
                        >
                          Choose File
                        </label>
                        
                        {(avatarPreview || formData.avatar_url) && (
                          <button
                            onClick={handleRemoveAvatar}
                            className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 rounded-lg text-xs font-semibold text-red-400 transition-colors"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">Max 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Username */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                    <AtSign className="w-3.5 h-3.5" />
                    Username <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      className={`w-full px-3 py-2 text-sm bg-black/40 rounded-lg border transition-colors focus:outline-none ${
                        !validation.username.isValid
                          ? 'border-red-500 focus:border-red-500'
                          : validation.username.message === 'Username available ✓'
                          ? 'border-green-500 focus:border-green-500'
                          : 'border-gray-800 focus:border-purple-500'
                      }`}
                      placeholder="username_123"
                      maxLength={20}
                    />
                    {validation.username.isChecking && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  {validation.username.message && (
                    <p className={`mt-1 text-xs flex items-center gap-1 ${
                      validation.username.isValid 
                        ? validation.username.message === 'Username available ✓' 
                          ? 'text-green-400' 
                          : 'text-gray-400'
                        : 'text-red-400'
                    }`}>
                      {!validation.username.isValid && <AlertCircle className="w-3 h-3" />}
                      {validation.username.isValid && validation.username.message === 'Username available ✓' && (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {validation.username.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{formData.username.length}/20</p>
                </div>

                {/* Display Name */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                    <User className="w-3.5 h-3.5" />
                    Display Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.display_name}
                    onChange={(e) => handleDisplayNameChange(e.target.value)}
                    className={`w-full px-3 py-2 text-sm bg-black/40 rounded-lg border transition-colors focus:outline-none ${
                      !validation.display_name.isValid
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-800 focus:border-purple-500'
                    }`}
                    placeholder="Your Name"
                    maxLength={50}
                  />
                  
                  {!validation.display_name.isValid && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation.display_name.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{formData.display_name.length}/50</p>
                </div>

                {/* Bio */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2">
                    <FileText className="w-3.5 h-3.5" />
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => handleBioChange(e.target.value)}
                    className={`w-full h-20 px-3 py-2 text-sm bg-black/40 rounded-lg border transition-colors focus:outline-none resize-none ${
                      !validation.bio.isValid
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-800 focus:border-purple-500'
                    }`}
                    placeholder="Tell us about yourself..."
                    maxLength={200}
                  />
                  
                  {!validation.bio.isValid && (
                    <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {validation.bio.message}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">{formData.bio.length}/200</p>
                </div>
              </motion.div>
            </div>

            {/* Right: Preview - Sticky */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-black/30 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sticky top-20"
              >
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  Preview
                </h3>
                
                <div className="space-y-4">
                  {/* Avatar */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-gray-800">
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
                    <h4 className="text-base font-bold mb-0.5">
                      {formData.display_name || 'Your Name'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      @{formData.username || 'username'}
                    </p>
                    
                    {formData.bio && (
                      <div className="pt-3 border-t border-gray-800">
                        <p className="text-xs text-gray-400 leading-relaxed text-left">
                          {formData.bio}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Stats Preview */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-800">
                    <div className="bg-black/40 rounded-lg p-2 text-center">
                      <div className="text-base font-bold text-purple-400">0</div>
                      <div className="text-xs text-gray-500">Posts</div>
                    </div>
                    <div className="bg-black/40 rounded-lg p-2 text-center">
                      <div className="text-base font-bold text-pink-400">0</div>
                      <div className="text-xs text-gray-500">Garliqs</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}