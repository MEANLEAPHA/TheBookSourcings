import React from "react";
import '../style/Section.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faBucket, faCircleExclamation, faMessage, faSpinner, faFlag} from "@fortawesome/free-solid-svg-icons";
const Section = () =>{
    return (
        <section>
           
            
        </section>
    )
};

const dataInfo = [
    {id:1, icon: faBucket, backgroundColor: 'orange', title: 'Used Space', data: '48/250GB', sourceLink: '#', source: 'Source from Digital Ocean'},
    {id:2, icon: faCircleExclamation, backgroundColor: 'tomato', title: 'Fixed Issue', data: 4, sourceLink: '#', source: 'Found by Render'},
    {id:3, icon: faMessage, backgroundColor: 'rgb(77, 77, 238)', title: 'Feedback', data: 78, sourceLink: '#', source: 'Source from Database'},
    {id:4, icon: faFlag, backgroundColor: 'rgb(238, 59, 0)', title: 'Report', data:8, sourceLink: '#', source: 'Source from Database'},
    {id:5, icon: faSpinner, backgroundColor: 'green', title: 'Request', data: 12 + 'K', sourceLink: '#', source: 'Track by Cloudflare'}
]

const TotalReport = () =>{
    return (
        <ul>
            { 
                dataInfo.map(item => (
                    <TotalReportCard key={item.id} {...item}/>
                ))
            }
        </ul>
    )
}

const TotalReportCard = ({icon, backgroundColor, title, data, sourceLink, source}) => {
    return(
            <li>    
                <div className="container">
                    <div className="con-icon" style={{backgroundColor}}>
                        <FontAwesomeIcon icon={icon} className="icons"/>
                    </div>
                    <div className="con-info">
                        <div className='con-data'>
                            <p>{title}</p>
                            <p>{data}</p>
                        </div>
                        <hr />
                        <div className='con-source'>
                            <a href={sourceLink}>{source}</a>
                        </div>
                    </div>
                </div>
            </li>
    )
}
export default Section;
