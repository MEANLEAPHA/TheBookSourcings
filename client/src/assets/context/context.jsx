import React, { createContext } from 'react';

export const AppContent = createContext();

export const ContextProvider = ({ children }) => {
  const des = "hi, mate";
  const name = "leap";
  const age = 98;
  const address = [
    { id: 1, street: 54, city: "PP" },
    { id: 2, street: 94, city: "SR" },
    { id: 3, street: 13, city: "KP" },
  ];
  const url = import.meta.env.API_URL; 

  return (
    <AppContent.Provider value={{ des, name, age, address, url }}>
      {children}
    </AppContent.Provider>
  );
};

export default ContextProvider;
