class TestController {
  async create(req, res, next) {
    try {
      res.json({ message: "here in create test" })
    } catch (e) {
      next(e)
      console.log(e)
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
