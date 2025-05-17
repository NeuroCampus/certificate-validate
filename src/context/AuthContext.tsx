import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

interface UserProfile {
  department: string;
  join_date: string;
  current_rank: number;
  total_weightage: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  login: (token: string, user: User, profile?: UserProfile) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('authUser');
    const storedProfile = localStorage.getItem('authProfile');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      axios.defaults.headers.common['Authorization'] = `Token ${storedToken}`;
      
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile));
      } else {
        // Fetch profile if not stored
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/profile/`, {
          headers: { Authorization: `Token ${storedToken}` }
        })
          .then(response => {
            setProfile(response.data.profile);
            localStorage.setItem('authProfile', JSON.stringify(response.data.profile));
          })
          .catch(error => {
            console.error('Failed to fetch profile:', error);
            logout(); // Clear auth if profile fetch fails
          });
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User, newProfile?: UserProfile) => {
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile || null);
    localStorage.setItem('authToken', newToken);
    localStorage.setItem('authUser', JSON.stringify(newUser));
    if (newProfile) {
      localStorage.setItem('authProfile', JSON.stringify(newProfile));
    }
    axios.defaults.headers.common['Authorization'] = `Token ${newToken}`;
  };

  const logout = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/logout/`,
        {},
        { headers: { Authorization: `Token ${token}` } }
      );
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setToken(null);
      setUser(null);
      setProfile(null);
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('authProfile');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, profile, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}