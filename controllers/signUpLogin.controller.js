const asyncWrapper = require("../middlewares/asyncWrapper")

const nurseSignUp = asyncWrapper((req, res, next) => {
  return res.status(200).json({message: "Hello From Nurse Sign Up"})
})

const patientSignUp = asyncWrapper((req, res, next) => {
  return res.status(200).json({message: "Hello From Patient Sign Up"})
})

const signIn = asyncWrapper((req, res, next) => {
  return res.status(200).json({message: "Hello From Sign In"})
})

module.exports = {
  nurseSignUp,
  patientSignUp,
  signIn
};