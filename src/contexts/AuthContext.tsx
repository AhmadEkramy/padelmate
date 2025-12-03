import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserData {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin';
  createdAt: Date | Timestamp;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        // Fetch user data from Firestore
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: data.displayName || firebaseUser.displayName || '',
              role: data.role || 'user',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt as Date) || new Date(),
            });
          } else {
            // If user document doesn't exist, try to create it
            // This might fail due to security rules, so we'll handle it gracefully
            try {
              const newUserData = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role: 'user',
                createdAt: serverTimestamp(),
              };
              await setDoc(userDocRef, newUserData);
              setUserData({
                ...newUserData,
                createdAt: new Date(),
              } as UserData);
            } catch (createError) {
              // If creation fails, set basic user data from auth
              console.warn('Could not create user document (may need security rules update):', createError);
              setUserData({
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || '',
                role: 'user',
                createdAt: new Date(),
              });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Set basic user data from auth even if Firestore fails
          setUserData({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            role: 'user',
            createdAt: new Date(),
          });
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;

    // Create user document in Firestore
    try {
      const userDocRef = doc(db, 'users', newUser.uid);
      const userData = {
        uid: newUser.uid,
        email: newUser.email || '',
        displayName: displayName || '',
        role: 'user',
        createdAt: serverTimestamp(),
      };

      await setDoc(userDocRef, userData);
    } catch (error) {
      // If Firestore write fails, the user is still created in Auth
      // The document will be created when they log in if security rules allow
      console.error('Error creating user document in Firestore:', error);
      throw error; // Re-throw so the UI can show an error message
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  const isAdmin = userData?.role === 'admin';

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      signIn, 
      signUp, 
      logout,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

