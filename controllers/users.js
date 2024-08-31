const { v4: uuidv4 } = require("uuid");
const Users = require("../models/users");
const bcrypt = require("bcrypt");

exports.createUsers = async (req, res) => {
    try {
        // Hash the password
        // const hashPassword = await bcrypt.hash(req.body.password, 10);
        
        // Generate unique user ID
        // req.body.userId = uuidv4();
        
        // Store the hashed password
        // req.body.password = hashPassword;

        // Check if user already exists
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
          console.log(data, "data");
          
        } else {
          res.status(400).json({
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