import React, { createContext, useContext } from 'react';

export const AuthContext = createContext({
  session: null,
  role: null,
  loading: true,
  registrationPending: false,
  setRegistrationPending: () => {},
  planner_id: null,
  couple_id: null,
});
export const useAuth = () => useContext(AuthContext);
