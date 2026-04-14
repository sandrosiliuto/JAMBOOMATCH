/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Heart, 
  X, 
  Instagram, 
  Flame, 
  MessageCircle, 
  Camera, 
  LogOut,
  Sparkles,
  User as UserIcon
} from 'lucide-react';

// --- Types ---

interface Asistente {
  _id: string;
  nombre: string;
  instagram: string;
  fotoURL: string; // Base64
  likesDados: string[];
}

// --- Components ---

const Button = ({ children, onClick, className = '', variant = 'fuchsia', disabled = false }: any) => {
  const variants: any = {
    fuchsia: 'bg-neon-fuchsia text-white neon-glow-fuchsia hover:bg-opacity-80',
    cyan: 'bg-neon-cyan text-black neon-glow-cyan hover:bg-opacity-80',
    outline: 'border border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-black',
    ghost: 'bg-transparent text-white hover:bg-white/10'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', required = false }: any) => (
  <div className="flex flex-col gap-2 w-full">
    {label && <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="bg-night-card border border-white/10 rounded-2xl px-5 py-4 focus:border-neon-cyan outline-none transition-all text-white placeholder:text-gray-700"
    />
  </div>
);

// --- Views ---

const RegistrationView = ({ onComplete }: { onComplete: (user: Asistente) => void }) => {
  const [nombre, setNombre] = useState('');
  const [instagram, setInstagram] = useState('');
  const [fotoURL, setFotoURL] = useState<string | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoURL(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !instagram || !fotoURL || !acceptedTerms) return;

    setLoading(true);
    try {
      const res = await fetch('/api/asistentes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, instagram: instagram.replace('@', ''), fotoURL })
      });
      const user = await res.json();
      localStorage.setItem('jamboo_user_id', user._id);
      onComplete(user);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 max-w-md mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-6xl font-black italic neon-text-cyan mb-2 tracking-tighter">JAMBOO</h1>
        <p className="text-neon-fuchsia font-black tracking-[0.3em] uppercase text-xs">Match & Connect</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full space-y-8 glass-card p-10 rounded-[40px] shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          <div 
            className="relative w-36 h-36 rounded-[32px] border-2 border-dashed border-neon-cyan flex items-center justify-center overflow-hidden bg-black/50 cursor-pointer hover:bg-black/70 transition-all group"
            onClick={() => document.getElementById('photo-input')?.click()}
          >
            {fotoURL ? (
              <img src={fotoURL} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <Camera className="w-10 h-10 text-neon-cyan group-hover:scale-110 transition-transform" />
            )}
            <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>
          <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Sube tu foto de fiesta</p>
        </div>

        <Input label="Nombre o Apodo" value={nombre} onChange={setNombre} placeholder="Ej: Alex" required />
        <Input label="Instagram" value={instagram} onChange={setInstagram} placeholder="@usuario" required />

        <label className="flex items-start gap-4 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={acceptedTerms} 
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 accent-neon-cyan w-5 h-5"
          />
          <span className="text-[10px] text-gray-500 leading-relaxed uppercase font-black tracking-wider group-hover:text-gray-400 transition-colors">
            Acepto que mi foto y nombre sean visibles para los asistentes de JAMBOO, y que mis datos serán eliminados al terminar el evento.
          </span>
        </label>

        <Button disabled={loading || !nombre || !instagram || !fotoURL || !acceptedTerms} className="w-full">
          {loading ? 'Entrando...' : 'ENTRAR A LA FIESTA'}
        </Button>
      </form>
    </div>
  );
};

const SwipeCard = ({ user, onSwipe }: { user: Asistente; onSwipe: (direction: 'left' | 'right') => void; key?: string }) => {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);
  const likeOpacity = useTransform(x, [50, 150], [0, 1]);
  const nopeOpacity = useTransform(x, [-50, -150], [0, 1]);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100) onSwipe('right');
    else if (info.offset.x < -100) onSwipe('left');
  };

  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="swipe-card"
    >
      <div className="relative w-full h-full rounded-[40px] overflow-hidden border border-white/10 bg-night-card shadow-2xl">
        <img src={user.fotoURL} alt={user.nombre} className="w-full h-full object-cover pointer-events-none" referrerPolicy="no-referrer" />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
        
        <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
          <h2 className="text-4xl font-black text-white mb-2 uppercase italic tracking-tighter">{user.nombre}</h2>
          <div className="flex items-center gap-2 text-neon-cyan">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Live at JAMBOO</span>
          </div>
        </div>

        {/* Indicators */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-12 left-12 border-4 border-neon-cyan text-neon-cyan px-6 py-3 rounded-2xl font-black text-5xl rotate-[-20deg] uppercase tracking-tighter neon-glow-cyan">
          FIRE
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-12 right-12 border-4 border-neon-fuchsia text-neon-fuchsia px-6 py-3 rounded-2xl font-black text-5xl rotate-[20deg] uppercase tracking-tighter neon-glow-fuchsia">
          NEXT
        </motion.div>
      </div>
    </motion.div>
  );
};

