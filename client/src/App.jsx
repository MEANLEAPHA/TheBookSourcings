import React, { useEffect } from 'react';

import Header from '../src/assets/components/Header';
import Main from '../src/assets/components/Main';
import Footer from '../src/assets/components/Footer';
import {BrowserRouter, Routes, Route} from 'react-router-dom';

import './assets/style/App.css';

import { useState } from 'react';





const App = () =>{
    return(
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Home/>}></Route>
                <Route path='/home' element={<Home/>}></Route>

                <Route path='*' element={<NotFound/>}></Route>
            </Routes>
        </BrowserRouter>
    )
}
 
const Home = () =>{

    const [showMaxAside, setMaxAside] = useState(() => {
            return localStorage.getItem("maxAside") === "true";
        })
    
        useEffect(()=>{
            localStorage.setItem("maxAside", showMaxAside)
        },
        [showMaxAside]
        );
    
        const toggleAside = () =>{
                setMaxAside(prev => !prev)
        }
    
    
         const [darkMode, setDarkMode] = useState( () => {
                return localStorage.getItem("darkMode") === "true"; 
            });
        
            useEffect(
                () => {
                    if(darkMode){
                        document.body.classList.add("dark-theme")
                    }
                    else{
                        document.body.classList.remove("dark-theme")
                    }
                    localStorage.setItem("darkMode", darkMode);
                },
                [darkMode]
            );
         
            const toggleTheme = () =>{
                setDarkMode(prev => !prev)
            }
    return(
        <>
            <Header onToggleAside={toggleAside} onToggleTheme={toggleTheme} currentTheme={darkMode}/>
            <Main appendValue={showMaxAside}/>
            <Footer />
        </>
    )
}

const NotFound = () =>{
    return(
        <h1>
            Not Found
        </h1>
    )
}
export default App;

