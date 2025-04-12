const User = require('../models/users');
const CoinTransaction = require('../models/coinTransaction');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');

// Get user's coin balance
exports.getBalance = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const user = await User.findById(userId).select('coinBalance');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      balance: user.coinBalance
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const transactions = await CoinTransaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await CoinTransaction.countDocuments({ user: userId });
    
    return res.status(200).json({
      transactions,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Initiate a coin recharge (mock payment for now)
exports.initiateRecharge = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { amount } = req.body;
    const userId = req.user._id;
    
    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    // Create a pending transaction
    const transaction = new CoinTransaction({
      user: userId,
      amount: amount,
      type: 'recharge',
      status: 'pending',
      paymentId: `mock_${uuidv4()}`,
      paymentMethod: 'mock',
      description: 'Coin recharge initiated'
    });
    
    await transaction.save({ session });
    
    // Add reference to user's transactions
    await User.findByIdAndUpdate(
      userId,
      { $push: { coinTransactions: transaction._id } },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: 'Recharge initiated successfully',
      transactionId: transaction._id,
      paymentId: transaction.paymentId
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error initiating recharge:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Complete a coin recharge (after payment)
exports.completeRecharge = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { transactionId, paymentId } = req.body;
    
    if (!transactionId || !paymentId) {
      return res.status(400).json({ message: 'Transaction ID and payment ID are required' });
    }
    
    const transaction = await CoinTransaction.findById(transactionId);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    
    if (transaction.status === 'completed') {
      return res.status(400).json({ message: 'Transaction already completed' });
    }
    
    if (transaction.paymentId !== paymentId) {
      return res.status(400).json({ message: 'Invalid payment ID' });
    }
    
    // Update transaction status
    transaction.status = 'completed';
    transaction.description = 'Coin recharge completed';
    await transaction.save({ session });
    
    // Update user's coin balance
    const user = await User.findById(transaction.user);
    user.coinBalance += transaction.amount;
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: 'Recharge completed successfully',
      balance: user.coinBalance
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error completing recharge:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Admin endpoint to give coins to a user
exports.giveCoinsToUser = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check if requester is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const { userId, amount, reason } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'User ID and valid amount are required' });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create transaction record
    const transaction = new CoinTransaction({
      user: userId,
      amount: amount,
      type: 'gift',
      status: 'completed',
      description: reason || 'Admin gift',
      metadata: {
        adminId: req.user._id
      }
    });
    
    await transaction.save({ session });
    
    // Update user's balance and transaction list
    user.coinBalance += amount;
    user.coinTransactions.push(transaction._id);
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: 'Coins added successfully',
      transaction: transaction._id,
      newBalance: user.coinBalance
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error giving coins:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
};

// Spend coins (for purchasing items or services)
exports.spendCoins = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { amount, itemId, itemType } = req.body;
    const userId = req.user._id;
    
    if (!amount || amount <= 0 || !itemId || !itemType) {
      return res.status(400).json({ message: 'Amount, item ID, and item type are required' });
    }
    
    // Get user with current balance
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user has enough coins
    if (user.coinBalance < amount) {
      return res.status(400).json({ message: 'Insufficient coin balance' });
    }
    
    // Create transaction
    const transaction = new CoinTransaction({
      user: userId,
      amount: -amount, // Negative amount for spending
      type: 'purchase',
      status: 'completed',
      description: `Purchase of ${itemType} #${itemId}`,
      metadata: {
        itemId,
        itemType
      }
    });
    
    await transaction.save({ session });
    
    // Update user's balance
    user.coinBalance -= amount;
    user.coinTransactions.push(transaction._id);
    await user.save({ session });
    
    await session.commitTransaction();
    session.endSession();
    
    return res.status(200).json({
      message: 'Purchase successful',
      transactionId: transaction._id,
      remainingBalance: user.coinBalance
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Error spending coins:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error' 
    });
  }
}; 