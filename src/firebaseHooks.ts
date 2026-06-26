import { useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { collection, doc, onSnapshot, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { Task, UserProfile } from './types/database.types';

export function useFirebase() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [calendarEnclave, setCalendarEnclave] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      setTasks([]);
      setCalendarEnclave([]);
      setUserProfile(null);
      return;
    }

    const tasksQuery = query(collection(db, 'tasks'), where('user_id', '==', user.uid));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      const newTasks: Task[] = [];
      snapshot.forEach(doc => newTasks.push(doc.data() as Task));
      setTasks(newTasks);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    const calQuery = query(collection(db, 'calendarEvents'), where('user_id', '==', user.uid));
    const unsubCal = onSnapshot(calQuery, (snapshot) => {
      const newCal: any[] = [];
      snapshot.forEach(doc => newCal.push(doc.data()));
      setCalendarEnclave(newCal);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'calendarEvents');
    });

    const userProfileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(userProfileRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data() as UserProfile);
      } else {
        const defaultProfile: UserProfile = {
          user_id: user.uid,
          hasCompletedOnboarding: false,
          isNewUser: true,
          habits: {
            algorithms: { timestamps: [], activeStreak: 0, maxStreak: 0 },
            docs: { timestamps: [], activeStreak: 0, maxStreak: 0 },
            commits: { timestamps: [], activeStreak: 0, maxStreak: 0 },
          }
        };
        setUserProfile(defaultProfile);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
    });

    return () => {
      unsubTasks();
      unsubCal();
      unsubProfile();
    };
  }, [user, authReady]);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User cancelled the sign-in popup, ignore
        console.log('Sign-in popup was cancelled by the user.');
      } else {
        console.error('Sign-in error:', error);
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const saveTask = async (task: Task) => {
    if (!user) return;
    try {
      const taskWithUser = { ...task, user_id: user.uid };
      await setDoc(doc(db, 'tasks', task.id), taskWithUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `tasks/${task.id}`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'tasks', taskId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `tasks/${taskId}`);
    }
  };

  const saveCalendarEvent = async (event: any) => {
    if (!user) return;
    try {
      const eventWithUser = { ...event, user_id: user.uid };
      await setDoc(doc(db, 'calendarEvents', event.id), eventWithUser);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `calendarEvents/${event.id}`);
    }
  };

  const deleteCalendarEvent = async (eventId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'calendarEvents', eventId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `calendarEvents/${eventId}`);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    if (!user) return;
    try {
      const sanitizedProfile = Object.fromEntries(
        Object.entries(profile).filter(([_, v]) => v !== undefined)
      ) as UserProfile;
      await setDoc(doc(db, 'users', user.uid), sanitizedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return {
    user,
    authReady,
    isSigningIn,
    signIn,
    signOut,
    tasks,
    calendarEnclave,
    userProfile,
    saveTask,
    deleteTask,
    saveCalendarEvent,
    deleteCalendarEvent,
    saveUserProfile
  };
}
