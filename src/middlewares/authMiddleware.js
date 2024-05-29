import ApiErrors from "../errors/ApiErrors.js"
import jwt from "jsonwebtoken"

export default (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) throw ApiErrors.unauthorized("Не авторизован")

    const decoded = jwt.verify(token, process.env.ACCESS_SECRET)
    if (!decoded) throw ApiErrors.unauthorized("Не авторизован")
    const { login } = decoded
    req.user_info = { login }
    next()
  } catch (e) {
    next(ApiErrors.unauthorized("Не авторизован"))
  }
}
