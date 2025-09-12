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
    
    

    const influencedByCard = document.querySelector('.influenced-by-card');
    const influencedByList = document.querySelector('.influenced-By');
    const influencedByData = data.influencedBy;
    influencedByList.innerHTML = '';
    if (influencedByData.length === 0) {
        influencedByCard.remove();
    } 
    else {
        influencedByData.forEach(item => {
            const div = document.createElement("div");
            div.className = "IFB";
            const a = document.createElement('a');
            a.href = `aboutAuthor.html?wikiId=${item.qid}`;
            const img = document.createElement('img');
            img.src = item.photo;
            Object.assign(img.style, {
                width: '55px',
                height: '65px',
                borderRadius: '4px'
            });
            const p = document.createElement('p');
            p.textContent = item.name;
            a.appendChild(img);
            a.appendChild(p);
            div.appendChild(a);
            influencedByList.appendChild(div);
        });
    }

    const influencedCard = document.querySelector('.influenced-card');
    const influencedList = document.querySelector('.influenced');
    const influencedData = data.influenced;
    influencedList.innerHTML = '';
    if (influencedData.length === 0) {
        influencedCard.remove();
    } 
    else {
        influencedData.forEach(item => {
            const div = document.createElement("div");
            div.className = "IF";
            const a = document.createElement('a');
            a.href = `aboutAuthor.html?wikiId=${item.qid}`;
            const img = document.createElement('img');
            img.src = item.photo;
            Object.assign(img.style, {
                width: '55px',
                height: '65px',
                borderRadius: '4px'
            });
            const p = document.createElement('p');
            p.textContent = item.name;
            a.appendChild(img);
            a.appendChild(p);
            div.appendChild(a);
            influencedList.appendChild(div);
        });
    }
 



  const PrimaryProfession = Array.isArray(data.professionQids)
  ? data.professionQids[0] || ""
  : data.professionQids || "";
  const PrimaryProfessionToUse = (PrimaryProfession && String(PrimaryProfession).trim()) ? PrimaryProfession : "writer";
 
  // call the loader with that similar author
  loadSimilarAuthor(PrimaryProfessionToUse);



}




async function notableWorkFunction() {
    const workLists = document.querySelector(".swiper-wrapper");
    const notableWork = document.querySelector(".notableWork");

    // 1️⃣ Add skeletons immediately
    const skeletonCount = 5; // number of placeholder slides
    workLists.innerHTML = "";
    for (let i = 0; i < skeletonCount; i++) {
        const div = document.createElement("div");
        div.className = "swiper-slide skeleton-slide";
        div.innerHTML = `
            <div class="BookCover skeleton-box"></div>
            <div class="bookInfo">
                <p class="BookTitle skeleton-box"></p>
            </div>
        `;
        workLists.appendChild(div);
    }

    try {
        const res = await fetch(`https://thebooksourcings.onrender.com/api/authors/notableWork/${wikiId}`);
        if (!res.ok) throw new Error("Network response is not ok");
        const { notableWorks } = await res.json();

        if (!notableWorks || notableWorks.length === 0) {
            notableWork?.remove();
            return;
        }

        // 2️⃣ Clear skeletons and build actual slides
        workLists.innerHTML = "";
        notableWorks.forEach(notable => {
            const div = document.createElement("div");
            div.className = "swiper-slide";

            const a = document.createElement("a");
            a.href = notable.idValue ? `aboutBook.html?bookId=${notable.idValue}` : "#";

            const img = document.createElement("img");
            img.src = notable.cover || 'assets/img/noCoverFound.png';
            img.alt = notable.name || "No Title";
            img.className = "BookCover lazyload";
            img.loading = "lazy";
            img.onerror = () => { img.src = 'assets/img/noCoverFound.png'; };

            const infoDiv = document.createElement("div");
            infoDiv.className = "bookInfo";
            const titleP = document.createElement("p");
            titleP.className = "BookTitle";
            titleP.textContent = notable.name || "Unknown";

            infoDiv.appendChild(titleP);
            a.appendChild(img);
            a.appendChild(infoDiv);
            div.appendChild(a);
            workLists.appendChild(div);
        });

        // 3️⃣ Initialize Swiper
        if (window.mySwiper?.destroy) window.mySwiper.destroy();
        window.mySwiper = new Swiper('.swiper', {
            loop: notableWorks.length >= 3,
            autoplay: { delay: 1500, disableOnInteraction: false },
            slidesPerView: 'auto',
            spaceBetween: 15,
            pagination: { el: '.swiper-pagination', clickable: true },
            navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
            breakpoints: {
                640: { slidesPerView: 3, spaceBetween: 20 },
                768: { slidesPerView: 3, spaceBetween: 20 },
                1024: { slidesPerView: 5, spaceBetween: 15 }
            }
        });

    } catch (err) {
        console.error("NotableWork error:", err);
    }
}
notableWorkFunction();











































async function loadSimilarAuthor(profession){
  try {
    const res = await fetch(`https://thebooksourcings.onrender.com/api/authors/similar/${encodeURIComponent(profession)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const {  authors } = await res.json();

    const similarAuthorsCard = document.querySelector('.similar-authors-card');
    const similarAuthorsList = document.querySelector('.similar-authors');

    // clear old results
    similarAuthorsList.innerHTML = '';

    if (authors.length === 0) {
      similarAuthorsCard.remove();
    } else {
     
      authors.forEach(info => {
        const div = document.createElement("div");
        div.className = "SMA";

        const a = document.createElement('a');
        a.href = `aboutAuthor.html?wikiId=${info.qid}`;

        const img = document.createElement('img');
        img.src = info.photo || 'assets/img/noCoverFound.png';
        Object.assign(img.style, {
          width: '55px',
          height: '65px',
          borderRadius: '4px'
        });

        const p = document.createElement('p');
        p.textContent = info.name;

        a.appendChild(img);
        a.appendChild(p);
        div.appendChild(a);
        similarAuthorsList.appendChild(div);
      });
    }
  }
  catch(err) {
    console.error("fetchAuthor.js", err.message);
  }
}






    

