import mongoose from "mongoose"

const queryHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  userQuery: {
    type: String,
    required: true,
  },
  sqlQuery: {
    type: String,
    required: true,
  },
  results: {
    type: Array,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model("QueryHistory", queryHistorySchema)
