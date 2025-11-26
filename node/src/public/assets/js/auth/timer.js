  const countdownEl = document.getElementById('countdown');
    let timeLeft = 10 * 60; // 10 minutes in seconds

    function updateCountdown() {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      countdownEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      if (timeLeft > 0) {
        timeLeft--;
      } else {
        clearInterval(timer);
        countdownEl.textContent = "Time's up!";
      }
    }

    const timer = setInterval(updateCountdown, 1000);