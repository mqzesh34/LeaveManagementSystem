const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.registerUser = async (email, password, firstName, lastName, role) => {
  const userExists = await User.findOne({ email });
  if (userExists) throw new Error("Bu e-posta zaten kullanımda.");

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  return await User.create({
    email,
    password: hashedPassword,
    firstName,
    lastName,
    role: role || "employee",
  });
};

exports.loginUser = async (email, password, isRememberMe) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Kullanıcı bulunamadı.");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Geçersiz şifre.");

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: isRememberMe ? "30d" : "1d" }
  );

  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
};

exports.getAllUsers = async () => {
  return await User.find({}, "-password");
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};
