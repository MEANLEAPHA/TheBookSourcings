function getVisibleHolders() {
  // Only include holders that are actually visible (not display:none)
  return Array.from(document.querySelectorAll('.container-box-holder'))
    .filter(h => h.offsetParent !== null); 
    // offsetParent is null if element or ancestor has display:none
}

let autoIndex = 0;
let autoTimer = null;
let userHovering = false;
let resumeTimer = null;

const gifMap = {
  "1-1": "../assets/img/OtthorGIF/apple.gif",
  "1-2": "../assets/img/OtthorGIF/dvd.gif",
  "1-3": "../assets/img/OtthorGIF/drinking.gif",
  "1-4": "../assets/img/OtthorGIF/dvd.gif",
  "1-5": "../assets/img/OtthorGIF/drinking.gif",
  "2-1": "../assets/img/OtthorGIF/newspaper.gif",
  "2-2": "../assets/img/OtthorGIF/lap.gif",
  "2-3": "../assets/img/OtthorGIF/newspaper.gif",
  "2-4": "../assets/img/OtthorGIF/lap.gif",
  "3-1": "../assets/img/OtthorGIF/Happy.gif",
  "3-2": "../assets/img/OtthorGIF/Happy.gif",
  "3-3": "../assets/img/OtthorGIF/Happy.gif",
  "4-1": "../assets/img/OtthorGIF/phone.gif",
  "4-2": "../assets/img/OtthorGIF/ipad.gif",
  "4-3": "../assets/img/OtthorGIF/phone.gif",
  "4-4": "../assets/img/OtthorGIF/ipad.gif",
  "5-1": "../assets/img/OtthorGIF/takePhoto.gif",
  "5-2": "../assets/img/OtthorGIF/cokkingEgg.gif",
  "5-3": "../assets/img/OtthorGIF/dancing.gif",
  "5-4": "../assets/img/OtthorGIF/cokkingEgg.gif",
  "5-5": "../assets/img/OtthorGIF/dancing.gif"
};

// Helper: get GIF path for a holder
function getGif(holder) {
  const box = holder.parentElement; // .container-box
  const boxIndex = Array.from(box.parentElement.children).indexOf(box) + 1;
  const holderIndex = Array.from(box.children).indexOf(holder) + 1;
  return gifMap[`${boxIndex}-${holderIndex}`] || null;
}

// Activate one holder
function activateHolder(holder) {
  holder.classList.add('active');
  const gif = getGif(holder);
  if (gif) {
    holder.style.backgroundImage = `url('${gif}')`;
    holder.style.backgroundSize = "cover";
    holder.style.backgroundPosition = "center";
  }

  // Remove after 2s
  setTimeout(() => {
    holder.classList.add('fade-out');
    setTimeout(() => {
      holder.style.backgroundImage = "";
      holder.classList.remove('active', 'fade-out');
    }, 1000); // match CSS transition
  }, 2000);
}

// Sequential auto cycle
function startAutoCycle() {
  if (autoTimer) clearTimeout(autoTimer);

  function next() {
    const visibleHolders = getVisibleHolders();
    if (visibleHolders.length === 0) return; // nothing to show

    if (!userHovering) {
      activateHolder(visibleHolders[autoIndex]);
      autoIndex = (autoIndex + 1) % visibleHolders.length;
    }
    autoTimer = setTimeout(next, 2500); // 2s active + 0.5s gap
  }

  next();
}

// Pause/resume on user hover
document.querySelectorAll('.container-box-holder').forEach(holder => {
  holder.addEventListener('mouseenter', () => {
    userHovering = true;
    clearTimeout(autoTimer);   // stop auto instantly
    clearTimeout(resumeTimer); // cancel any pending resume
    activateHolder(holder);    // run GIF mapping directly
  });

  holder.addEventListener('mouseleave', () => {
    userHovering = false;
    // wait 5 seconds before restarting auto cycle
    resumeTimer = setTimeout(() => {
      if (!userHovering) {
        startAutoCycle();
      }
    }, 5000);
  });
});

// Start on page load
startAutoCycle();