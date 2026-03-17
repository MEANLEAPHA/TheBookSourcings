import React from "react";
import "../style/Header.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faMagnifyingGlass, faChevronDown, faMoon, faInbox, faSun, faArrowRightFromBracket, faFireFlameCurved, faMagnifyingGlassChart, faTimesCircle,faChartSimple, faGauge,faSliders, faFlag, faCommentDots, faBug, faUser, faBook, faNewspaper, faUsers, faComments, faComment, faBell, faFlagCheckered, faDatabase, faChartPie, faTowerBroadcast, faBan, faFeather, faBullhorn, faServer, faClockRotateLeft, faTrashCan, faChevronUp, faPlus} from "@fortawesome/free-solid-svg-icons";
import { faBookmark, faCircleQuestion, faCopy, faHeart, faMessage, faPenToSquare, faUserAlt} from "@fortawesome/free-regular-svg-icons";
import { useState, useRef, useEffect } from "react";
import {Link, useNavigate} from "react-router-dom";
const Header = ({onToggleAside, onToggleTheme, currentTheme}) => {
  const navigate = useNavigate();

  // Search DropDown Open and Closed
  const [dropDown, setDropDown] = useState("none");
  const wrapperRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropDown("none");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  
  // User Profile DropDown
  const handleDropDown = () => dropDown === "none" ? setDropDown("block") : setDropDown("none"); 

  return (
     <header>
      
      <div className="header-left header-children">
        <FontAwesomeIcon icon={faBars} className="bar-icon" onClick={onToggleAside}/>
        <div className="logo-div not-mobile-tool">
          <img
            src={
              currentTheme
                ? "https://the-book-sourcing-2025.s3.ap-southeast-1.amazonaws.com/community/1762309977977-otthorD.png"
                : "https://the-book-sourcing-2025.s3.ap-southeast-1.amazonaws.com/community/1762309925604-otthor.png"
            }
            className="logo-div-img not-mobile-tool"
            alt="Logo"
          />
        </div>
         <FontAwesomeIcon icon={faPlus} className="bar-icon mobile-tool fa-plus add-btn" onClick={onToggleAside} />
      </div>
      <div className="header-middle header-children">
        <Search />
        <img
            src={
              currentTheme
                ? "https://the-book-sourcing-2025.s3.ap-southeast-1.amazonaws.com/community/1762309977977-otthorD.png"
                : "https://the-book-sourcing-2025.s3.ap-southeast-1.amazonaws.com/community/1762309925604-otthor.png"
            }
            className="logo-div-img mobile-tool"
            alt="Logo"
          />
      </div>
      <div className="overlay-results"></div>
      <div className="header-right header-children">
        <FontAwesomeIcon icon={currentTheme ? faMoon : faSun} onClick={onToggleTheme} className="not-mobile-tool"/>
        <FontAwesomeIcon icon={faMagnifyingGlass} className="mobile-tool bar-icon"/>
        <FontAwesomeIcon icon={faBell} className='bar-icon'/>
        <div className="not-mobile-tool"><big style={{opacity:0.5}} className='not-mobile-tool'>|</big></div> 
        <div className="profile-div not-mobile-tool" ref={wrapperRef}>
          <img src="https://ih1.redbubble.net/image.2515682869.7692/raf,360x360,075,t,fafafa:ca443f4786.jpg" className="profile-div-img" />
          <button className='admin-info-div' onClick={handleDropDown}>
              <span>Hi, </span>
               <b> Meanleap Ha </b>
               <span>  <FontAwesomeIcon icon={ dropDown === "none" ? faChevronDown : faChevronUp} className="chevronDown-icon"/></span>
          </button>
          <ul className='admin-info-result' style={{display: dropDown}} >
                  <li onClick={() => navigate('/Login')}><FontAwesomeIcon icon={faUserAlt} /> View Account</li>
                  <li onClick={onToggleTheme}><FontAwesomeIcon icon={currentTheme ? faMoon : faSun} /> <span>{currentTheme ? "Dark Mode" : "Light Mode"}</span></li>
                  <li onClick={() => navigate('/Login')}><FontAwesomeIcon icon={faCircleQuestion} /> Help</li>
                  <hr className='admin-info-result-hr'/>
                  <li onClick={() => navigate('/Login')}><FontAwesomeIcon icon={faArrowRightFromBracket} /> Log out</li>  
              </ul>
        </div>
      </div>
    </header>
 
  );
};


