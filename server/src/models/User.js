import mongoose from 'mongoose'

const roles = ['basic', 'pro']

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  birthDate: {
    type: Date,
    required: true
  },
  role: {
    type: String,
    enum: roles,
    default: 'basic'
  },
  householdMembers: {
    type: Number,
    default: 1,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  proFeatures: {
    comparativeReports: {
      type: Boolean,
      default: false
    },
    collaborativeGoals: {
      type: Boolean,
      default: false
    },
    bankingIntegrations: {
      type: Boolean,
      default: false
    }
  }
})

userSchema.pre('save', function updateTimestamp (next) {
  this.updatedAt = new Date()
  next()
})

userSchema.methods.toSafeJSON = function toSafeJSON () {
  const { passwordHash, __v, ...rest } = this.toObject({ versionKey: false })
  return rest
}

export default mongoose.model('User', userSchema)
