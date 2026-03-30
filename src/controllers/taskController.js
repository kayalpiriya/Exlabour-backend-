import Task from '../models/Task.js';
import User from '../models/User.js';
import { broadcastNotification } from '../utils/notificationHelper.js';

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (User only)
export const createTask = async (req, res) => {
    try {
        const { title, description, category, budgetMin, budgetMax, deadline, location } = req.body;

        // Validation
        if (!title || !description || !category || !budgetMin || !budgetMax || !deadline || !location) {
            return res.status(400).json({ message: 'Please fill all required fields' });
        }

        if (Number(budgetMin) > Number(budgetMax)) {
            return res.status(400).json({ message: 'Minimum budget cannot be greater than maximum budget' });
        }

        // Check if user is verified
        if (req.user.verificationStatus !== 'verified') {
            return res.status(403).json({ message: 'Your account must be verified to create tasks' });
        }

        // const attachments = req.files ? req.files.map(file => file.path) : [];
        const attachments = Array.isArray(req.files)
            ? req.files.map(file => file.path || file.secure_url || '')
            : [];

        console.log('UPLOADED FILES:', req.files);
        console.log('SAVED ATTACHMENTS:', attachments);

        const task = await Task.create({
            userId: req.user._id,
            title,
            description,
            category,
            budgetMin,
            budgetMax,
            deadline,
            location,
            attachments
        });

        // Notify admins about new task requiring approval
        try {
            const admins = await User.find({ role: 'admin' }).select('_id');
            const adminIds = admins.map(a => a._id);
            await broadcastNotification({
                userIds: adminIds,
                title: 'New Task Pending Approval',
                message: `User ${req.user.name} created a new task "${title}" that requires approval.`,
                type: 'task_creation',
                relatedId: task._id,
                room: 'admin'
            });
        } catch (notifErr) {
            console.error('Notification error on task creation:', notifErr.message);
        }

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get tasks based on role
// @route   GET /api/tasks
// @access  Private
export const getTasks = async (req, res) => {
    try {
        let filter = {};

        // Taskers only see approved + open tasks
        if (req.user.role === 'tasker') {
            filter.approvalStatus = 'approved';
            filter.taskStatus = 'open_for_bidding';
        }

        // Users only see their own tasks
        if (req.user.role === 'user') {
            filter.userId = req.user._id;
        }


        console.log("🔍 MONGODB FILTER BEING APPLIED:", filter); // DEBUG 2


        // Admin sees everything (no filter)

        // Search & filter support via query params
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.location) {
            filter.location = { $regex: req.query.location, $options: 'i' };
        }
        if (req.query.search) {
            filter.title = { $regex: req.query.search, $options: 'i' };
        }
        if (req.query.budgetMin) {
            filter.budgetMax = { $gte: Number(req.query.budgetMin) };
        }
        if (req.query.budgetMax) {
            filter.budgetMin = { $lte: Number(req.query.budgetMax) };
        }

        const tasks = await Task.find(filter)
            .populate('userId', 'name email')
            .populate('assignedTaskerId', 'name email')
            .sort({ createdAt: -1 });

        console.log("✅ TASKS FOUND FROM DB:", tasks.length); // DEBUG 3


        res.status(200).json(tasks);
    } catch (error) {
        console.error("🔥 Task Creation Error 🔥:", error);

        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single task by ID
// @route   GET /api/tasks/:id
// @access  Private
export const getTaskById = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('userId', 'name email phone profileImage')
            .populate('assignedTaskerId', 'name email phone profileImage');

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a task (before assignment only)
// @route   PUT /api/tasks/:id
// @access  Private (Task owner only)
export const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        if (['assigned', 'in_progress', 'completed'].includes(task.taskStatus)) {
            return res.status(400).json({ message: 'Cannot edit task after assignment' });
        }

        const { title, description, category, budgetMin, budgetMax, deadline, location } = req.body;

        if (title) task.title = title;
        if (description) task.description = description;
        if (category) task.category = category;
        if (budgetMin) task.budgetMin = budgetMin;
        if (budgetMax) task.budgetMax = budgetMax;
        if (deadline) task.deadline = deadline;
        if (location) task.location = location;

        // if (req.files && req.files.length > 0) {
        //     const newAttachments = req.files.map(file => file.path);
        //     task.attachments = [...task.attachments, ...newAttachments];
        // }
        if (req.files && req.files.length > 0) {
            const newAttachments = req.files.map(file => file.path || file.secure_url || '');
            task.attachments = [...task.attachments, ...newAttachments];
        }

        await task.save();
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a task (before assignment only)
// @route   DELETE /api/tasks/:id
// @access  Private (Task owner only)
export const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to delete this task' });
        }

        if (['assigned', 'in_progress'].includes(task.taskStatus)) {
            return res.status(400).json({ message: 'Cannot delete task after assignment' });
        }

        await Task.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark task as completed
// @route   PUT /api/tasks/:id/complete
// @access  Private (Task owner only)
export const completeTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (task.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (task.taskStatus !== 'assigned' && task.taskStatus !== 'in_progress') {
            return res.status(400).json({ message: 'Task must be assigned or in progress to complete' });
        }

        task.taskStatus = 'completed';
        await task.save();

        res.status(200).json({ message: 'Task marked as completed', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update task progress (Tasker)
// @route   PUT /api/tasks/:id/progress
// @access  Private (Assigned tasker only)
export const updateTaskProgress = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        if (!task.assignedTaskerId || task.assignedTaskerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Only the assigned tasker can update progress' });
        }

        if (task.taskStatus !== 'assigned' && task.taskStatus !== 'in_progress') {
            return res.status(400).json({ message: 'Cannot update progress at this stage' });
        }

        task.taskStatus = 'in_progress';
        await task.save();

        res.status(200).json({ message: 'Task status updated to in_progress', task });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};