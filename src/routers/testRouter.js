import { Router } from "express"
import testController from "../controllers/testController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import checkRoleMiddleware from "../middlewares/checkRoleMiddleware.js"

const testRouter = Router()

testRouter.post(
  "/create",
  authMiddleware,
  checkRoleMiddleware("TEACHER"),
  testController.create
)
testRouter.get("/", authMiddleware, testController.getAll)
testRouter.get(
  "/my",
  authMiddleware,
  checkRoleMiddleware("TEACHER"),
  testController.getMy
)
testRouter.get(
  "/results/:testId",
  authMiddleware,
  checkRoleMiddleware("TEACHER"),
  testController.getResults
)
testRouter.get("/:id", authMiddleware, testController.getTest)
testRouter.post("/check", authMiddleware, testController.checkAnswers)

export default testRouter
