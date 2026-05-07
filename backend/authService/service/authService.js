const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const toPublicUser = (user) => ({
  id: user._id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  teamId: user.teamId,
});

const signToken = (user, isRememberMe = false) => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: isRememberMe ? "30d" : "1d" },
  );
};

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

exports.isFirstRunSetupOpen = async () => {
  return (await User.estimatedDocumentCount()) === 0;
};

exports.registerFirstAdmin = async (email, password, firstName, lastName) => {
  const isSetupOpen = await exports.isFirstRunSetupOpen();
  if (!isSetupOpen) {
    throw new Error("İlk kurulum tamamlandı. Kayıt endpoint'i artık kapalı.");
  }

  const user = await User.create({
    email,
    password: await hashPassword(password),
    firstName,
    lastName,
    role: "admin",
    teamId: null,
  });

  return {
    token: signToken(user, true),
    user: toPublicUser(user),
  };
};

exports.createUser = async (email, password, firstName, lastName) => {
  const userExists = await User.findOne({ email });
  if (userExists) throw new Error("Bu e-posta zaten kullanımda.");

  const user = await User.create({
    email,
    password: await hashPassword(password),
    firstName,
    lastName,
    role: "employee",
    teamId: null,
  });

  const plainUser = user.toObject();
  delete plainUser.password;
  return plainUser;
};

exports.loginUser = async (email, password, isRememberMe) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("Kullanıcı bulunamadı.");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Geçersiz şifre.");

  const token = signToken(user, isRememberMe);

  return {
    token,
    user: toPublicUser(user),
  };
};

exports.getAllUsers = async () => {
  return await User.find({}, "-password");
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.deleteUser = async (id) => {
  const user = await User.findById(id);

  if (!user) throw new Error("Kullanıcı bulunamadı.");
  if (user.role === "admin") throw new Error("Admin kullanıcı silinemez.");
  if (user.role === "team_lead") throw new Error("Takım lideri hesabı silinemez.");

  await user.deleteOne();

  const plainUser = user.toObject();
  delete plainUser.password;
  return plainUser;
};

exports.updateUserAssignment = async (id, assignment) => {
  const update = {};

  if (assignment.role !== undefined) {
    if (!["admin", "team_lead", "employee"].includes(assignment.role)) {
      throw new Error("Geçersiz kullanıcı rolü.");
    }
    update.role = assignment.role;
  }

  if (assignment.teamId !== undefined) {
    update.teamId = assignment.teamId;
  }

  const user = await User.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
    select: "-password",
  });

  if (!user) throw new Error("Kullanıcı bulunamadı.");
  return user;
};
