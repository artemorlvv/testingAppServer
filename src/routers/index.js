import { Router } from "express"
import userRouter from "./userRouter.js"
import testRouter from "./testRouter.js"

const router = Router()

router.use("/user", userRouter)
router.use("/test", testRouter)

export default router
