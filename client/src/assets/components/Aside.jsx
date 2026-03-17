// import React from "react";

// import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import { faGauge,faSliders, faFlag, faCommentDots, faBug, faUser, faBook, faNewspaper, faUsers, faComments, faComment, faBell, faFlagCheckered, faDatabase, faChartPie, faTowerBroadcast} from "@fortawesome/free-solid-svg-icons";
// import "../style/Aside.css";
// import {Link, useNavigate} from "react-router-dom";



// const Aside = (props) =>{
//     return(
//         props.append ? <MaxAside /> : <SmallAside />
//     )
// }



// const MaxAside = () => {
//     return(
//         <aside className="MaxAside">
//             <menu className="MaxMenu">
//                 <AppendMain />
//                 <AppendReportAndFeedback />
//                 <AppendUserInsight />
//                 <AppendBroadcast />
//             </menu>
//         </aside>
//     )
// }

// const SmallAside = () => {
//     return(
//         <aside className="minAside">
//             <menu className="minMenu">
//                <AppendMinAside />
//             </menu>
//         </aside>
//     )
// }

// const MinInfo = [
//     {
//         id:1, a: '/DashBoard', icon: faChartPie, subMenu: [
//             {id:1, a: '#', icon: faSliders, classNameIcon: 'icon-aside', label: 'Mantaince', title: 'Dashboard'},
//             {id:2, a: '#', icon: faGauge, classNameIcon: 'icon-aside', label: 'Mantaince'}
//         ]
//     },
//     {
//         id:2, a: '/Error', icon: faBug, subMenu: [
//             {id:1, a: '#', icon: faSliders, classNameIcon: 'icon-aside', title: 'Bug&Issue'},
//             {id:2, a: '#', icon: faGauge, classNameIcon: 'icon-aside'}
//         ]
//     },
//     {
//         id:3, a: '/UserInsight', icon: faDatabase, subMenu: [
//             {
//                 id:1, a: '/User', icon: faUser, label: 'User', classNameIcon: 'icon-aside', title: 'User Insight'
//             },
//             {
//                 id:2, a: '/Community', icon: faUsers, label: 'Community', classNameIcon: 'icon-aside'
//             },
//             {
//                 id:3, a: '/Book', icon: faBook, label: 'Book', classNameIcon: 'icon-aside'
//             },
//             {
//                 id:4, a: '/Comment', icon: faComment, label: 'Comment', classNameIcon: 'icon-aside'
//             },
//             {
//                 id:5, a: '/Reply', icon: faComments, label: 'Reply', classNameIcon: 'icon-aside'
//             }
//         ]
//     },
//     {
//         id:4, a: '/FeedbackAndReport', icon: faFlagCheckered, subMenu: [
//             {
//                 id:1, a: '/Feedback', icon: faCommentDots, label: 'Feedback', classNameIcon: 'icon-aside', title: 'Report&Feedback'
//             },
//             {
//                 id:2, a: '/Report', icon: faFlag, label: 'Report', classNameIcon: 'icon-aside'
//             }
//         ]
//     },
//     {
//         id:5, a: '/Broadcast', icon: faTowerBroadcast, subMenu: [
//             {
//                 id:1, a: '/Notification', icon: faBell, label: 'Notification', classNameIcon: 'icon-aside', title: 'Broadcast'
//             },
//             {
//                 id:2, a: '/Article', icon: faNewspaper, label: 'Article', classNameIcon: 'icon-aside'
//             }
//         ]
//     }
// ]
// const MinCard = ({a, icon, subMenu}) => {
//     const navigate = useNavigate();
//     return(
//             <li className="nav-item">
//                 <button onClick={() => navigate(a)}>
//                          <FontAwesomeIcon icon={icon} id='sub-icon'/> 
//                 </button>
//                 <ul className="sub-menu">
//                         {subMenu.map(item => (
//                             <MiniCard key={item.id} {...item} />
//                         ))}
//                 </ul>
//             </li>
//     )
// }

