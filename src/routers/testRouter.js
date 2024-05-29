import { Router } from "express"
import testController from "../controllers/testController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import checkRoleMiddleware from "../middlewares/checkRoleMiddleware.js"

const testRouter = Router()

testRouter.post(
  "/",
  authMiddleware,
  checkRoleMiddleware("TEACHER"),
  testController.create
)
testRouter.get("/", authMiddleware, testController.getAll)

export default testRouter
