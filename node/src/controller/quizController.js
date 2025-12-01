
const db = require('../config/db');
const {uploadToS3, deleteFromS3 } = require("../middleware/AWSuploadMiddleware");
const createEmployee = async (req, res) => {
  try {
    let pfCoverUrl = null;
    let bannerCoverUrl = null;

    // Upload profile image if provided
    if (req.files?.pfUrl && req.files.pfUrl[0]) {
      try {
        pfCoverUrl = await uploadToS3(req.files.pfUrl[0], "userPf/");
      } catch (err) {
        console.error("Error uploading profile image:", err);
        return res.status(500).json({ message: "Profile image upload failed" });
      }
    }

    // Upload banner image if provided
    if (req.files?.bannerUrl && req.files.bannerUrl[0]) {
      try {
        bannerCoverUrl = await uploadToS3(req.files.bannerUrl[0], "userBanner/");
      } catch (err) {
        console.error("Error uploading banner image:", err);
        return res.status(500).json({ message: "Banner image upload failed" });
      }
    }

    const {
      ide,
      fullname,
      address,
      salary,
      dob,
      gender,
      role,
      phonenumber,
      sd
    } = req.body;

    const [insert] = await db.query(
      `INSERT INTO employees (ide, fullname, address, salary, role, pfUrl, bannerUrl, DOB, gender, phonenumber, startDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ide, fullname, address, salary, role, pfCoverUrl, bannerCoverUrl, dob, gender, phonenumber, sd]
    );

    res.status(201).json({
      message: "Employee created successfully",
      employeeId: insert.insertId
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ message: "Failed to create employee" });
  }
};

const updateEmployee = async(req,res) =>{
  const {ide} = req.params;
  const [users] = await db.query(
    `SELECT * from employees WHERE id = ?;
    `,
    [ide]
  );

  if (users.length === 0)
      return res.status(404).json(
    { message: "Employee account not found or not authorized" }
  );

    const oldUser = users[0];
    let pfCoverUrl = oldUser.pfUrl;
    let bannerCoverUrl = oldUser.bannerUrl;

    if (req.files?.pfUrl && req.files.pfUrl[0]) {
      try {
        // Upload new profile picture to S3
        const newPfCover = await uploadToS3(req.files.pfUrl[0], "userPf/");

        // Safely delete old profile if it exists and is not empty
        if (oldUser.pfUrl && oldUser.pfUrl.trim() !== "" ) {
          try {
            await deleteFromS3(oldUser.pfUrl);
          } catch (deleteErr) {
            console.warn("Warning: Failed to delete old profile image:", deleteErr.message);
            // don't stop execution — deletion is not critical
          }
        }
        pfCoverUrl = newPfCover;
      } catch (uploadError) {
        console.error("Error uploading profile image:", uploadError);
        return res.status(500).json({ message: "Profile image upload failed" });
      }
    }

    if(req.files?.bannerUrl && req.files.bannerUrl[0]){
      try{
        const newBannerCover = await uploadToS3(req.files.bannerUrl[0], "userBanner/");
        if (oldUser.bannerUrl && oldUser.bannerUrl.trim() !== "" ) {
          try {
            await deleteFromS3(oldUser.bannerUrl);
          } catch (deleteErr) {
            console.warn("Warning: Failed to delete old banner image:", deleteErr.message);
            // don't stop execution — deletion is not critical
          }
        }
        bannerCoverUrl = newBannerCover;
      }catch(uploadError){
        console.error("Error uploading banner image:", uploadError);
        return res.status(500).json({ message: "Banner image upload failed" });
      }
    }

  try{
   
    const {
      fullname,
      address,
      salary,
      dob,
      gender,
      role,
      phonenumber,
      sd
    } = req.body
    

    const [update] = await db.query(
      `UPDATE employees SET fullname = ?, address = ?, salary = ?, role = ?, pfUrl = ?, bannerUrl = ?, DOB = ?, gender = ?, phonenumber = ?, startDate WHERE ide = ?`,
      [fullname, address, salary, role, pfCoverUrl, bannerCoverUrl, dob, gender, phonenumber, sd, ide]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ message: "Account not updated", Result: "False" });
    }

    res.json({ message: "successfully submit" });
  }
 catch(error){
  console.error("Error in fullRegisterController:", error);
  return res.status(500).json({ message: "failed to sumbit the full register" });
 }
}

 const deleteEmployee = async (req, res) => {
  const { ide } = req.params;
  try {
    const [users] = await db.query(`SELECT * FROM employees WHERE ide = ?`, [id]);

    if (users.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const employee = users[0];

    // Delete profile image from S3 if exists
    if (employee.pfUrl && employee.pfUrl.trim() !== "") {
      try {
        await deleteFromS3(employee.pfUrl);
      } catch (err) {
        console.warn("Warning: Failed to delete profile image:", err.message);
      }
    }

    // Delete banner image from S3 if exists
    if (employee.bannerUrl && employee.bannerUrl.trim() !== "") {
      try {
        await deleteFromS3(employee.bannerUrl);
      } catch (err) {
        console.warn("Warning: Failed to delete banner image:", err.message);
      }
    }

    // Delete employee record from DB
    const [del] = await db.query(`DELETE FROM employees WHERE ide = ?`, [ide]);

    if (del.affectedRows === 0) {
      return res.status(404).json({ message: "Employee not deleted" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ message: "Failed to delete employee" });
  }
};

const getEmployeeDataByide = async (req,res) => {
    try{
        const {ide} = req.params;
       const [rows] = await db.query(
        `SELECT * FROM employees WHERE ide = ?
       `,
        [ide]
       );
         // ✅ rows is an array
    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: "No data found", Result: "False" });
    }

    // ✅ send data back
    return res.status(200).json(rows[0]);
    }
    catch(error){
      console.error("Error in getFullRegisterDataByQid:", error);
      return res.status(500).json({ message: "failed to sumbit the full register" });
    }
}
module.exports = {
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeDataByide
}