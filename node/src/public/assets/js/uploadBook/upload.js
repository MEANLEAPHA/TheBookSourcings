  const steps = document.querySelectorAll(".step-section");
  const nextBtn = document.getElementById("nextBtn");
  const prevBtn = document.getElementById("prevBtn");
  const progressBar = document.getElementById("progressBar");
  let currentStep = 0;

  function showStep(step) {
    steps.forEach((s, i) => {
      s.classList.toggle("active", i === step);
    });
    prevBtn.style.display = step === 0 ? "none" : "inline-block";
    nextBtn.textContent = step === steps.length - 1 ? "Submit" : "Next";
    progressBar.style.width = ((step + 1) / steps.length) * 100 + "%";
  }



  prevBtn.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    }
  });

  showStep(currentStep);

  // ---- Book Cover Upload ----
  const coverInput = document.getElementById('coverInput');
  const coverPreview = document.getElementById('coverPreview');
  const coverPlaceholder = document.getElementById('coverPlaceholder');
  const coverRemoveBtn = document.getElementById('coverRemoveBtn');

  coverInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        coverPreview.src = e.target.result;
        coverPreview.style.display = 'block';
        coverPlaceholder.style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  });

  coverRemoveBtn.addEventListener('click', function () {
    coverPreview.src = '';
    coverPreview.style.display = 'none';
    coverPlaceholder.style.display = 'block';
    coverInput.value = '';
  });

  // ---- Book File Upload ----
  const fileInput = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const filePlaceholder = document.getElementById('filePlaceholder');
  const fileRemoveBtn = document.getElementById('fileRemoveBtn');

  fileInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
      const fileURL = URL.createObjectURL(file);
      filePreview.src = fileURL;
      filePreview.style.display = 'block';
      filePlaceholder.style.display = 'none';
    }
  });

  fileRemoveBtn.addEventListener('click', function () {
    fileInput.value = '';
    filePreview.src = '';
    filePreview.style.display = 'none';
    filePlaceholder.style.display = 'inline';
  });

  
  nextBtn.addEventListener("click", () => {
  const currentSection = steps[currentStep];
  const requiredInputs = currentSection.querySelectorAll("[required]");

  let valid = true;
  requiredInputs.forEach(input => {
    if (!input.value.trim()) {
      input.classList.add("is-invalid");
      document.querySelectorAll(".form-section").forEach(section => {
        section.classList.add("is-invalid-section");
      });

      valid = false;
    } else {
      input.classList.remove("is-invalid");
      document.querySelectorAll(".form-section").forEach(section => {
        section.classList.remove("is-invalid-section");
      });
    }
  });

  if (!valid) return; // stop if required field missing

  if (currentStep < steps.length - 1) {
  currentStep++;
  showStep(currentStep);
  } else {
    $('#bookForm').trigger('submit'); // ✅ uses jQuery event
  }

});
