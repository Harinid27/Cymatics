import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UserData {
  name: string;
  username: string;
  email: string;
  bio: string;
  links: string[];
  profileImage?: string;
}

interface UserContextType {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
  setProfileImage: (imageUri: string) => void;
}

const defaultUserData: UserData = {
  name: 'Vijay Yasodharan',
  username: '@vy',
  email: 'vjyaso@cymatics.in',
  bio: 'The one and only Yaso.',
  links: ['Cymatics.in'],
  profileImage: undefined,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [userData, setUserData] = useState<UserData>(defaultUserData);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData(prev => ({ ...prev, ...data }));
  };

  const setProfileImage = (imageUri: string) => {
    setUserData(prev => ({ ...prev, profileImage: imageUri }));
  };

  return (
    <UserContext.Provider value={{ userData, updateUserData, setProfileImage }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