const Search = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredResults, setFilteredResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
 
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  const searchQuery = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredResults([]);
      return;
    }

    const results = ResultsDisplay.filter(
      (item) =>
        item.title.toLowerCase().includes(value) ||
        item.description.toLowerCase().includes(value)
    );
    setFilteredResults(results);
  };

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fireQuery = () => {
      if(filteredResults.length > 0){
          navigate(filteredResults[0].link);
          const dataVisit = {title: filteredResults[0].title, link: filteredResults[0].link, icon: filteredResults[0].icon, description: filteredResults[0].description};
          const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
          const recentVisit = JSON.parse(localStorage.getItem('recentVisit')) || [];
          const updateHistory = [searchTerm, ...history].slice(0,5);
          localStorage.setItem("searchHistory", JSON.stringify(updateHistory));
          if(recentVisit.some((item) => item.link === filteredResults[0].link)){
            const remainData = recentVisit.filter((item) => item.link !== filteredResults[0].link);
            const moveToTop = [dataVisit, ...remainData].slice(0,5);
            localStorage.setItem("recentVisit", JSON.stringify(moveToTop));
             return;
          };
          const updateRecentVisit = [dataVisit, ...recentVisit].slice(0,5);
          localStorage.setItem("recentVisit", JSON.stringify(updateRecentVisit));
      } 
      else{
        if(searchTerm === '') return;
        navigate(`/${searchTerm}`);
        const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
        const updateHistory = [searchTerm, ...history].slice(0,5);
        localStorage.setItem("searchHistory", JSON.stringify(updateHistory));
      }
  }

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredResults([]);

    
    // setShowResults(false);
  };
  return (
     <>
        <div className="search-box not-mobile-tool" ref={wrapperRef}>
          <input
            type="text"
            id="search-input"
            value={searchTerm}  
            placeholder="Search for resource, products, page, docs, and more"
            onChange={searchQuery}
            onFocus={() => setShowResults(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault(); // prevent form submission if inside a form
                fireQuery();
              }
            }}
          />
          {searchTerm && (
          <button
            type="button"
            className="btn-clear-value"
            onClick={clearSearch}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
          </button>
        )}
          {showResults && (
            <div className="results">
              <TopResults results={filteredResults} />
              <HistorySearch />
              <RecentSearch />
              <PoplularSearch />
            </div>
          )}
        </div>
        <button className='search-button not-mobile-tool' onClick={fireQuery} >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
        </button>
      </>
  );
}

const RecentSearch = () => {
  const [recentData, setRecentData] = useState([]);
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("recentVisit")) || [];
    setRecentData(data);
  }, []);
  
   const handleDelete = (title) => {
      const updateData = recentData.filter((item) => item.title !== title);
       localStorage.setItem("recentVisit", JSON.stringify(updateData));
      setRecentData(updateData);
     
   }
   const handelClearAll = () => {
      const update = recentData.slice( recentData.length);
      localStorage.setItem("recentVisit", JSON.stringify(update));
      setRecentData(update);
   }

  if(recentData.length === 0){
    return null;
  }

  return(
    <div className="search-result-visit dev-res">
                <div className='label-flex'>
                  <label><FontAwesomeIcon icon={faMagnifyingGlassChart} /> Recent Searches</label>
                  <button onClick={handelClearAll}>Clear All</button>
                </div>
                <ul className='history-ul'>
                  {recentData.map((item, index) => (
                    <RecentCard key={index} icon={item.icon} link={item.link} description={item.description} title={item.title} onDelete={handleDelete}/>
                  ))}
                </ul>
      </div>
  )
}

