import { User } from "../database/models.js"
import ApiErrors from "../errors/ApiErrors.js"

export default (roles) => async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { login: req.user_info.login } })
    if (!roles.includes(user.role)) throw ApiErrors.forbidden("Нет доступа")
    next()
  } catch (e) {
    next(e)
  }
}
