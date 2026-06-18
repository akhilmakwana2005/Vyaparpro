import Expense from '../models/Expense.js';
import { logActivity } from '../utils/logger.js';

// @desc    Get all expenses for a user
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.businessOwnerId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (expense && expense.user.toString() === req.businessOwnerId.toString()) {
      res.json(expense);
    } else {
      res.status(404).json({ message: 'Expense not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an expense
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { title, category, amount, date, paymentMode, notes } = req.body;

    const expense = new Expense({
      user: req.businessOwnerId,
      title,
      category,
      amount,
      date,
      paymentMode,
      notes,
    });

    const createdExpense = await expense.save();

    await logActivity(req, `Logged Expense: ${createdExpense.title}`, 'Expenses', `Amount: ₹${createdExpense.amount}`);

    res.status(201).json(createdExpense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { title, category, amount, date, paymentMode, notes } = req.body;
    const expense = await Expense.findById(req.params.id);

    if (expense && expense.user.toString() === req.businessOwnerId.toString()) {
      expense.title = title || expense.title;
      expense.category = category || expense.category;
      expense.amount = amount !== undefined ? amount : expense.amount;
      expense.date = date || expense.date;
      expense.paymentMode = paymentMode !== undefined ? paymentMode : expense.paymentMode;
      expense.notes = notes !== undefined ? notes : expense.notes;

      const updatedExpense = await expense.save();

      await logActivity(req, `Updated Expense: ${updatedExpense.title}`, 'Expenses', `Amount: ₹${updatedExpense.amount}`);

      res.json(updatedExpense);
    } else {
      res.status(404).json({ message: 'Expense not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (expense && expense.user.toString() === req.businessOwnerId.toString()) {
      const expenseTitle = expense.title;
      await expense.deleteOne();

      await logActivity(req, `Deleted Expense: ${expenseTitle}`, 'Expenses', `Removed expense record`);

      res.json({ message: 'Expense removed' });
    } else {
      res.status(404).json({ message: 'Expense not found or unauthorized' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
