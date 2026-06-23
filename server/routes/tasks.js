const express = require('express');
const { body } = require('express-validator');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');
const protect = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Apply auth protection middleware to all task routes
router.use(protect);

// GET and POST tasks
router.route('/')
  .get(getTasks)
  .post(
    [
      body('title')
        .trim()
        .notEmpty().withMessage('Task title is required')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
      body('status')
        .optional()
        .isIn(['pending', 'in-progress', 'completed']).withMessage('Status must be pending, in-progress, or completed'),
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
      body('dueDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Due date must be a valid ISO8601 date')
    ],
    validate,
    createTask
  );

// PUT and DELETE tasks by ID
router.route('/:id')
  .put(
    [
      body('title')
        .optional()
        .trim()
        .notEmpty().withMessage('Task title cannot be empty')
        .isLength({ max: 100 }).withMessage('Title cannot exceed 100 characters'),
      body('status')
        .optional()
        .isIn(['pending', 'in-progress', 'completed']).withMessage('Status must be pending, in-progress, or completed'),
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high'),
      body('dueDate')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Due date must be a valid ISO8601 date')
    ],
    validate,
    updateTask
  )
  .delete(deleteTask);

module.exports = router;
