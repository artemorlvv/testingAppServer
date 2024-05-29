import { Router } from "express"
import userController from "../controllers/userController.js"
import authMiddleware from "../middlewares/authMiddleware.js"

const userRouter = Router()

userRouter.post("/registration", userController.registration)
userRouter.post("/login", userController.login)
userRouter.get("/auth", authMiddleware, userController.auth)
userRouter.get("/refresh", userController.refresh)
userRouter.get("/logout", userController.logout)

export default userRouter
