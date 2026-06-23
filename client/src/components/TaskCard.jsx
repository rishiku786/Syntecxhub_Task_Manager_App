import React from 'react';
import { FiEdit2, FiTrash2, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const TaskCard = ({ task, onEdit, onDelete, onStatusChange }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in-progress': return 'status-inprogress';
      default: return 'status-pending';
    }
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className={`task-card ${isOverdue ? 'task-overdue' : ''}`}>
      <div className="task-card-header">
        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
          <FiAlertCircle className="badge-icon" />
          {task.priority}
        </span>
        <div className="task-card-actions">
          <button className="icon-btn edit-btn" onClick={() => onEdit(task)} title="Edit Task">
            <FiEdit2 />
          </button>
          <button className="icon-btn delete-btn" onClick={() => onDelete(task._id)} title="Delete Task">
            <FiTrash2 />
          </button>
        </div>
      </div>

      <h3 className="task-card-title">{task.title}</h3>
      <p className="task-card-desc">{task.description || 'No description provided.'}</p>

      <div className="task-card-meta">
        <div className={`task-date ${isOverdue ? 'date-overdue' : ''}`}>
          <FiCalendar className="meta-icon" />
          <span>{formatDate(task.dueDate)}</span>
        </div>
        
        <div className="task-quick-status">
          <select 
            value={task.status} 
            onChange={(e) => onStatusChange(task._id, e.target.value)}
            className={`status-selector ${getStatusClass(task.status)}`}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
