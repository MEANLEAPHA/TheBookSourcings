const urlParams = new URLSearchParams(window.location.search);
const wikiId = urlParams("wikiId");

fetch(`https://thebooksourcings.onrender.com/api/author/${wikiId}`)
.then(res => res.json())
.then(renderAuthor)
.catch(err => {
    console.error("fetchAuthor", err.message);
});

function renderAuthor(data){
    document.querySelector(".authorFullName").textContent = data.name;
    document.querySelector(".shortDescription").textContent = data.description;
    document.querySelector(".website").href = data.website;
    document.querySelector(".facebook").href = data.facebook;
    document.querySelector(".instagram").href = data.instagram;
    document.querySelector(".linkedin").href = data.linkedin;
    document.querySelector(".youtube").href = data.youtube;
    document.querySelector(".twitter").href = data.x;
    document.querySelector(".aboutAFN").textContent = data.name;
    document.querySelector(".Givenname").textContent = data.givenName;
    document.querySelector(".Familyname").textContent = data.familyName;
    document.querySelector(".Dateofbirth").textContent = data.dateOfBirth;
    document.querySelector(".Placeofbirth").textContent = data.placeOfBirth;
    document.querySelector(".Dateofdeath").textContent = data.dateOfDeath
    document.querySelector(".Placeofdeath").textContent = data.placeOfDeath;
    document.querySelector(".Gender").textContent = data.gender;
    document.querySelector(".Citizenship").textContent = data.citizenship;
    document.querySelector(".Occupation").textContent = data.profession;
    document.querySelector(".Summary").textContent = data.summary;
    document.querySelector(".awards").textContent = data.awards;


}