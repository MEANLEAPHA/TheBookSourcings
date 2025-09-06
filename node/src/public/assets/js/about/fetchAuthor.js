const urlParams = new URLSearchParams(window.location.search);
const wikiId = urlParams.get("wikiId");

fetch(`https://thebooksourcings.onrender.com/api/author/${wikiId}`)
.then(res => res.json())
.then(renderAuthor)
.catch(err => {
    console.error("fetchAuthor", err.message);
});


function renderAuthor(response){
    const data = response.data; // extract the nested data

    // about name
    document.querySelector(".aboutAFN").textContent = data.name;
    // fullname under pf
    document.querySelector(".authorFullName").textContent = data.name;

    // socail
    document.querySelector(".website").href = data.website;
    document.querySelector(".facebook").href = data.facebook;
    document.querySelector(".instagram").href = data.instagram;
    document.querySelector(".linkedin").href = data.linkedin;
    document.querySelector(".youtube").href = data.youtube;
    document.querySelector(".twitter").href = data.x;


    const facebookIcon = document.querySelector('.fa-facebook');
    const facebookData = data.facebook;

    if(!facebookData){
        facebookIcon.remove();
    }
    else{
        document.querySelector(".facebook").href = data.facebook;
    }


        // Set website link
    

  const platforms = [
  { key: "facebook", selector: ".fa-facebook" },
  { key: "website", selector: ".fa-globe" },
  { key: "instagram", selector: ".fa-instagram" },
  { key: "linkedin", selector: ".fa-linkedin" },
  { key: "youtube", selector: ".fa-youtube" },
  { key: "x", selector: ".fa-twitter" } // Twitter is now X
];

const sM = document.querySelector(".sM");
const hr = document.querySelector(".hr");
const br = document.querySelectorAll(".br");

let validCount = 0; // Track how many platforms have valid URLs

platforms.forEach(({ key, selector }) => {
  const url = data[key];
  const icon = document.querySelector(selector);
  const link = document.querySelector(`.${key}`);

  if (!url) {
    if (icon) icon.remove();
    if (link) link.remove();
  } else {
    validCount++;
    if (link) link.href = url;
  }
});

// If no valid social links, remove sM and hr
if (validCount === 0) {
  if (sM) sM.remove();
  if (hr) hr.remove();
  if (br) br.forEach(brS => brS.remove());
}


   
   document.querySelector(".user-profile-image").src = data.photo || "assets/img/noCoverFound.png";
   

   const signatureData = data.signature;
   const signatureTr = document.querySelector(".signature");
   if(!signatureData){
    signatureTr.remove();
   }
   else{
    signatureTr.src = signatureData;
   }
    
    
   

    // Summary
    const SummaryTr = document.querySelector('.SummaryTr');
    const SummaryData = data.summary;

    if(!SummaryData || SummaryData.length === 0){
        SummaryTr.remove();
    }
    else{
        document.querySelector('.Summary').textContent = SummaryData
    }



    // Occupation
    const OccupationTr = document.querySelector('.OccupationTr');
    const OccupationData = data.profession;

    if(!OccupationData || OccupationData.length === 0){
        OccupationTr.remove();
    }
    else{
        document.querySelector('.Occupation').textContent = OccupationData.join(", ")
    }

    // given name
    const GivennameTr = document.querySelector('.GivennameTr');
    const GivennameData = data.givenName;

    if(!GivennameData || GivennameData.length === 0){
        GivennameTr.remove();
    }
    else{
        document.querySelector('.Givenname').textContent = GivennameData.join(", ")
    }

    // family name
    const FamilynameTr = document.querySelector('.FamilynameTr');
    const FamilynameData = data.familyName;

    if(!FamilynameData || FamilynameData.length === 0){
        FamilynameTr.remove();
    }
    else{
        document.querySelector('.Familyname').textContent = FamilynameData.join(", ")
    }


    // dOb
    const dOb = document.querySelector('.dOb');
    const DateofbirthData = data.dateOfBirth;

    if(!DateofbirthData || DateofbirthData.length ===0){
        dOb.remove();
    }
    else{
        document.querySelector('.Dateofbirth').textContent = DateofbirthData
    }   



    // pOb
    const pOb = document.querySelector('.pOb');
    const PlaceofbirthData = data.placeOfBirth;

    if(!PlaceofbirthData || PlaceofbirthData.length ===0){
        pOb.remove();
    }
    else{
        document.querySelector('.Placeofbirth').textContent = PlaceofbirthData.join(", ")
    } 


    // gender
    const GenderTr = document.querySelector('.GenderTr');
    const GenderData = data.gender;

    if(!GenderData || GenderData.length === 0){
        GenderTr.remove();
    }
    else{
        document.querySelector('.Gender').textContent = GenderData.join(", ")
    }
    


    const dOd = document.querySelector(".dOd");
    const pOd = document.querySelector(".pOd");
    const cOd = document.querySelector(".cOd");

    const dOdData = data.dateOfDeath;
    const pOdData = data.placeOfDeath;
    const cOdData = data.causeOfDeath;


    // Date of death
    if(!dOdData){
        dOd.remove();
    }
    else{
        document.querySelector('.Dateofdeath').textContent = dOdData;
    };


    // Place of death
    if(!pOdData || pOdData.length === 0){
        pOd.remove();
    }
    else{
        document.querySelector('.Placeofdeath').textContent = pOdData.join(", ");
    }


    // Cause of death
    if(!cOdData || pOdData.length === 0){
        cOd.remove();
    }
    else{
        document.querySelector('.Causeofdeath').textContent = cOdData.join(", ");
    }



    // Education
    const educationTr = document.querySelector('.educationTr');
    const educationData = data.education;

    if(!educationData || educationData.length ===0){
        educationTr.remove();
    }
    else{
        document.querySelector('.education').textContent = educationData.join(", ")
    }


    // Religion
    const religionTr = document.querySelector('.religionTr');
    const religionData = data.religion;

    if(!religionData || religionData.length ===0){
        religionTr.remove();
    }
    else{
        document.querySelector('.religion').textContent = religionData.join(", ")
    }
 

    // Citizenship
    const CitizenshipTr = document.querySelector('.CitizenshipTr');
    const CitizenshipData = data.citizenship;

    if(!CitizenshipData || CitizenshipData.length ===0){
        CitizenshipTr.remove();
    }
    else{
        document.querySelector('.Citizenship').textContent = CitizenshipData.join(", ")
    }

    // Aliases
    const aliasesTr = document.querySelector('.aliasesTr');
    const aliasesData = data.aliases;

    if(!aliasesData || aliasesData.length ===0){
        aliasesTr.remove();
    }
    else{
        document.querySelector('.aliases').textContent = aliasesData.join(", ")
    }



    // Award
    const awardData = data.awards;
    const awardList = document.querySelector(".awardlist");
    const awardCard = document.querySelector(".award-card"); 
    awardList.innerHTML = '';
    if(awardData.length > 0) {
        for (const award of awardData) {
            const li = document.createElement("li");
            li.textContent = award;
            awardList.appendChild(li);
        }
    }
    else{
        awardCard.remove();
    }
    
    







    
}
