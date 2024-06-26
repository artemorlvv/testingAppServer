import { Op, literal } from "sequelize"
import { User } from "../database/models.js"
import ApiErrors from "../errors/ApiErrors.js"
import bcrypt from "bcrypt"
import tokenService from "../services/tokenService.js"
import jwt from "jsonwebtoken"

class UserController {
  async registration(req, res, next) {
    try {
      let { login, password, first_name, second_name } = req.body
      if (!first_name || !second_name)
        throw ApiErrors.badRequest("Не указано имя или фамилия")
      if (!login || !password)
        throw ApiErrors.badRequest("Не указан логин или пароль")
      login = login.trim()
      password = password.trim()
      first_name = first_name.trim()
      second_name = second_name.trim()
      if (!login.length || !password.length)
        throw ApiErrors.badRequest("Не указан логин или пароль")
      if (!first_name || !second_name)
        throw ApiErrors.badRequest("Не указано имя или фамилия")
      if (first_name.length < 4 || first_name.length > 20)
        throw ApiErrors.badRequest("Имя должно быть длиной от 4 до 20 символов")
      if (second_name.length < 4 || second_name.length > 20)
        throw ApiErrors.badRequest(
          "Фамилия должна быть длиной от 4 до 20 символов"
        )
      if (login.length < 4 || login.length > 20)
        throw ApiErrors.badRequest(
          "Логин должен быть длиной от 4 до 20 символов"
        )
      if (password.length < 6 || password.length > 20)
        throw ApiErrors.badRequest(
          "Пароль должен быть длиной от 6 до 20 символов"
        )

      const candidate = await User.findOne({
        where: {
          login: { [Op.iLike]: login },
        },
      })
      if (candidate) throw ApiErrors.conflict("Введенный логин уже занят")

      const encryptedPassword = bcrypt.hashSync(password, 5)

      const tokens = tokenService.generateTokens({ login })

      const user = await User.create({
        login,
        first_name,
        second_name,
        password: encryptedPassword,
      })

      res.cookie("refreshToken", tokens.refreshToken, { httpOnly: true })

      return res.json({
        accessToken: tokens.accessToken,
        login: user.login,
        first_name: user.first_name,
        second_name: user.second_name,
        role: user.role,
      })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async login(req, res, next) {
    try {
      let { login, password } = req.body
      if (!login || !password)
        throw ApiErrors.badRequest("Не указан логин или пароль")
      login = login.trim()
      password = password.trim()
      if (!login.length || !password.length)
        throw ApiErrors.badRequest("Не указан логин или пароль")
      if (login.length < 4 || login.length > 20)
        throw ApiErrors.badRequest(
          "Логин должен быть длиной от 4 до 20 символов"
        )
      if (password.length < 6 || password.length > 20)
        throw ApiErrors.badRequest(
          "Пароль должен быть длиной от 6 до 20 символов"
        )

      const user = await User.findOne({
        where: { login },
      })
      if (!user)
        throw ApiErrors.badRequest("Пользователь с таким логином не найден")

      const decryptedPassword = bcrypt.compareSync(password, user.password)

      if (!decryptedPassword) throw ApiErrors.badRequest("Неправильный пароль")

      const tokens = tokenService.generateTokens({
        login: user.login,
      })

      res.cookie("refreshToken", tokens.refreshToken)

      return res.json({
        accessToken: tokens.accessToken,
        login: user.login,
        first_name: user.first_name,
        second_name: user.second_name,
        role: user.role,
      })
    } catch (e) {
      next(e)
    }
  }

  async auth(req, res, next) {
    try {
      const { user_info } = req
      const user = await User.findOne({ where: { login: user_info.login } })
      return res.json({
        login: user.login,
        role: user.role,
        first_name: user.first_name,
        second_name: user.second_name,
      })
    } catch (e) {
      next(e)
    }
  }
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.cookies
      if (!refreshToken) throw ApiErrors.unauthorized("Не авторизован")

      const verified = jwt.verify(refreshToken, process.env.REFRESH_SECRET)
      if (!verified) throw ApiErrors.unauthorized("Не авторизован")

      const user = await User.findOne({ where: { login: verified.login } })
      if (!user) throw ApiErrors.unauthorized("Не авторизован")

      const tokens = tokenService.generateTokens({
        login: user.login,
      })

      res.cookie("refreshToken", tokens.refreshToken)

      return res.json({ accessToken: tokens.accessToken })
    } catch (e) {
      console.log(e)
      next(e)
    }
  }

  async logout(req, res, next) {
    try {
      res.clearCookie("refreshToken")
      return res.json({ message: "logout" })
    } catch (e) {
      console.log(e)
      next(e)
    }
  }

  async getAll(req, res, next) {
    try {
      const { login, first_name, second_name, role, dateOrder } = req.query

      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = 5
      const offset = (page - 1) * pageSize

      const where = {}

      if (first_name && first_name.trim() !== "")
        where.first_name = { [Op.iLike]: `${first_name.trim()}%` }
      if (second_name && second_name.trim() !== "")
        where.second_name = { [Op.iLike]: `${second_name.trim()}%` }
      if (login && login.trim() !== "")
        where.login = { [Op.iLike]: `${login.trim()}%` }
      if (role && role.trim() !== "")
        where.role = {
          [Op.iLike]: `${role.trim()}`,
        }

      const { count, rows: users } = await User.findAndCountAll({
        where,
        order: [["registration_date", dateOrder]],
        offset,
        limit: pageSize,
        attributes: [
          "id",
          "first_name",
          "second_name",
          "login",
          "role",
          "registration_date",
        ],
      })
      const totalPages = Math.ceil(count / pageSize)
      return res.json({ users, totalPages, count })
    } catch (e) {
      next(e)
    }
  }

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params
      const user = await User.findOne({ where: { id } })
      await user.destroy()
      res.json({ message: "удален" })
    } catch (e) {
      next(e)
    }
  }

  async changeRole(req, res, next) {
    try {
      const { userId, role } = req.body
      const user = await User.findOne({ where: { id: userId } })
      user.role = role
      user.save()
      res.json({ message: "Успешно" })
    } catch (e) {
      console.log(e)
    }
  }
}

export default new UserController()
