import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.jsx'


const main = document.getElementById('root');
const root = createRoot(main);
import ContextProvider from "./assets/context/context.jsx";

root.render(
  <>
    <StrictMode>
      <ContextProvider>
          <App />
      </ContextProvider>
    </StrictMode>
  </>

)
