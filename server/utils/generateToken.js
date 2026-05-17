import jwt from "jsonwebtoken";

const generateToken = (id) => {
  return jwt.sign({ id }, "farmifysecret", {
    expiresIn: "7d",
  });
};

export default generateToken;