// const AppendMinAside = () =>{
//     return(
//         MinInfo.map(item => (
//             <MinAside key={item.id} {...item} />
//         ))
//     )
// };
// const MinAside = ({a, icon, classNameIcon, subMenu})=> {
//     return(
//            <MinCard a={a} icon={icon} classNameIcon={classNameIcon} subMenu={subMenu}/>
//     )
// };



// const Card = ({a, icon, label, classNameIcon}) =>{
//     const navigate = useNavigate();
//     return(
//         <li>
//             <button onClick={() => navigate(a)} >
//                 <div>
//                     <FontAwesomeIcon icon={icon} className={classNameIcon}/> 
//                 </div>
//                 <div>
//                     {label}
//                 </div>
                    
//             </button>
//           </li>
//     )
// };

// const MiniCard = ({a, icon, label, classNameIcon, title}) =>{
//     const navigate = useNavigate();
//     return(
//         <>
//             <p>{title}</p>
            
//             <li className='sub-menu-li'>
//                 <button onClick={() => navigate(a)} className='sub-menu-btn'>
//                     <div>
//                         <FontAwesomeIcon icon={icon} className={classNameIcon}/> 
//                     </div>
//                     <div>
//                         {label}
//                     </div>
                        
//                 </button>
//             </li>
//         </>
//     )
// }; 
// const Mains= [
//     {
//         id:1, a: '/Dashboard', icon: faChartPie, label: 'Dashboard', classNameIcon: 'icon-aside'
//     },
//     {
//         id:2, a: '/Maintenance', icon: faSliders, label: 'Maintenance', classNameIcon: 'icon-aside'
//     },
//     {
//         id:3, a: '/Error', icon: faBug, label: 'Error', classNameIcon: 'icon-aside'
//     }
// ];
// const AppendMain = () =>{
//     return(
//         Mains.map(item => (
//             <Main key={item.id} {...item} />
//         ))
//     ) 
// };
// const Main = ({a, icon, label, classNameIcon})=> {
//     return(
//            <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon}/>
//     )
// };

// const ReportAndFeedbacks= [
//     {
//         id:1, a: '/Feedback', icon: faCommentDots, label: 'Feedback', classNameIcon: 'icon-aside'
//     },
//     {
//         id:2, a: '/Report', icon: faFlag, label: 'Report', classNameIcon: 'icon-aside'
//     }
// ];

// const AppendReportAndFeedback = () =>{
//     return(
//         <>
//         <label>Reports & Feedback </label>
//         {ReportAndFeedbacks.map(item => (
//             <ReportAndFeedback key={item.id} {...item} />
//         ))}
//         </>
//     )
// };

// const ReportAndFeedback = ({a, icon, label, classNameIcon})=> {
//     return(
//           <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
//     )
// };

// const UserInsights= [
//     {
//         id:1, a: '/User', icon: faUser, label: 'User', classNameIcon: 'icon-aside'
//     },
//     {
//         id:2, a: '/Community', icon: faUsers, label: 'Community', classNameIcon: 'icon-aside'
//     },
//     {
//         id:3, a: '/Book', icon: faBook, label: 'Book', classNameIcon: 'icon-aside'
//     },
//     {
//         id:4, a: '/Comment', icon: faComment, label: 'Comment', classNameIcon: 'icon-aside'
//     },
//     {
//         id:5, a: '/Reply', icon: faComments, label: 'Reply', classNameIcon: 'icon-aside'
//     }
// ];

// const AppendUserInsight = () =>{
//     return(
//         <>
//         <label>User Insight</label>
//         {UserInsights.map(item => (
//             <UserInsight key={item.id} {...item} />
//         ))}
//         </>
//     )
// };

// const UserInsight = ({a, icon, label, classNameIcon})=> {
//     return(
//           <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
//     )
// };


// const Broadcasts= [
//     {
//         id:1, a: '/Notification', icon: faBell, label: 'Notification', classNameIcon: 'icon-aside'
//     },
//     {
//         id:2, a: '/Article', icon: faNewspaper, label: 'Article', classNameIcon: 'icon-aside'
//     }
// ];

