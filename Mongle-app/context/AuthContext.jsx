import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({ session: null, role: null, loading: true });
export const useAuth = () => useContext(AuthContext);