const SwipeView = ({ currentUser, onMatch }: { currentUser: Asistente; onMatch: (user: Asistente) => void }) => {
  const [users, setUsers] = useState<Asistente[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/asistentes?exclude=${currentUser._id}`);
        const data = await res.json();
        setUsers(data.sort(() => Math.random() - 0.5));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentUser._id]);

  const handleSwipe = async (direction: 'left' | 'right') => {
    const targetUser = users[currentIndex];
    if (!targetUser) return;

    if (direction === 'right') {
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromId: currentUser._id, toId: targetUser._id })
        });
        const { match } = await res.json();
        if (match) onMatch(targetUser);
      } catch (error) {
        console.error(error);
      }
    }

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Flame className="w-16 h-16 text-neon-cyan animate-pulse" /></div>;

  const currentCardUser = users[currentIndex];

  return (
    <div className="flex flex-col h-full p-4">
      <div className="relative flex-1 max-w-sm mx-auto w-full">
        <AnimatePresence>
          {currentCardUser ? (
            <SwipeCard key={currentCardUser._id} user={currentCardUser} onSwipe={handleSwipe} />
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="flex flex-col items-center justify-center h-full text-center p-12"
            >
              <Sparkles className="w-20 h-20 text-neon-fuchsia mb-6 animate-pulse" />
              <h3 className="text-3xl font-black uppercase italic mb-4 tracking-tighter">¡FIESTA TOTAL!</h3>
              <p className="text-gray-600 font-black uppercase text-[10px] tracking-[0.2em] leading-relaxed">
                Has visto a todos los invitados. <br />¡Ve a por una copa y vuelve luego!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {currentCardUser && (
        <div className="flex justify-center gap-10 py-10">
          <button 
            onClick={() => handleSwipe('left')}
            className="w-20 h-20 rounded-full glass-card flex items-center justify-center text-neon-fuchsia hover:scale-110 active:scale-90 transition-all shadow-xl border-neon-fuchsia/20"
          >
            <X className="w-10 h-10" />
          </button>
          <button 
            onClick={() => handleSwipe('right')}
            className="w-20 h-20 rounded-full glass-card flex items-center justify-center text-neon-cyan hover:scale-110 active:scale-90 transition-all shadow-xl border-neon-cyan/20"
          >
            <Flame className="w-10 h-10" />
          </button>
        </div>
      )}
    </div>
  );
};

const MatchesView = ({ currentUser }: { currentUser: Asistente }) => {
  const [matches, setMatches] = useState<Asistente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch(`/api/matches?userId=${currentUser._id}`);
        const data = await res.json();
        setMatches(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();
  }, [currentUser._id]);

  if (loading) return <div className="flex items-center justify-center h-full"><Flame className="w-16 h-16 text-neon-fuchsia animate-pulse" /></div>;

  return (
    <div className="flex flex-col h-full p-8 overflow-y-auto">
      <h2 className="text-4xl font-black italic neon-text-fuchsia mb-10 uppercase tracking-tighter">MIS MATCHES 🔥</h2>
      
      {matches.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
          <Heart className="w-20 h-20 mb-6" />
          <p className="font-black uppercase text-[10px] tracking-[0.3em]">Aún no hay fuego mutuo. <br />¡Sigue buscando!</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map((match) => (
            <motion.div 
              key={match._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[32px] p-5 flex items-center gap-5 border-white/5"
            >
              <img src={match.fotoURL} alt={match.nombre} className="w-20 h-20 rounded-2xl object-cover border-2 border-neon-fuchsia shadow-lg" referrerPolicy="no-referrer" />
              <div className="flex-1">
                <h3 className="font-black uppercase italic text-xl tracking-tighter">{match.nombre}</h3>
                <div className="flex items-center gap-2 text-neon-cyan text-[10px] font-black tracking-widest">
                  <Instagram className="w-3 h-3" />
                  <span>@{match.instagram}</span>
                </div>
              </div>
              <a 
                href={`https://instagram.com/${match.instagram}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-neon-fuchsia text-white p-4 rounded-2xl neon-glow-fuchsia hover:scale-105 active:scale-95 transition-all"
              >
                <MessageCircle className="w-6 h-6" />
              </a>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const MatchModal = ({ user, onClose }: { user: Asistente; onClose: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }} 
    animate={{ opacity: 1 }} 
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/95 backdrop-blur-md"
  >
    <motion.div 
      initial={{ scale: 0.5, rotate: -10 }}
      animate={{ scale: 1, rotate: 0 }}
      className="glass-card border-2 border-neon-fuchsia p-10 rounded-[50px] text-center max-w-sm w-full relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-neon-fuchsia/20 to-transparent pointer-events-none" />
      
      <Flame className="w-20 h-20 text-neon-fuchsia mx-auto mb-6 animate-bounce" />
      <h2 className="text-6xl font-black italic text-white mb-4 neon-text-fuchsia tracking-tighter">MATCH!</h2>
      <p className="text-gray-500 font-black uppercase text-[10px] tracking-[0.2em] mb-10">¡A {user.nombre} también le gustas!</p>
      
      <div className="relative w-56 h-56 mx-auto mb-10">
        <img src={user.fotoURL} alt={user.nombre} className="w-full h-full object-cover rounded-[40px] border-4 border-neon-fuchsia shadow-[0_0_30px_rgba(255,0,255,0.6)]" referrerPolicy="no-referrer" />
      </div>

      <div className="space-y-5">
        <a 
          href={`https://instagram.com/${user.instagram}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block w-full bg-neon-fuchsia text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] neon-glow-fuchsia hover:bg-opacity-80 transition-all"
        >
          Mándale un DM
        </a>
        <button onClick={onClose} className="text-gray-600 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
          Seguir buscando
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// --- Main App ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<Asistente | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'swipe' | 'matches'>('swipe');
  const [matchModalUser, setMatchModalUser] = useState<Asistente | null>(null);

  useEffect(() => {
    const userId = localStorage.getItem('jamboo_user_id');
    if (userId) {
      // Fetch user profile from API
      const fetchProfile = async () => {
        try {
          const res = await fetch(`/api/asistentes`);
          const users = await res.json();
          const me = users.find((u: Asistente) => u._id === userId);
          if (me) {
            setCurrentUser(me);
          } else {
            localStorage.removeItem('jamboo_user_id');
          }
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-night-black flex items-center justify-center">
        <Flame className="w-20 h-20 text-neon-cyan animate-pulse" />
      </div>
    );
  }

  if (!currentUser) {
    return <RegistrationView onComplete={setCurrentUser} />;
  }

  return (
    <div className="min-h-screen bg-night-black flex flex-col max-w-md mx-auto relative overflow-hidden border-x border-white/5">
      {/* Header */}
      <header className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl border-2 border-neon-cyan overflow-hidden shadow-lg">
            <img src={currentUser.fotoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h1 className="text-3xl font-black italic neon-text-cyan tracking-tighter">JAMBOO</h1>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('jamboo_user_id');
            setCurrentUser(null);
          }} 
          className="text-gray-600 hover:text-neon-fuchsia transition-colors"
        >
          <LogOut className="w-7 h-7" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {activeTab === 'swipe' ? (
          <SwipeView currentUser={currentUser} onMatch={setMatchModalUser} />
        ) : (
          <MatchesView currentUser={currentUser} />
        )}
      </main>

      {/* Navigation */}
      <nav className="p-8 bg-black/80 backdrop-blur-xl border-t border-white/5 flex justify-around items-center">
        <button 
          onClick={() => setActiveTab('swipe')}
          className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'swipe' ? 'text-neon-cyan scale-110' : 'text-gray-700'}`}
        >
          <Flame className="w-8 h-8" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Fuego</span>
        </button>
        <button 
          onClick={() => setActiveTab('matches')}
          className={`flex flex-col items-center gap-2 transition-all ${activeTab === 'matches' ? 'text-neon-fuchsia scale-110' : 'text-gray-700'}`}
        >
          <div className="relative">
            <Heart className="w-8 h-8" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-fuchsia rounded-full border-2 border-night-black" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Matches</span>
        </button>
      </nav>

      {/* Match Modal */}
      <AnimatePresence>
        {matchModalUser && (
          <MatchModal user={matchModalUser} onClose={() => setMatchModalUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