// const AppendBroadcast = () =>{
//     return(
//         <>
//         <label>Broadcast</label>
//         {Broadcasts.map(item => (
//             <Broadcast key={item.id} {...item} />
//         ))}
//         </>
//     )
// };

// const Broadcast = ({a, icon, label, classNameIcon})=> {
//     return(
//           <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
//     )
// };


// export default Aside;

import React, { useEffect, useState } from "react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGauge,faSliders, faFlag, faCommentDots, faBug, faUser, faBook, faNewspaper, faUsers, faComments, faComment, faBell, faFlagCheckered, faDatabase, faChartPie, faTowerBroadcast} from "@fortawesome/free-solid-svg-icons";
import "../style/Aside.css";
import {useNavigate} from "react-router-dom";

const Aside = (props) => {

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // ✅ MOBILE: only MaxAside (display block/none)
    if (isMobile) {
        return (
            <div style={{ display: props.append ? "block" : "none" }}>
                <MaxAside />
            </div>
        );
    }

    // ✅ DESKTOP: your original logic
    return (
        props.append ? <MaxAside /> : <SmallAside />
    );
};


const MaxAside = () => {
    return(
        <aside className="MaxAside">
            <menu className="MaxMenu">
                <AppendMain />
                <AppendReportAndFeedback />
                <AppendUserInsight />
                <AppendBroadcast />
            </menu>
        </aside>
    )
}

const SmallAside = () => {
    return(
        <aside className="minAside">
            <menu className="minMenu">
               <AppendMinAside />
            </menu>
        </aside>
    )
}

const MinInfo = [
    {
        id:1, a: '/DashBoard', icon: faChartPie, subMenu: [
            {id:1, a: '#', icon: faSliders, classNameIcon: 'icon-aside', label: 'Mantaince', title: 'Dashboard'},
            {id:2, a: '#', icon: faGauge, classNameIcon: 'icon-aside', label: 'Mantaince'}
        ]
    },
    {
        id:2, a: '/Error', icon: faBug, subMenu: [
            {id:1, a: '#', icon: faSliders, classNameIcon: 'icon-aside', title: 'Bug&Issue'},
            {id:2, a: '#', icon: faGauge, classNameIcon: 'icon-aside'}
        ]
    },
    {
        id:3, a: '/UserInsight', icon: faDatabase, subMenu: [
            {id:1, a: '/User', icon: faUser, label: 'User', classNameIcon: 'icon-aside', title: 'User Insight'},
            {id:2, a: '/Community', icon: faUsers, label: 'Community', classNameIcon: 'icon-aside'},
            {id:3, a: '/Book', icon: faBook, label: 'Book', classNameIcon: 'icon-aside'},
            {id:4, a: '/Comment', icon: faComment, label: 'Comment', classNameIcon: 'icon-aside'},
            {id:5, a: '/Reply', icon: faComments, label: 'Reply', classNameIcon: 'icon-aside'}
        ]
    },
    {
        id:4, a: '/FeedbackAndReport', icon: faFlagCheckered, subMenu: [
            {id:1, a: '/Feedback', icon: faCommentDots, label: 'Feedback', classNameIcon: 'icon-aside', title: 'Report&Feedback'},
            {id:2, a: '/Report', icon: faFlag, label: 'Report', classNameIcon: 'icon-aside'}
        ]
    },
    {
        id:5, a: '/Broadcast', icon: faTowerBroadcast, subMenu: [
            {id:1, a: '/Notification', icon: faBell, label: 'Notification', classNameIcon: 'icon-aside', title: 'Broadcast'},
            {id:2, a: '/Article', icon: faNewspaper, label: 'Article', classNameIcon: 'icon-aside'}
        ]
    }
]

const MinCard = ({a, icon, subMenu}) => {
    const navigate = useNavigate();
    return(
        <li className="nav-item">
            <button onClick={() => navigate(a)}>
                <FontAwesomeIcon icon={icon} id='sub-icon'/> 
            </button>
            <ul className="sub-menu">
                {subMenu.map(item => (
                    <MiniCard key={item.id} {...item} />
                ))}
            </ul>
        </li>
    )
}

