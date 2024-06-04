import { sequelize } from "../database/index.js"
import { Option, Question, Test, User } from "../database/models.js"
import ApiErrors from "../errors/ApiErrors.js"

class TestController {
  async create(req, res, next) {
    const t = await sequelize.transaction()
    try {
      let { title, description, questions } = req.body
      const { login } = req.user_info
      if (!title) throw ApiErrors.badRequest("Не указано название теста")
      if (!questions || !Array.isArray(questions) || questions.length === 0)
        throw ApiErrors.badRequest("Нельзя создать тест без вопросов")
      title = title.trim()
      if (description) description = description.trim()
      const user = await User.findOne({ where: { login } })
      const test = await Test.create(
        {
          created_by: user.id,
          title,
          description,
        },
        { transaction: t }
      )

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i]
        const { question_text, question_type, options, correct_answer } =
          question

        if (question_type === "input") {
          if (!correct_answer || correct_answer.trim() === "")
            throw ApiErrors.badRequest(
              `Не указан правильный ответ в вопросе №${i + 1}`
            )
        }

        const createdQuestion = await Question.create(
          {
            test_id: test.id,
            question_text,
            question_type,
            correct_answer: question_type === "input" ? correct_answer : null,
            order: i + 1,
          },
          { transaction: t }
        )

        if (question_type === "radio" || question_type === "checkbox") {
          for (const option of options) {
            await Option.create(
              {
                question_id: createdQuestion.id,
                option_text: option.option_text,
                is_correct: option.is_correct,
              },
              { transaction: t }
            )
          }
        }
      }
      await t.commit()
      res.json({ message: "here in create test" })
    } catch (e) {
      await t.rollback()
      console.log("ошибка")
      console.log(e)
      next(e)
    }
  }

  async getAll(req, res, next) {
    try {
      const tests = await Test.findAll()
      console.log(tests)
      res.json(tests)
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async getTest(req, res, next) {
    try {
      const { id } = req.params
      const test = await Test.findOne({ where: { id } })
      const questions = await Question.findAll({
        where: { test_id: id },
        order: [["order", "ASC"]],
      })
      // const formattedQuestions = questions.map((question) => {
      //   const { test_id, correct_answer, ...rest } = question.toJSON()
      //   return rest
      // })
      const formattedQuestions = await Promise.all(
        questions.map(async (question) => {
          const options = await Option.findAll({
            where: { question_id: question.id },
            order: [["id", "ASC"]],
          })

          const formattedOptions = options.map((option) => {
            const { is_correct, question_id, ...rest } = option.toJSON()
            return rest
          })

          const { test_id, correct_answer, ...rest } = question.toJSON()
          return {
            ...rest,
            options: formattedOptions,
          }
        })
      )
      return res.json({ title: test.title, questions: formattedQuestions })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async test(req, res, next) {
    try {
    } catch (e) {
      next(e)
      console.log(e)
    }
  }
}

export default new TestController()
