import { Op, literal } from "sequelize"
import { sequelize } from "../database/index.js"
import {
  Answer,
  Option,
  Question,
  Result,
  Test,
  User,
} from "../database/models.js"
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
      res.json({ id: test.id })
    } catch (e) {
      await t.rollback()
      console.log(e)
      next(e)
    }
  }

  async getAll(req, res, next) {
    try {
      const { user_info } = req
      const { first_name, second_name, title, dateOrder, result } = req.query
      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = 5
      const offset = (page - 1) * pageSize

      const user = await User.findOne({ where: { login: user_info.login } })

      const where = {
        [Op.and]: [],
      }
      if (title && title.trim() !== "") {
        where[Op.and].push({ title: { [Op.iLike]: `%${title.trim()}%` } })
      }
      if (result === "notPassed") {
        where[Op.and].push({
          id: {
            [Op.notIn]: literal(
              `(SELECT "test_id" FROM "Result" WHERE "user_id" = ${user.id})`
            ),
          },
        })
      }

      const userWhere = {}
      if (first_name && first_name.trim() !== "")
        userWhere.first_name = { [Op.iLike]: `${first_name.trim()}%` }
      if (second_name && second_name.trim() !== "")
        userWhere.secondName = { [Op.iLike]: `${second_name.trim()}%` }

      const { count, rows: tests } = await Test.findAndCountAll({
        where,
        include: [
          {
            model: Result,
            where: {
              user_id: user.id,
            },
            attributes: ["score"],
            required: result === "passed" ? true : false,
          },
          {
            model: User,
            attributes: ["first_name", "second_name"],
            where: userWhere,
          },
          {
            model: Question,
            attributes: ["id"],
          },
        ],
        offset,
        limit: pageSize,
        order: [["created_at", dateOrder]],
      })

      const totalPages = Math.ceil(count / pageSize)

      res.json({ tests, totalPages, count })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async getResults(req, res, next) {
    try {
      const { testId } = req.params
      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = 5
      const offset = (page - 1) * pageSize

      const testInfo = await Test.findOne({
        where: { id: testId },
        attributes: [
          "title",
          [
            sequelize.fn("COUNT", sequelize.col("Questions.id")),
            "question_count",
          ],
        ],
        include: [
          {
            model: Question,
            attributes: [],
          },
        ],
        group: ["Test.id"],
      })

      // Получаем количество пользователей, сдавших тест
      const passedCount = await Result.count({
        where: { test_id: testId },
      })

      const totalPages = Math.ceil(passedCount / pageSize)
      // Получаем информацию о результатах, включая информацию о пользователях
      const resultInfo = await Result.findAll({
        where: { test_id: testId },
        attributes: ["id", "score", "passed_at"],
        include: [
          {
            model: User,
            attributes: ["id", "first_name", "second_name", "login"],
          },
        ],
        limit: pageSize,
        offset,
        order: [["passed_at", "DESC"]],
      })

      // Форматируем результаты
      const formattedResults = resultInfo.map((result) => ({
        resultId: result.id,
        userId: result.User.id,
        firstName: result.User.first_name,
        secondName: result.User.second_name,
        login: result.User.login,
        passedAt: result.passed_at,
        score: result.score,
      }))

      return res.json({
        totalPages,
        testTitle: testInfo.title,
        questionCount: testInfo.dataValues.question_count,
        passedCount: passedCount,
        results: formattedResults,
      })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async getResultsWithParams(req, res, next) {
    try {
      const { testId } = req.params
      const { first_name, second_name, login, dateOrder, scoreOrder } = req.body
      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = 5
      const offset = (page - 1) * pageSize

      const where = {}
      if (first_name.trim() !== "")
        where.first_name = { [Op.iLike]: `${first_name.trim()}%` }
      if (second_name.trim() !== "")
        where.second_name = { [Op.iLike]: `${second_name.trim()}%` }
      if (login.trim() !== "") where.login = { [Op.iLike]: `${login.trim()}%` }

      const order = []
      if (dateOrder.trim() !== "") order.push(["passed_at", dateOrder])
      if (scoreOrder.trim() !== "") order.push(["score", scoreOrder])

      const totalResults = await Result.count({
        where: { test_id: testId },
        include: [
          {
            model: User,
            where,
          },
        ],
      })

      const totalPages = Math.ceil(totalResults / pageSize)

      const resultInfo = await Result.findAll({
        where: { test_id: testId },
        attributes: ["id", "score", "passed_at"],
        include: [
          {
            model: User,
            attributes: ["id", "first_name", "second_name", "login"],
            where,
          },
        ],
        limit: pageSize,
        offset,
        order,
      })

      const formattedResults = resultInfo.map((result) => ({
        userId: result.User.id,
        firstName: result.User.first_name,
        secondName: result.User.second_name,
        login: result.User.login,
        passedAt: result.passed_at,
        score: result.score,
      }))

      return res.json({
        results: formattedResults,
        totalPages,
      })
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
      })
      const { login } = req.user_info
      const user = await User.findOne({ where: { login } })
      const result = await Result.findOne({
        where: { user_id: user.id, test_id: test.id },
      })

      const userAnswers = await Answer.findAll({
        where: { user_id: user.id, question_id: questions.map((q) => q.id) },
      })

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

      const formattedUserAnswers = {}
      const correctAnswers = {}
      if (userAnswers)
        await Promise.all(
          userAnswers.map(async (answer) => {
            const { question_type, correct_answer } = questions.find(
              (q) => q.id === answer.question_id
            )
            // formattedUserAnswers[answer.question_id] = question_type
            if (question_type === "input") {
              formattedUserAnswers[answer.question_id] = answer.answer_text
              correctAnswers[answer.question_id] = correct_answer
            } else if (question_type === "radio") {
              formattedUserAnswers[answer.question_id] =
                answer.selected_option_id
              const foundOption = await Option.findOne({
                where: { question_id: answer.question_id, is_correct: true },
              })
              correctAnswers[answer.question_id] = foundOption.id
            } else if (question_type === "checkbox") {
              if (!formattedUserAnswers[answer.question_id])
                formattedUserAnswers[answer.question_id] = []
              formattedUserAnswers[answer.question_id].push(
                answer.selected_option_id
              )
              if (!correctAnswers[answer.question_id]) {
                const correctOptions = await Option.findAll({
                  where: { question_id: answer.question_id, is_correct: true },
                })
                const correctOptionIds = correctOptions.map(
                  (option) => option.id
                )
                correctAnswers[answer.question_id] = correctOptionIds
              }
            }
          })
        )

      const results = {}

      if (result) {
        for (const question of questions) {
          const correctAnswer = question.correct_answer
          const questionId = question.id
          const questionType = question.question_type

          const userAnswer = formattedUserAnswers[questionId]

          if (questionType === "input") {
            results[questionId] = userAnswer === correctAnswer
          } else if (questionType === "radio") {
            const correctOption = await Option.findOne({
              where: { question_id: questionId, is_correct: true },
            })
            results[questionId] =
              correctOption && correctOption.id === userAnswer
          } else if (questionType === "checkbox") {
            const correctOptions = await Option.findAll({
              where: { question_id: questionId, is_correct: true },
            })
            const correctOptionIds = correctOptions.map((option) => option.id)

            results[questionId] =
              Array.isArray(userAnswer) &&
              userAnswer.length === correctOptionIds.length &&
              userAnswer.every((answer) => correctOptionIds.includes(answer))
          }
        }
      }

      return res.json({
        title: test.title,
        questions: formattedQuestions,
        result,
        userAnswers: formattedUserAnswers,
        correctOptions: results,
        correctAnswers,
      })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async getTestResult(req, res, next) {
    try {
      const { id } = req.params

      const result = await Result.findOne({
        where: { id },

        include: [
          {
            model: User,
          },
          {
            model: Test,
            include: [
              {
                model: Question,
              },
            ],
          },
        ],
      })

      const user = result.User

      const test = result.Test

      const questions = test.Questions

      const userAnswers = await Answer.findAll({
        where: { user_id: user.id, question_id: questions.map((q) => q.id) },
      })

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

      const formattedUserAnswers = {}
      const correctAnswers = {}
      if (userAnswers)
        await Promise.all(
          userAnswers.map(async (answer) => {
            const { question_type, correct_answer } = questions.find(
              (q) => q.id === answer.question_id
            )
            // formattedUserAnswers[answer.question_id] = question_type
            if (question_type === "input") {
              formattedUserAnswers[answer.question_id] = answer.answer_text
              correctAnswers[answer.question_id] = correct_answer
            } else if (question_type === "radio") {
              formattedUserAnswers[answer.question_id] =
                answer.selected_option_id
              const foundOption = await Option.findOne({
                where: { question_id: answer.question_id, is_correct: true },
              })
              correctAnswers[answer.question_id] = foundOption.id
            } else if (question_type === "checkbox") {
              if (!formattedUserAnswers[answer.question_id])
                formattedUserAnswers[answer.question_id] = []
              formattedUserAnswers[answer.question_id].push(
                answer.selected_option_id
              )
              if (!correctAnswers[answer.question_id]) {
                const correctOptions = await Option.findAll({
                  where: { question_id: answer.question_id, is_correct: true },
                })
                const correctOptionIds = correctOptions.map(
                  (option) => option.id
                )
                correctAnswers[answer.question_id] = correctOptionIds
              }
            }
          })
        )

      const results = {}

      if (result) {
        for (const question of questions) {
          const correctAnswer = question.correct_answer
          const questionId = question.id
          const questionType = question.question_type

          const userAnswer = formattedUserAnswers[questionId]

          if (questionType === "input") {
            results[questionId] = userAnswer === correctAnswer
          } else if (questionType === "radio") {
            const correctOption = await Option.findOne({
              where: { question_id: questionId, is_correct: true },
            })
            results[questionId] =
              correctOption && correctOption.id === userAnswer
          } else if (questionType === "checkbox") {
            const correctOptions = await Option.findAll({
              where: { question_id: questionId, is_correct: true },
            })
            const correctOptionIds = correctOptions.map((option) => option.id)

            results[questionId] =
              Array.isArray(userAnswer) &&
              userAnswer.length === correctOptionIds.length &&
              userAnswer.every((answer) => correctOptionIds.includes(answer))
          }
        }
      }

      return res.json({
        title: test.title,
        questions: formattedQuestions,
        result,
        userAnswers: formattedUserAnswers,
        correctOptions: results,
        correctAnswers,
        user: {
          first_name: user.first_name,
          second_name: user.second_name,
          login: user.login,
        },
      })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async checkAnswers(req, res, next) {
    try {
      const { testId, selectedOptions } = req.body
      const { login } = req.user_info
      const user = await User.findOne({ where: { login } })
      // Fetch the test and its questions
      const test = await Test.findOne({ where: { id: testId } })
      if (!test) {
        return res.status(404).json({ error: "Test not found" })
      }

      const questions = await Question.findAll({ where: { test_id: testId } })

      // Prepare a response object to hold the correctness and correct answers
      const results = {}
      const correctAnswers = {}
      let resultScore = 0

      for (const question of questions) {
        const correctAnswer = question.correct_answer
        const questionId = question.id
        const questionType = question.question_type

        // Get the user's answer for the current question
        const userAnswer = selectedOptions[questionId]

        if (questionType === "input") {
          // For input type questions, compare directly
          results[questionId] = userAnswer === correctAnswer
          correctAnswers[questionId] = correctAnswer
          if (results[questionId]) resultScore++
          await Answer.create({
            user_id: user.id,
            question_id: questionId,
            answer_text: userAnswer,
          })
        } else if (questionType === "radio") {
          // For radio type questions, find the correct option
          const correctOption = await Option.findOne({
            where: { question_id: questionId, is_correct: true },
          })
          results[questionId] = correctOption && correctOption.id === userAnswer
          correctAnswers[questionId] = correctOption ? correctOption.id : null
          if (results[questionId]) resultScore++
          await Answer.create({
            user_id: user.id,
            question_id: questionId,
            selected_option_id: userAnswer,
          })
        } else if (questionType === "checkbox") {
          // For checkbox type questions, find all correct options
          const correctOptions = await Option.findAll({
            where: { question_id: questionId, is_correct: true },
          })
          const correctOptionIds = correctOptions.map((option) => option.id)

          // Check if user's answers match the correct options
          results[questionId] =
            Array.isArray(userAnswer) &&
            userAnswer.length === correctOptionIds.length &&
            userAnswer.every((answer) => correctOptionIds.includes(answer))
          correctAnswers[questionId] = correctOptionIds
          if (results[questionId]) resultScore++
          for (const answer of userAnswer) {
            await Answer.create({
              user_id: user.id,
              question_id: questionId,
              selected_option_id: answer,
            })
          }
        }
      }
      const result = await Result.create({
        score: resultScore,
        passed_at: new Date(),
        user_id: user.id,
        test_id: test.id,
      })

      // Send back the results and correct answers
      return res.json({
        correctOptions: results,
        correctAnswers,
        result,
      })
    } catch (e) {
      next(e)
      console.log(e)
    }
  }

  async getMy(req, res, next) {
    try {
      const { user_info } = req
      const { title, dateOrder } = req.query
      const page = req.query.page ? parseInt(req.query.page) : 1
      const pageSize = 5
      const offset = (page - 1) * pageSize

      const user = await User.findOne({ where: { login: user_info.login } })

      const where = { created_by: user.id }
      if (title && title.trim() !== "") {
        where.title = { [Op.iLike]: `%${title.trim()}%` }
      }

      const { count, rows: tests } = await Test.findAndCountAll({
        where,
        include: [
          {
            model: Question,
            attributes: ["id"],
          },
          {
            model: Result,
            attributes: ["id"],
          },
        ],
        offset,
        limit: pageSize,
        order: [["created_at", dateOrder]],
      })

      const totalPages = Math.ceil(count / pageSize)

      res.json({ tests, totalPages, count })
      return res.json({ tests })
    } catch (e) {
      next(e)
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
