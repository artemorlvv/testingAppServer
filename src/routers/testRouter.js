import { Router } from "express"
import testController from "../controllers/testController.js"

const testRouter = Router()

testRouter.post("/", testController.create)

export default testRouter
