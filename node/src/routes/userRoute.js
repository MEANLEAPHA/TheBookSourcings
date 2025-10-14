
// Import controller functions
const {
  loginMember,
  createMember,
  verifyMember,
  resendPin,
  updateAccount,
  requestPasswordReset,
  verifyResetPin,
  resetPassword,
  updatePassword,
  resendResetPin,
  changePassword,
  fullRegister
  // validate_token
} = require('../controller/userController');

const {authMiddleware} = require('../middleware/authMiddleware');
// Define routes
const TheBookSourcingUser = (app) => {
  app.put('/fullRegister', authMiddleware, fullRegister);
  app.post('/verify', authMiddleware, verifyMember);
  app.post('/resend-pin', authMiddleware, resendPin);
  app.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: "This is a protected profile", user: req.user });
  });
  app.post('/register', createMember);
  app.post('/login', loginMember);
  app.put('/updateAccount', authMiddleware, updateAccount);
  app.post('/requestPasswordReset', requestPasswordReset);
  app.post('/verifyResetPin', verifyResetPin);
  app.put('/resetPassword', resetPassword);
  app.put('/updatePassword', updatePassword);
  app.post('/resendresetpin', resendResetPin);
  app.put('/changepassword', authMiddleware, changePassword);

};


module.exports = {TheBookSourcingUser};