const RecentCard = ({description,link,icon,title, onDelete}) => {
  const navigate = useNavigate();
   const handleClick = () => {
        navigate(link);
        const currentData = { title, link, icon, description };
         const recentVisit = JSON.parse(localStorage.getItem('recentVisit')) || [];
           if(recentVisit.some((item) => item.link === link)){
            const remainData = recentVisit.filter((item) => item.link !== link);
            const moveToTop = [currentData, ...remainData].slice(0,5);
            localStorage.setItem("recentVisit", JSON.stringify(moveToTop));
             return;
          };
          const updateRecentVisit = [currentData, ...recentVisit].slice(0,5);
          localStorage.setItem("recentVisit", JSON.stringify(updateRecentVisit));
    }
  return(
      <li className = 'history-card'  onClick={handleClick}>
        <div className='history-card-info'> 
              <div><FontAwesomeIcon icon={icon}  className='search-icon-query'/> </div>
            <div className = 'dev-info'>
                  <p className='query-title'>{title}</p>
                  <p className='query-description'>{description}</p>
           </div>
        </div>
           <FontAwesomeIcon icon={faTrashCan}  className='history-icon-trash' onClick={(e)=>{onDelete(title); e.stopPropagation()}}/> 
      </li>
  )
}
const HistorySearch = () => {
   const [historyData, setHistoryData] = useState([]);
   useEffect(() => {
      const data = JSON.parse(localStorage.getItem("searchHistory")) || [];
      setHistoryData(data);
   }, []);
 
   const handleDelete = (title) => {
      const updateData = historyData.filter((item) => item !== title);
       localStorage.setItem("searchHistory", JSON.stringify(updateData));
      setHistoryData(updateData);
     
   }
   const handelClearAll = () => {
      const update = historyData.slice( historyData.length);
      localStorage.setItem("searchHistory", JSON.stringify(update));
      setHistoryData(update);
   }

  if(historyData.length === 0){
    return null;
  }
  return(
      <div className="recent-search dev-res">
          <div className='label-flex'><label>Searches History</label> <button onClick={handelClearAll}>Clear All</button></div>
          <ul class='history-ul'>
            {historyData.map((item,index) => (
              <HistoryCard key={index} title={item} onDelete={handleDelete}/>
            ))}
          </ul>
      </div>
  )
  
}

const HistoryCard = ({title, onDelete}) => {
  const navigate = useNavigate();
   const handleClick = () => {
        navigate(`/${title}`);
        
         const recentVisit = JSON.parse(localStorage.getItem('searchHistory')) || [];
           if(recentVisit.some((item) => item === title)){
            const remainData = recentVisit.filter((item) => item !== title);
            const moveToTop = [title, ...remainData].slice(0,5);
            localStorage.setItem("searchHistory", JSON.stringify(moveToTop));
             return;
          };
          const updateRecentVisit = [title, ...recentVisit].slice(0,5);
          localStorage.setItem("searchHistory", JSON.stringify(updateRecentVisit));
    }
    return (
      <li className = 'history-card' onClick={handleClick}>
        <div className='history-card-info'>
            <FontAwesomeIcon icon={faClockRotateLeft}  className='search-icon-query'/> 
           
              <p className='query-title'>{title}</p>
           
        </div>
           <FontAwesomeIcon icon={faTrashCan}  className='history-icon-trash' onClick={(e)=>{onDelete(title); e.stopPropagation()}}/> 
      </li>
    )
 };
 const TopResults = ({results}) => {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className='search-result dev-res'>
      <label><FontAwesomeIcon icon={faChartSimple} /> Top Result for you</label>
      <ul className='query-result-ul'>
        {results.map(item => (
          <QueryCard 
            key={item.id} 
            icon={item.icon} 
            link={item.link} 
            description={item.description} 
            title={item.title} 
          />
        ))}
      </ul>
    </div>
  );
};

