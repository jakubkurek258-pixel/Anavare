import { COMPANIONS_AVATARS } from '../data/rpgAssets';
import { useAuth } from '../context/AuthContext';
import { Check, User } from 'lucide-react';
import AvatarImage from './AvatarImage';

interface AvatarPickerProps {
  currentAvatar: string;
  onSelect: (url: string) => void;
}

export default function AvatarPicker({ currentAvatar, onSelect }: AvatarPickerProps) {
  const { setProfileAvatar } = useAuth();

  const handleSelect = async (url: string) => {
    onSelect(url);
    try {
      await setProfileAvatar(url);
    } catch (e) {
      console.error("Failed to commit avatar swap:", e);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <User className="w-4 h-4 text-indigo-400" />
        <h3 className="font-display font-semibold text-sm tracking-wide text-white">
          SELECT COMPANION AVATAR
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4 font-sans">
        Choose your digital identity and companion interface class. Your profile avatar will sync across rankings and feed.
      </p>
      <div className="grid grid-cols-6 gap-3">
        {COMPANIONS_AVATARS.map((avatar) => {
          const isSelected = currentAvatar === avatar.url;
          return (
            <button
              key={avatar.id}
              onClick={() => handleSelect(avatar.url)}
              id={`avatar-selector-${avatar.id}`}
              className={`relative rounded-lg overflow-hidden group border-2 transition-all aspect-square outline-none ${
                isSelected 
                  ? 'border-indigo-500 scale-105 shadow-[0_0_12px_rgba(99,102,241,0.4)]' 
                  : 'border-slate-800 hover:border-slate-600'
              }`}
            >
              <AvatarImage
                src={avatar.url}
                alt={avatar.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[10px] text-white font-mono scale-90 truncate px-1">
                  {avatar.name.split(' ')[0]}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-1 right-1 bg-indigo-500 text-white p-0.5 rounded-full scale-90">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
