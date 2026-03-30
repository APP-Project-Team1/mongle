import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({
  session: null,
  role: null,
  loading: true,
  registrationPending: false,
  setRegistrationPending: () => {},
});
export const useAuth = () => useContext(AuthContext);
