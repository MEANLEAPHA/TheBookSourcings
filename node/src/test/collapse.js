
const buttons = document.querySelectorAll(".cate");
let hoverTimer;

function togglePanel(btn) {
  const targetId = btn.getAttribute("data-bs-target");
  const target = document.querySelector(targetId);
  const instance = bootstrap.Collapse.getOrCreateInstance(target);

  const isOpen = target.classList.contains("show");

  if (isOpen) {
    // Close if already open
    instance.hide();
  } else {
    // Close all others first
    document.querySelectorAll(".collapse.show").forEach((open) => {
      if (open !== target) {
        const inst = bootstrap.Collapse.getInstance(open);
        if (inst) inst.hide();
      }
    });
    // Open the clicked one
    instance.show();
  }
}

buttons.forEach((btn) => {
  // Click toggle
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePanel(btn);
  });

  // Smart hover with delay
  btn.addEventListener("mouseenter", () => {
    clearTimeout(hoverTimer); // cancel any previous timer

    hoverTimer = setTimeout(() => {
      const targetId = btn.getAttribute("data-bs-target");
      const target = document.querySelector(targetId);
      if (!target.classList.contains("show")) {
        togglePanel(btn);
      }
    }, 300); // delay in ms before opening on hover
  });

  btn.addEventListener("mouseleave", () => {
    clearTimeout(hoverTimer); // stop delayed opening
  });
});

// Close all panels when clicking outside
document.addEventListener("click", (e) => {
  if (![...buttons].some(b => b.contains(e.target)) &&
      !e.target.closest(".collapse.show")) {
    document.querySelectorAll(".collapse.show").forEach((open) => {
      const instance = bootstrap.Collapse.getInstance(open);
      if (instance) instance.hide();
    });
  }
});

