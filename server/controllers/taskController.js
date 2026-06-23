const Task = require('../models/Task');

// @desc    Get all user tasks (with search, filtering & sorting)
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const filter = { user: req.user.id };

    // Filtering by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filtering by priority
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Search query in title and description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Sorting query
    let sortBy = '-createdAt'; // Default sorting
    if (req.query.sort) {
      // Validate sort options to prevent injection or invalid field sorting
      const allowedSorts = ['createdAt', '-createdAt', 'dueDate', '-dueDate', 'priority', '-priority', 'title', '-title'];
      if (allowedSorts.includes(req.query.sort)) {
        sortBy = req.query.sort;
      }
    }

    const tasks = await Task.find(filter).sort(sortBy);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      user: req.user.id,
      title,
      description,
      status,
      priority,
      dueDate
    });

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Make sure task belongs to the user
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const { title, description, status, priority, dueDate } = req.body;
    
    // Build update object
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;

    task = await Task.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      task
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Make sure task belongs to the user
    if (task.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task removed successfully'
    });
  } catch (error) {
    next(error);
  }
};
