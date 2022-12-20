const db = require("../models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;

const Op = db.Sequelize.Op;

var jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");

exports.signup = (req, res) => {
  if (!req.body.username) {
    return res.status(400).send({
      errorCode: "INVALID_INPUT_DATA",
      message: "There are validation errors: username - username cannot be null. ",
      invalidFields: {
        username: "Invalid username"
      }
    });
  }
  if (!req.body.email) {
    return res.status(400).send({
      errorCode: "INVALID_INPUT_DATA",
      message: "There are validation errors: email - email cannot be null. ",
      invalidFields: {
        username: "Invalid email"
      }
    });
  }
  if (!req.body.password) {
    return res.status(400).send({
      errorCode: "INVALID_INPUT_DATA",
      message: "There are validation errors: password - password cannot be null. ",
      invalidFields: {
        username: "Invalid password"
      }
    });
  }
  // Save User to Database
  User.create({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 8)
  })
    .then(user => {
      if (req.body.roles) {
        Role.findAll({
          where: {
            name: {
              [Op.or]: req.body.roles
            }
          }
        }).then(roles => {
          user.setRoles(roles).then(() => {
            res.status(200).send({
              statusCode: 200,
              message: "User was registered successfully!"
            });
          });
        });
      } else {
        // user role = 1
        user.setRoles([1]).then(() => {
          res.status(200).send({
            statusCode: 200,
            message: "User was registered successfully!"
          });
        });
      }
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};

exports.signin = (req, res) => {
  if (!req.body.username) {
    return res.status(400).send({
      errorCode: "INVALID_INPUT_DATA",
      message: "There are validation errors: username - username cannot be null. ",
      invalidFields: {
        username: "Invalid username"
      }
    });
  }
  if (!req.body.password) {
    return res.status(400).send({
      errorCode: "INVALID_INPUT_DATA",
      message: "There are validation errors: password - Required. ",
      invalidFields: {
        password: "Invalid password"
      }
    });
  }
  User.findOne({
    where: {
      username: req.body.username
    }
  })
    .then(user => {
      if (!user) {
        return res.status(400).send({
          errorCode: "WRONG_USER",
          message: "Could not found user",
        });
      }

      var passwordIsValid = bcrypt.compareSync(
        req.body.password,
        user.password
      );

      if (!passwordIsValid) {
        return res.status(400).send({
          errorCode: "WRONG_USER",
          message: "Could not found user",
        });
      }

      var token = jwt.sign({ id: user.id }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      var authorities = [];
      user.getRoles().then(roles => {
        for (let i = 0; i < roles.length; i++) {
          authorities.push("ROLE_" + roles[i].name.toUpperCase());
        }
        res.status(200).send({
          statusCode: 200,
          message: "Success",
          data: {
            id: user.id,
            username: user.username,
            email: user.email,
            roles: authorities,
            accessToken: token
          }
        });
      });
    })
    .catch(err => {
      res.status(500).send({ message: err.message });
    });
};