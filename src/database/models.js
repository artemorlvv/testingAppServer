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
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "USER",
  },
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
})

const Test = sequelize.define("Test", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  answers_visible: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    default: false,
  },
})

const Question = sequelize.define("Question", {
  question_text: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  question_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  correct_answer: {
    type: DataTypes.STRING,
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

const UserQuestion = sequelize.define("UserQuestion", {
  is_correct: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
})

Test.belongsTo(User, { foreignKey: "created_by", onDelete: "CASCADE" })
User.hasMany(Test, { foreignKey: "created_by", onDelete: "CASCADE" })

Question.belongsTo(Test, { foreignKey: "test_id", onDelete: "CASCADE" })
Test.hasMany(Question, { foreignKey: "test_id", onDelete: "CASCADE" })

Option.belongsTo(Question, { foreignKey: "question_id", onDelete: "CASCADE" })
Question.hasMany(Option, { foreignKey: "question_id", onDelete: "CASCADE" })

Answer.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" })
User.hasMany(Answer, { foreignKey: "user_id", onDelete: "CASCADE" })

Answer.belongsTo(Question, { foreignKey: "question_id", onDelete: "CASCADE" })
Question.hasMany(Answer, { foreignKey: "question_id", onDelete: "CASCADE" })

Answer.belongsTo(Option, {
  foreignKey: "selected_option_id",
  allowNull: true,
  onDelete: "CASCADE",
})
Option.hasMany(Answer, {
  foreignKey: "selected_option_id",
  onDelete: "CASCADE",
})

Result.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" })
User.hasMany(Result, { foreignKey: "user_id", onDelete: "CASCADE" })

Result.belongsTo(Test, { foreignKey: "test_id", onDelete: "CASCADE" })
Test.hasMany(Result, { foreignKey: "test_id", onDelete: "CASCADE" })

UserQuestion.belongsTo(User, { foreignKey: "user_id", onDelete: "CASCADE" })
User.hasMany(UserQuestion, { foreignKey: "user_id", onDelete: "CASCADE" })

UserQuestion.belongsTo(Question, {
  foreignKey: "question_id",
  onDelete: "CASCADE",
})
Question.hasMany(UserQuestion, {
  foreignKey: "question_id",
  onDelete: "CASCADE",
})

export { User, Test, Question, Option, Answer, Result, UserQuestion }