const AppendMinAside = () =>{
    return(
        MinInfo.map(item => (
            <MinAside key={item.id} {...item} />
        ))
    )
};

const MinAside = ({a, icon, classNameIcon, subMenu})=> {
    return(
        <MinCard a={a} icon={icon} classNameIcon={classNameIcon} subMenu={subMenu}/>
    )
};

const Card = ({a, icon, label, classNameIcon}) =>{
    const navigate = useNavigate();
    return(
        <li>
            <button onClick={() => navigate(a)} >
                <div>
                    <FontAwesomeIcon icon={icon} className={classNameIcon}/> 
                </div>
                <div>
                    {label}
                </div>
            </button>
        </li>
    )
};

const MiniCard = ({a, icon, label, classNameIcon, title}) =>{
    const navigate = useNavigate();
    return(
        <>
            <p>{title}</p>
            <li className='sub-menu-li'>
                <button onClick={() => navigate(a)} className='sub-menu-btn'>
                    <div>
                        <FontAwesomeIcon icon={icon} className={classNameIcon}/> 
                    </div>
                    <div>
                        {label}
                    </div>
                </button>
            </li>
        </>
    )
}; 

const Mains= [
    { id:1, a: '/Dashboard', icon: faChartPie, label: 'Dashboard', classNameIcon: 'icon-aside' },
    { id:2, a: '/Maintenance', icon: faSliders, label: 'Maintenance', classNameIcon: 'icon-aside' },
    { id:3, a: '/Error', icon: faBug, label: 'Error', classNameIcon: 'icon-aside' }
];

const AppendMain = () =>{
    return Mains.map(item => <Main key={item.id} {...item} />)
};

const Main = ({a, icon, label, classNameIcon})=> {
    return <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon}/>
};

const ReportAndFeedbacks= [
    { id:1, a: '/Feedback', icon: faCommentDots, label: 'Feedback', classNameIcon: 'icon-aside' },
    { id:2, a: '/Report', icon: faFlag, label: 'Report', classNameIcon: 'icon-aside' }
];

const AppendReportAndFeedback = () =>{
    return(
        <>
        <label>Reports & Feedback </label>
        {ReportAndFeedbacks.map(item => (
            <ReportAndFeedback key={item.id} {...item} />
        ))}
        </>
    )
};

const ReportAndFeedback = ({a, icon, label, classNameIcon})=> {
    return <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
};

const UserInsights= [
    { id:1, a: '/User', icon: faUser, label: 'User', classNameIcon: 'icon-aside' },
    { id:2, a: '/Community', icon: faUsers, label: 'Community', classNameIcon: 'icon-aside' },
    { id:3, a: '/Book', icon: faBook, label: 'Book', classNameIcon: 'icon-aside' },
    { id:4, a: '/Comment', icon: faComment, label: 'Comment', classNameIcon: 'icon-aside' },
    { id:5, a: '/Reply', icon: faComments, label: 'Reply', classNameIcon: 'icon-aside' }
];

const AppendUserInsight = () =>{
    return(
        <>
        <label>User Insight</label>
        {UserInsights.map(item => (
            <UserInsight key={item.id} {...item} />
        ))}
        </>
    )
};

const UserInsight = ({a, icon, label, classNameIcon})=> {
    return <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
};

const Broadcasts= [
    { id:1, a: '/Notification', icon: faBell, label: 'Notification', classNameIcon: 'icon-aside' },
    { id:2, a: '/Article', icon: faNewspaper, label: 'Article', classNameIcon: 'icon-aside' }
];

const AppendBroadcast = () =>{
    return(
        <>
        <label>Broadcast</label>
        {Broadcasts.map(item => (
            <Broadcast key={item.id} {...item} />
        ))}
        </>
    )
};

const Broadcast = ({a, icon, label, classNameIcon})=> {
    return <Card a={a} icon={icon} label={label} classNameIcon={classNameIcon} />
};

export default Aside;