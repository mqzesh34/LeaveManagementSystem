const authService = require("../service/authService");

exports.createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "Tüm alanlar zorunludur" });
    }
    const user = await authService.createUser(
      email,
      password,
      firstName,
      lastName
    );
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, isRememberMe } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email ve şifre gereklidir" });
    }

    const result = await authService.loginUser(email, password, isRememberMe);

    const maxAge = isRememberMe
      ? 30 * 24 * 60 * 60 * 1000
      : 24 * 60 * 60 * 1000;

    res.cookie("token", result.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: maxAge,
    });

    res.status(200).json({
      success: true,
      user: result.user,
      token: result.token,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Başarıyla çıkış yapıldı" });
};

exports.verifyToken = async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.id);
    if (!user) return res.status(401).json({ success: false });

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        teamId: user.teamId,
      },
    });
  } catch (error) {
    res.status(401).json({ success: false });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await authService.getAllUsers();
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const user = await authService.updateUserAssignment(req.params.id, req.body);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await authService.deleteUser(req.params.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
