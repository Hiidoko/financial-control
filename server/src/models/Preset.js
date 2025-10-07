import mongoose from 'mongoose'

const goalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  targetYears: { type: Number, required: true },
  priority: { type: String, enum: ['alta', 'media', 'baixa'], default: 'media' }
}, { _id: false })

const presetSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  monthlyIncome: {
    type: Number,
    required: true
  },
  monthlyExpenses: {
    type: Number,
    required: true
  },
  currentSavings: {
    type: Number,
    required: true
  },
  additionalContribution: {
    type: Number,
    default: 0
  },
  expectedReturnRate: {
    type: Number,
    default: 8
  },
  inflationRate: {
    type: Number,
    default: 4
  },
  riskTolerance: {
    type: Number,
    default: 3
  },
  scenario: {
    incomeGrowthRate: { type: Number, default: 3 },
    expenseGrowthRate: { type: Number, default: 2 },
    jobLossMonths: { type: Number, default: 2 },
    unexpectedExpense: { type: Number, default: 8000 },
    oneTimeExtraIncome: { type: Number, default: 0 },
    lifestyleInflation: { type: Number, default: 1 }
  },
  goals: {
    type: [goalSchema],
    default: []
  },
  certifiedBy: {
    type: String,
    default: null
  },
  certificationLevel: {
    type: String,
    default: null
  },
  badge: {
    type: String,
    enum: ['anbima-cpa20', 'anbima-cfp', 'especialista-parceiro', null],
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

presetSchema.methods.toJSON = function toJSON () {
  const { __v, ...rest } = this.toObject({ versionKey: false })
  return rest
}

export default mongoose.model('Preset', presetSchema)
