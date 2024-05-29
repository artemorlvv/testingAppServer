import jwt from "jsonwebtoken"

class TokenService {
  generateTokens(payload) {
    const accessToken = jwt.sign(payload, process.env.ACCESS_SECRET, {
      expiresIn: "24h",
    })
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET, {
      expiresIn: "30d",
    })
    return {
      accessToken,
      refreshToken,
    }
  }
}

export default new TokenService()
