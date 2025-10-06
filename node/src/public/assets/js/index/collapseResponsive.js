// document.addEventListener("DOMContentLoaded", function () {
//   const btnToggle = document.querySelector(".fa-bars");
//   const collapse = document.querySelector(".collapse");
//   const smallcollapse = document.querySelector(".smallCollape");
//   const content = document.querySelector(".content");
//   let bool = false;

//   // Initial layout setup
//   function setupLayout() {
//       if (window.innerWidth <= 768) {
//           collapse.style.display = "none";
//           collapse.style.position = "fixed";
//           collapse.style.top= "60px";
//           collapse.style.width = "70%";
//           collapse.style.zIndex = "1000";
//           smallcollapse.style.display = "none";
//           content.style.width = "100%";
//       } else if (window.innerWidth <= 1024) {
//           collapse.style.display = "grid";
//           collapse.style.position = "sticky";
//           collapse.style.top = "60px";
//           collapse.style.width = "28%";
//           collapse.style.zIndex = "auto";
//           smallcollapse.style.display = "none";
//           smallcollapse.style.width = '10%';
//           content.style.width = "72%";
//       } else {
//           collapse.style.display = "grid";
//           collapse.style.position = "sticky";
//           collapse.style.top = "60px";
//           collapse.style.width = "18%";
//           collapse.style.zIndex = "auto";
//           smallcollapse.style.display = "none";
//           smallcollapse.style.width = '10%';
//           smallcollapse.style.position = "sticky";
//           smallcollapse.style.top = '60px';
//           content.style.width = "82%";
//       }
//   }
//   setupLayout(); // Run on load

//   // Update layout on resize and reset toggle state
//   window.addEventListener("resize", () => {
//       setupLayout();
//       bool = false;
//   });

//   // Toggle logic
//   btnToggle.addEventListener("click", function () {
//       if (window.innerWidth <= 768) {
//           if (!bool) {
//               collapse.style.display = "block";
//               collapse.style.position = "fixed";
//               collapse.style.height = "calc(100vh - 60px);";
//               collapse.style.top = "60px";
//               collapse.style.width = "70%";
//               collapse.style.zIndex = "1000";
//               smallcollapse.style.display = "none";
//               content.style.width = "100%";
//           } else {
//               collapse.style.display = "none";
//               content.style.width = "100%";
//           }
//       } else if (window.innerWidth <= 1024) {
//           if (!bool) {
//                   collapse.style.display = "none";
//               smallcollapse.style.display = "grid";
//               smallcollapse.style.width = '10%';
//               smallcollapse.style.position = "sticky";
//               smallcollapse.style.top = '60px';
//               content.style.width = "90%";
//           } else {
          

//               collapse.style.display = "grid";
//               collapse.style.position = "sticky";
//               collapse.style.top = "60px";
//               collapse.style.width = "28%";
//               collapse.style.zIndex = "auto";
//               smallcollapse.style.display = "none";
//               content.style.width = "72%";
//           }
//       } else {
//           if (!bool) {
//               collapse.style.display = "none";
//               smallcollapse.style.display = "grid";
//               smallcollapse.style.position = "sticky";
//               smallcollapse.style.top = '60px';
//               smallcollapse.style.width = '6%';
//               content.style.width = "94%";
//           } else {
//               collapse.style.display = "grid";
//               collapse.style.position = "sticky";
//               collapse.style.top = "60px";

//               collapse.style.width = "18%";
              
//               smallcollapse.style.display = "none";
//               content.style.width = "82%";
//           }
//       }
//       bool = !bool;
//     });
// });

document.addEventListener("DOMContentLoaded", function () {
  const btnToggle = document.querySelector(".fa-bars");
  const collapse = document.querySelector(".collapse");
  const smallcollapse = document.querySelector(".smallCollape");
  const content = document.querySelector(".content");
  let bool = false;
  let userToggled = false; // prevent layout reset after toggle

  // Initial layout setup
  function setupLayout() {
    if (window.innerWidth <= 768) {
      collapse.style.display = "none";
      collapse.style.position = "fixed";
      collapse.style.top = "60px";
      collapse.style.width = "70%";
      collapse.style.zIndex = "1000";
      smallcollapse.style.display = "none";
      content.style.width = "100%";
    } else if (window.innerWidth <= 1024) {
      collapse.style.display = "grid";
      collapse.style.position = "sticky";
      collapse.style.top = "60px";
      collapse.style.width = "28%";
      collapse.style.zIndex = "auto";
      smallcollapse.style.display = "none";
      smallcollapse.style.width = "10%";
      content.style.width = "72%";
    } else {
      collapse.style.display = "grid";
      collapse.style.position = "sticky";
      collapse.style.top = "60px";
      collapse.style.width = "18%";
      collapse.style.zIndex = "auto";
      smallcollapse.style.display = "none";
      smallcollapse.style.width = "10%";
      smallcollapse.style.position = "sticky";
      smallcollapse.style.top = "60px";
      content.style.width = "82%";
    }
  }

  setupLayout(); // Run on load

  // Update layout on resize but keep user choice
  window.addEventListener("resize", () => {
    if (!userToggled) {
      setupLayout();
      bool = false;
    }
  });

  // Prevent scroll from resetting layout
  window.addEventListener("scroll", () => {
    // do nothing — remove auto behavior (bug fix)
  });

  // Toggle logic
  btnToggle.addEventListener("click", function () {
    userToggled = true; // user manually toggled
    if (window.innerWidth <= 768) {
      if (!bool) {
        collapse.style.display = "block";
        collapse.style.position = "fixed";
        collapse.style.top = "60px";
        collapse.style.width = "70%";
        collapse.style.zIndex = "1000";
        smallcollapse.style.display = "none";
        content.style.width = "100%";
      } else {
        collapse.style.display = "none";
        content.style.width = "100%";
      }
    } else if (window.innerWidth <= 1024) {
      if (!bool) {
        collapse.style.display = "none";
        smallcollapse.style.display = "grid";
        smallcollapse.style.width = "10%";
        smallcollapse.style.position = "sticky";
        smallcollapse.style.top = "60px";
        content.style.width = "90%";
      } else {
        collapse.style.display = "grid";
        collapse.style.position = "sticky";
        collapse.style.top = "60px";
        collapse.style.width = "28%";
        collapse.style.zIndex = "auto";
        smallcollapse.style.display = "none";
        content.style.width = "72%";
      }
    } else {
      if (!bool) {
        collapse.style.display = "none";
        smallcollapse.style.display = "grid";
        smallcollapse.style.position = "sticky";
        smallcollapse.style.top = "60px";
        smallcollapse.style.width = "6%";
        content.style.width = "94%";
      } else {
        collapse.style.display = "grid";
        collapse.style.position = "sticky";
        collapse.style.top = "60px";
        collapse.style.width = "18%";
        smallcollapse.style.display = "none";
        content.style.width = "82%";
      }
    }
    bool = !bool;
  });
});
