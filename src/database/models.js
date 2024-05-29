import { sequelize } from "./index.js"
import { DataTypes } from "sequelize"

const User = sequelize.define("User", {
  first_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  second_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  login: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM("USER", "ADMIN", "TEACHER"),
    allowNull: false,
    defaultValue: "USER",
  },
})

const Test = sequelize.define("Test", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING,
  },
})

const Question = sequelize.define("Question", {
  question_text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.ENUM("radio", "checkbox", "input"),
    allowNull: false,
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
})

const Option = sequelize.define("Option", {
  option_text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
})

const Answer = sequelize.define("Answer", {
  answer_text: {
    type: DataTypes.STRING,
  },
})

const Result = sequelize.define("Result", {
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  passed_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
})

Test.belongsTo(User, { foreignKey: "created_by" })
User.hasMany(Test, { foreignKey: "created_by" })

Question.belongsTo(Test, { foreignKey: "test_id" })
Test.hasMany(Question, { foreignKey: "test_id" })

Option.belongsTo(Question, { foreignKey: "question_id" })
Question.hasMany(Option, { foreignKey: "question_id" })

Answer.belongsTo(User, { foreignKey: "user_id" })
User.hasMany(Answer, { foreignKey: "user_id" })

Answer.belongsTo(Question, { foreignKey: "question_id" })
Question.hasMany(Answer, { foreignKey: "question_id" })

Answer.belongsTo(Option, { foreignKey: "selected_option_id", allowNull: true })
Option.hasMany(Answer, { foreignKey: "selected_option_id" })

Result.belongsTo(User, { foreignKey: "user_id" })
User.hasMany(Result, { foreignKey: "user_id" })

Result.belongsTo(Test, { foreignKey: "test_id" })
Test.hasMany(Result, { foreignKey: "test_id" })

export { User }
