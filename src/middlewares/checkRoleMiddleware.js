import { User } from "../database/models.js"
import ApiErrors from "../errors/ApiErrors.js"

export default (role) => async (req, res, next) => {
  try {
    const user = await User.findOne({ where: { login: req.user_info.login } })
    if (user.role !== role) throw ApiErrors.forbidden("Нет доступа")
    next()
  } catch (e) {
    next(e)
  }
}
