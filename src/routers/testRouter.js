import { Router } from "express"
import testController from "../controllers/testController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import checkRoleMiddleware from "../middlewares/checkRoleMiddleware.js"

const testRouter = Router()

testRouter.post(
  "/create",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.create
)
testRouter.get("/", authMiddleware, testController.getAll)
testRouter.get(
  "/my",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.getMy
)
testRouter.get(
  "/results/:testId",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.getResults
)
testRouter.post(
  "/results/:testId",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.getResultsWithParams
)
testRouter.put(
  "/change_answers_visible/:testId",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.changeAnswersVisible
)
testRouter.get("/:id", authMiddleware, testController.getTest)
testRouter.get(
  "/result/:id",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.getTestResult
)
testRouter.get(
  "/stats/:testId",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.getQuestionStats
)
testRouter.delete(
  "/:id",
  authMiddleware,
  checkRoleMiddleware(["TEACHER", "ADMIN"]),
  testController.deleteTest
)
testRouter.post("/check", authMiddleware, testController.checkAnswers)

export default testRouter
