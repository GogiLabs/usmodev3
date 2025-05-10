
import { User, Session } from '@supabase/supabase-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  session: Session | null;
  user: User | null;
  login: (email?: string, password?: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  showAuthRequiredToast: () => void;
  loading: boolean;
  updateUserProfile: (updates: { 
    display_name?: string, 
    avatar_url?: string, 
    theme_preference?: string 
  }) => Promise<void>;
}

export interface ProfileUpdate {
  display_name?: string;
  avatar_url?: string;
  theme_preference?: string;
}
