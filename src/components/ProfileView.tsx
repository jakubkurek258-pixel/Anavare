import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { COMPANIONS_AVATARS } from '../data/rpgAssets';
import { stateService, validateImage } from '../lib/stateService';
import AvatarImage from './AvatarImage';
import { 
  User, Shield, Award, Calendar, Flame, Zap, Camera, RefreshCw, 
  Check, Swords, Brain, Dumbbell, Heart, Coins, CheckSquare, Target,
  Trash2, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ProfileView() {
  const { user, setProfileAvatar, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Account deletion states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  if (!user) return null;

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError('');
    try {
      await stateService.deleteAccount(user.id, deletionReason);
      await logout();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err?.message || 'Failed to complete execution of account deletion sequence.');
      setIsDeleting(false);
    }
  };

  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError('');
    setSuccessMsg('');

    try {
      // 1. Validate file format and size (Max 2MB)
      validateImage(file);

      // Create local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      setIsUploading(true);

      // 2. Upload to Cloudinary using secure upload endpoint
      const secureUrl = await stateService.uploadMedia(file, 'users', user.id);
      
      // 3. Update model state and persistence
      await setProfileAvatar(secureUrl);
      setSuccessMsg('Profile picture updated successfully!');
      
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(objectUrl);
      setAvatarPreview(null);
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to request image upload.');
      setAvatarPreview(null);
    } finally {
      setIsUploading(false);
      // Clean and safe handling of file input: reset value so same file can be selected again
      e.target.value = '';
    }
  };

  const selectPredefinedAvatar = async (url: string) => {
    setUploadError('');
    setSuccessMsg('');
    try {
      await setProfileAvatar(url);
      setSuccessMsg('Companion portrait updated successfully!');
    } catch (err: any) {
      setUploadError(err?.message || 'Failed to update portrait.');
    }
  };

  const getSkillIcon = (category: string) => {
    switch (category) {
      case 'health': return <Heart className="w-4 h-4 text-emerald-400" />;
      case 'fitness': return <Dumbbell className="w-4 h-4 text-rose-400" />;
      case 'learning': return <Brain className="w-4 h-4 text-indigo-400" />;
      case 'productivity': return <CheckSquare className="w-4 h-4 text-amber-400" />;
      case 'finance': return <Coins className="w-4 h-4 text-yellow-400" />;
      default: return <Target className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="space-y-6" id="rpg-profile-scope">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <User className="w-6 h-6 text-indigo-400" />
          </div>
          <div className="text-left">
            <h1 className="font-display font-black text-2xl uppercase tracking-wider text-glow-blue text-white">
              RPG Profile Panel
            </h1>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Manage your digital identity, inspect metrics, and update your avatar.
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-black/45 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <span className="block text-[8.5px] font-mono text-indigo-400 uppercase tracking-widest">TOTAL XP</span>
            <span className="font-display font-black text-lg text-white">{user.totalXp} <span className="text-xs text-indigo-400">XP</span></span>
          </div>
          <div className="bg-black/45 px-4 py-2 rounded-xl border border-slate-800 text-center">
            <span className="block text-[8.5px] font-mono text-purple-400 uppercase tracking-widest">ACTIVITY STREAK</span>
            <span className="font-display font-black text-lg text-white flex items-center justify-center gap-1">
              <Flame className="w-4 h-4 text-rose-500 fill-rose-500" />
              {user.streak} DAYS
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: VISUAL IDENTITY & PORTRAIT UPLOAD */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-black/45 border border-white/5 text-center flex flex-col items-center">
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest mb-4">HERO AVATAR</span>
            
            {/* Display user profile photo center aligned, modern appearance */}
            <div className="relative w-44 h-44 rounded-2xl overflow-hidden border border-indigo-500/30 shadow-[0_0_25px_rgba(99,102,241,0.15)] group bg-black/50 mb-4 shrink-0 flex items-center justify-center">
              <AvatarImage 
                src={avatarPreview || user.avatar} 
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isUploading ? 'opacity-40 blur-[1px]' : ''}`} 
                alt={user.username}
              />
              {isUploading && (
                <div className="absolute inset-x-0 bottom-0 bg-black/60 py-2 flex flex-col items-center justify-center gap-1">
                  <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                  <span className="text-[8px] text-indigo-200 font-mono uppercase tracking-widest font-semibold animate-pulse">Uploading...</span>
                </div>
              )}
            </div>

            <h3 className="font-display font-black text-xl text-white tracking-wide uppercase">
              {user.username}
            </h3>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-1 rounded-full uppercase font-bold mt-2">
              Level {user.level} • {user.email}
            </span>

            {/* ERROR / SUCCESS NOTIFIER */}
            {uploadError && (
              <p className="mt-4 p-2.5 bg-rose-950/40 border border-rose-500/30 text-rose-400 text-xs rounded-xl font-mono text-center w-full">
                {uploadError}
              </p>
            )}
            {successMsg && (
              <p className="mt-4 p-2.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl font-mono text-center w-full animate-pulse">
                {successMsg}
              </p>
            )}

            {/* CUSTOM PHOTO FILE UPLOAD ACTION */}
            <div className="mt-6 w-full pt-4 border-t border-white/5">
              <label 
                className="w-full h-[40px] font-sans font-semibold text-xs uppercase cursor-pointer rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(99,102,241,0.25)] select-none"
                id="profile-custom-avatar-uploader"
              >
                {isUploading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-100" />
                ) : (
                  <Camera className="w-4 h-4 text-indigo-100" />
                )}
                <span>{isUploading ? 'Uploading...' : 'Upload custom image'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={handleCustomAvatarUpload}
                  disabled={isUploading}
                />
              </label>
              <span className="block text-[9px] text-slate-500 font-mono mt-2 uppercase">
                Supported formats: JPG, PNG, WEBP • Max: 2 MB
              </span>
            </div>
          </div>

          {/* STOCK SYSTEM COMPANIONS MATRIX */}
          <div className="p-6 rounded-2xl bg-black/45 border border-white/5 text-left">
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-3">SELECT CLASSIC PORTRAIT</span>
            <div className="grid grid-cols-3 gap-3">
              {COMPANIONS_AVATARS.map((av) => {
                const isSelected = user.avatar === av.url;
                return (
                  <button
                    key={av.id}
                    onClick={() => selectPredefinedAvatar(av.url)}
                    id={`predefined-selector-${av.id}`}
                    className={`relative rounded-xl overflow-hidden border transition-all aspect-square cursor-pointer flex items-center justify-center outline-none ${
                      isSelected 
                        ? 'border-indigo-500 scale-105 shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <AvatarImage 
                      src={av.url} 
                      alt={av.name} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8.5px] text-white font-mono truncate px-1">{av.name.split(' ')[0]}</span>
                    </div>
                    {isSelected && (
                      <div className="absolute bottom-1.5 right-1.5 bg-indigo-500 text-white p-0.5 rounded-full scale-75">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE LEVEL METRICS & ACHIEVEMENTS TREE */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* LEVEL EXPERIENCE CARD */}
          <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md text-left">
            <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              LEVEL PROGRESS (LEVEL {user.level})
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-mono text-slate-400">
                <span>LEVEL EXP</span>
                <span>{user.xp} / {user.requiredXp} XP</span>
              </div>
              
              <div className="w-full h-3.5 bg-black/55 rounded-full border border-white/5 p-0.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(99,102,241,0.3)] animate-[shimmer_2s_infinite]"
                  style={{ width: `${Math.min(100, (user.xp / user.requiredXp) * 100)}%` }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-sans block">
                Complete Academy classes or complete daily tasks to gather experience points and unlock legendary ranks.
              </p>
            </div>
          </div>

          {/* CHARACTER SKILLS STATUS CORES */}
          <div className="p-6 rounded-2xl bg-black/45 border border-white/5 text-left">
            <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider mb-4">
              CORE SKILL COEFFICIENTS
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(user.skills || {}).map(([skillKey, val]) => {
                const skillVal = val as { level: number; xp: number };
                return (
                  <div key={skillKey} className="p-3 rounded-xl border border-white/5 bg-slate-950/45 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
                        {getSkillIcon(skillKey)}
                      </div>
                      <div className="text-left min-w-0">
                        <span className="font-display font-bold text-xs text-white uppercase tracking-wider block truncate">{skillKey}</span>
                        <span className="font-mono text-[9px] text-slate-500 block">XP: {skillVal.xp}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[11px] font-black text-indigo-400 bg-indigo-500/5 border border-indigo-500/10 px-2 py-0.5 rounded">
                        LV {skillVal.level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* UNLOCKED BADGES GALLERY */}
          <div className="p-6 rounded-2xl bg-black/45 border border-white/5 text-left">
            <h3 className="font-display font-black text-sm text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-400" />
              ACHIEVEMENTS & BADGES ({user.badges?.length || 0})
            </h3>
            
            {user.badges && user.badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {user.badges.map((badge) => (
                  <div 
                    key={badge.id} 
                    className="p-3 rounded-xl border border-purple-500/10 bg-gradient-to-br from-purple-950/20 to-black text-center flex flex-col items-center justify-center gap-1.5"
                  >
                    <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                      <Swords className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="font-display font-bold text-xs text-slate-200 uppercase block truncate max-w-full">{badge.title}</span>
                    <span className="text-[9px] text-slate-500 leading-tight font-sans block">{badge.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-sans border border-dashed border-white/5 rounded-xl bg-black/10">
                Your glorious path has just begun. Complete quests and classes to earn your first badges!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DANGER PROTOCOL ZONE */}
      <div className="p-6 rounded-2xl bg-red-950/10 border border-red-500/10 text-left space-y-4 mt-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xs text-red-450 uppercase tracking-wider">
              DANGER ZONE PROTOCOL
            </h3>
            <p className="text-[11px] text-slate-400 font-sans mt-0.5">
              Actions in this registry are permanent and cannot be undone. Account deletion clears all server nodes.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-red-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-display font-medium text-xs text-slate-200">Delete Companion Account Registry</span>
            <p className="text-[11px] text-slate-450 font-sans leading-relaxed">
              Permanently delete this user profile file, posts chronicle database entry, courses level records, completed tasks, and authentication credentials.
            </p>
          </div>
          <button
            onClick={() => {
              setDeletionReason('');
              setDeleteError('');
              setIsDeleteModalOpen(true);
            }}
            id="open-delete-account-modal-btn"
            className="px-5 py-2 rounded-xl border border-red-500/40 bg-red-500/5 hover:bg-red-500/15 text-red-400 hover:text-red-300 font-mono text-[11px] uppercase transition-all duration-150 cursor-pointer text-center shrink-0"
          >
            DELETE ACCOUNT
          </button>
        </div>
      </div>

      {/* ACCOUNT DELETION CONFIRMATION DIALOG MODAL */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-[#0a0914] border border-red-500/30 p-6 relative overflow-hidden backdrop-blur-xl shadow-2xl"
            >
              <div className="flex flex-col gap-4 text-center items-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 animate-pulse">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-display font-semibold text-xs uppercase text-slate-100 tracking-wider">
                    DELETE YOUR ACCOUNT?
                  </h3>
                  <p className="text-[11.5px] text-slate-400 leading-relaxed font-sans">
                    Are you sure you want to delete your account? All progress, streak scores, published progress chronicle posts, and custom courses will be wiped forever from the datastore.
                  </p>
                </div>

                {/* Optional Reason Text field */}
                <div className="w-full text-left space-y-1.5 mt-2">
                  <label className="text-[9.5px] font-mono text-slate-500 uppercase block">
                    Why are you leaving? (Optional reason):
                  </label>
                  <textarea
                    value={deletionReason}
                    onChange={(e) => setDeletionReason(e.target.value)}
                    placeholder="Enter reason or feedback..."
                    rows={2}
                    className="w-full px-3.5 py-2 rounded-lg bg-black/50 border border-slate-800 text-[11px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-red-500 outline-none resize-none font-sans"
                    disabled={isDeleting}
                  />
                </div>

                {deleteError && (
                  <p className="text-[10px] font-mono text-red-400 mt-1 uppercase w-full text-left bg-red-500/5 p-2 rounded border border-red-500/10">
                    {deleteError}
                  </p>
                )}

                <div className="flex gap-3 w-full pt-3 border-t border-white/5 mt-2">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-400 hover:text-white rounded-lg text-xs font-mono transition-all lowercase"
                  >
                    [cancel]
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-2 bg-red-650 hover:bg-red-600 border border-red-550 text-white rounded-lg text-xs font-display font-medium transition-all uppercase disabled:opacity-50"
                  >
                    {isDeleting ? 'DELETING...' : 'YES, DELETE ACCOUNT'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
