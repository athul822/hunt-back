const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");
const bcrypt = require("bcrypt");

exports.createUsers = async (req, res) => {
  try {
    console.log(req.body);
    const existingUser = await Users.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(403).json({
        message: "User with same email already exists. Please sign in",
      });
    }
    // Create the user
    const newUser = await Users.create(req.body);
    console.log({ newUser });

    // Send success response
    res.json({ message: "User registration successful", newUser });
  } catch (error) {
    // Handle errors
    console.error("Error in user registration:", error);
    res.status(500).json({
      message: "Unable to register new user",
      error: error.message
    });
  }
};


// exports.userLogin = async (req, res) => {
//     const query = { email: req.body.email };
//     console.log("user login :", query);

//     Users.findOne(
//       query
//     )
//       .then((data) => {
//         if (data) {
//           const auth = bcrypt.compareSync(req.body.password, data.password);
//           if (auth) {
//             // const token = jwt.sign({ data }, "secretKey");
//             const { ["password"]: remove, ...user } = data._doc;
//             console.log(user);
//             res.json({
//               message: " User Authentication Success",
//             //   token,
//               user,
//             });
//           } else {
//             res.status(400).json({
//               message: "Authentication Failed",
//             });
//           }
//         } else {
//           res.status(400).json({
//             message: "No such user",
//           });
//         }
//       })
//       .catch((err) =>
//         res.status(400).json({
//           message: "unable to logins",
//           error: err.message,
//         })
//       );
//   };


exports.userLogin = async (req, res) => {
  const query = { email: req.body.email };
  console.log("user login :", query);

  Users.findOne(
    query
  )
    .then((data) => {
      if (data) {
        return res.status(200).json({
          message: "sign in success",
          data: data,
        });
      } else {
        res.status(200).json({
          message: "No such user",
        });
      }
    })
    .catch((err) =>
      res.status(400).json({
        message: "unable to logins",
        error: err.message,
      })
    );
};

exports.updateUser = async (req, res) => {
  try {
    // Remove protected fields from the update request
    const { id, email, username, ...updateData } = req.body;

    // Find and update the user
    const updatedUser = await Users.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    res.status(200).json({
      message: "User details updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      message: "Unable to update user details",
      error: error.message
    });
  }
};