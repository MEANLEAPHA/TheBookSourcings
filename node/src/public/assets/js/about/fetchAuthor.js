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

    document.querySelector(".authorFullName").textContent = data.name;
    document.querySelector(".shortDescription").textContent = data.description;
    document.querySelector(".website").href = data.website;
    document.querySelector(".facebook").href = data.facebook;
    document.querySelector(".instagram").href = data.instagram;
    document.querySelector(".linkedin").href = data.linkedin;
    document.querySelector(".youtube").href = data.youtube;
    document.querySelector(".twitter").href = data.x;
    document.querySelector(".aboutAFN").textContent = data.name;
    document.querySelector(".Givenname").textContent = data.givenName.join(", ");
    document.querySelector(".Familyname").textContent = data.familyName.join(", ");
    document.querySelector(".Dateofbirth").textContent = data.dateOfBirth;
    document.querySelector(".Placeofbirth").textContent = data.placeOfBirth.join(", ");
    document.querySelector(".Dateofdeath").textContent = data.dateOfDeath;
    document.querySelector(".Placeofdeath").textContent = data.placeOfDeath.join(", ");
    document.querySelector(".Gender").textContent = data.gender.join(", ");
    document.querySelector(".Citizenship").textContent = data.citizenship.join(", ");
    document.querySelector(".Occupation").textContent = data.profession.join(", ");
    document.querySelector(".Summary").textContent = data.summary;
    document.querySelector(".awards").textContent = data.awards.join(", ");
}
