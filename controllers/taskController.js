const Task = require('../models/Task');
const AppError = require('../utils/appError');

exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ user: req.user.id });

    res.status(200).json({
      status: 'success',
      results: tasks.length,
      data: {
        tasks
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const { title, description, category, dueDate, priority } = req.body;

    const newTask = await Task.create({
      title,
      description,
      category,
      dueDate,
      priority,
      user: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        task: newTask
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return next(new AppError('No task found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        task
      }
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return next(new AppError('No task found with that ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

exports.getTaskAnalytics = async (req, res, next) => {
  try {
    const stats = await Task.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueToday = await Task.countDocuments({
      user: req.user._id,
      dueDate: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        stats,
        dueToday
      }
    });
  } catch (err) {
    next(err);
  }
};