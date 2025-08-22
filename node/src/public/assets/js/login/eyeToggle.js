const passwordFields = document.getElementById('password');
const togglePasswords = document.getElementById('togglePasswords');

// Add event listener to the eye icon
togglePasswords.addEventListener('click', function () {
// Check the current type of the password field
if (passwordFields.type === 'password') {
    passwordFields.type = 'text';  // Show the password
    this.classList.remove('fa-eye-slash');
    this.classList.add('fa-eye');  // Switch to eye icon
} else {
    passwordFields.type = 'password';  // Hide the password
    this.classList.remove('fa-eye');
    this.classList.add('fa-eye-slash');  // Switch back to eye-slash icon
}
});