const QueryCard = ({id, icon, link, description, title}) => {
    const navigate = useNavigate();
    const handleClick = () => {
        navigate(link);
        const currentData = { id, title, link, icon, description };
         const recentVisit = JSON.parse(localStorage.getItem('recentVisit')) || [];
           if(recentVisit.some((item) => item.link === link)){
            const remainData = recentVisit.filter((item) => item.link !== link);
            const moveToTop = [currentData, ...remainData].slice(0,5);
            localStorage.setItem("recentVisit", JSON.stringify(moveToTop));
             return;
          };
          const updateRecentVisit = [currentData, ...recentVisit].slice(0,5);
          localStorage.setItem("recentVisit", JSON.stringify(updateRecentVisit));
    }
    return (
      <li className = 'query-card' onClick={handleClick}>
           <FontAwesomeIcon icon={icon}  className='search-icon-query'/> 
           <div className = 'dev-info'>
              <p className='query-title'>{title}</p>
              <p className='query-description'>{description}</p>
           </div>
      </li>
    )
 }

 const ResultsDisplay = [
  {id:1, icon:faChartPie, link:'/Dashboard', description: "Central hub with panels, widgets, charts, and key metrics.", title: "Dashboard" },
  {id:2, icon:faSliders, link:'/Maintenance', description: "System maintenance tools and configuration management.", title: "Maintenance" },
  {id:3, icon:faBug, link:'/Error', description: "Monitor and review issues, errors, and troubleshooting logs.", title: "Error" },
  {id:4, icon:faDatabase, link:'/Database', description: "Access and manage database records, pending updates, and edits.", title: "Database" },
  {id:5, icon:faUser, link:'/User', description: "View and manage user profiles, pending approvals, and edits.", title: "User" },
  {id:6, icon:faBook, link:'/Book', description: "Browse and update book records, pending entries, and edits.", title: "Book" },
  {id:7, icon:faComment, link:'/Comment', description: "Manage comments including pending submissions and edits.", title: "Comment" },
  {id:8, icon:faComments, link:'/Reply', description: "Review and edit replies, including pending and updated entries.", title: "Reply" },
  {id:9, icon:faUsers, link:'/Community', description: "Community management with pending requests and editable records.", title: "Community" },
  {id:10, icon:faCommentDots, link:'/Feedback', description: "Feedback dashboard with panels, widgets, and analytics charts.", title: "Feedback" },
  {id:11, icon:faFlag, link:'/Report', description: "Reporting tools with structured panels, widgets, and charts.", title: "Report" },
  {id:12, icon:faNewspaper, link:'/Article', description: "Article management with dashboards, widgets, and analytics.", title: "Article" },
  {id:14, icon:faBell, link:'/Notification', description: "Notification center with panels, widgets, and activity charts.", title: "Notification" }
];


 const PoplularSearch = () => {
    return(
        <div className='popular-search dev-res'>
               <label>  <FontAwesomeIcon icon={faFireFlameCurved} /> Popular Searches</label>
          
               <ul className='popular-ul'>
                    {PopularResult.map(item => (
                      <PopularCard key={item.id} icon={item.icon} description={item.description} title={item.title} link={item.link}/>
                    ))}
               </ul>
        </div>
    )
 }
 const PopularCard = ({icon, link, description, title}) => {
    const navigate = useNavigate();
    return (
      <li className = 'pop-card' onClick={()=>navigate(link)}>
           <FontAwesomeIcon icon={icon}  className='search-icon-query'/> 
           <div className = 'dev-info'>
              <p className='query-title'>{title}</p>
              <p className='query-description'>{description}</p>
           </div>
      </li>
    )
 }


 const PopularResult = [
  {id:1, icon:faBan, link:'/Dashboard', description: "Central hub with panels, widgets, charts, and key metrics.", title: "Pending User" },
  {id:2, icon:faFeather, link:'/Maintenance', description: "System maintenance tools and configuration management.", title: "Upload Article" },
  {id:3, icon:faBullhorn, link:'/Error', description: "Monitor and review issues, errors, and troubleshooting logs.", title: "Alert System Notification" },
  {id:4, icon:faServer, link:'/Database', description: "Access and manage database records, pending updates, and edits.", title: "Cloud Storage" }
];





export default Header;
