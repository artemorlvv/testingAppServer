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
testRouter.get("/:id", authMiddleware, testController.getTest)
testRouter.post("/check", authMiddleware, testController.checkAnswers)

export default testRouter
