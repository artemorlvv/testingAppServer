import { Router } from "express"
import userController from "../controllers/userController.js"
import authMiddleware from "../middlewares/authMiddleware.js"
import checkRoleMiddleware from "../middlewares/checkRoleMiddleware.js"

const userRouter = Router()

userRouter.post("/registration", userController.registration)
userRouter.post("/login", userController.login)
userRouter.get("/auth", authMiddleware, userController.auth)
userRouter.get("/refresh", userController.refresh)
userRouter.get("/logout", userController.logout)
userRouter.get(
  "/all",
  authMiddleware,
  checkRoleMiddleware(["ADMIN"]),
  userController.getAll
)
userRouter.post(
  "/change_role",
  authMiddleware,
  checkRoleMiddleware(["ADMIN"]),
  userController.changeRole
)
userRouter.delete(
  "/:id",
  authMiddleware,
  checkRoleMiddleware(["ADMIN"]),
  userController.deleteUser
)

export default userRouter
