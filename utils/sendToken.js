export const sendToken = async (res, user, message, statusCode = 200) => {
  const token = await user.generateToken();
  const options = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    secure: true,
    sameSite: "none",
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    message,
    user,
  });
};
