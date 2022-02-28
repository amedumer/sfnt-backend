const mongoose = require('mongoose');
const Todo = require('../models/todo.model');
const User = require('../models/user.model');

const getTodoByUser = async (req, res, next) => {
  const userId = req.params.uid;

  if (req.user.id !== userId) {
    return next(new Error('Not authorized.', 401));
  }

  let userWithTodos;
  try {
    userWithTodos = await User.findById(userId).populate('todos');
  } catch (err) {
    return next(new Error('Fetching todos failed.', 500));
  }

  if (!userWithTodos || userWithTodos.length === 0) {
    return next(new Error('Could not find a todos for the provided user id.', 404));
  }

  res.json({
    todos: userWithTodos.todos.map((todo) => todo.toObject({ getters: true })),
  });
};

const changeTodoState = async (req, res, next) => {
  const { id } = req.params;

  // const { id } = req.body;

  let todo;
  try {
    todo = await Todo.findById(id);
  } catch (err) {
    return next(new Error('Can not find todo!', 500));
  }

  try {
    const sess = await mongoose.startSession();

    await sess.withTransaction(async () => {
      todo.isComplete = !todo.isComplete;
      await todo.save({ session: sess });
    });

    await sess.endSession();
  } catch (err) {
    return next(new Error('Todo change state failed', 500));
  }

  res.status(200).json({ todo: todo.toObject({ getters: true }) });
};

const createTodo = async (req, res, next) => {
  const { title, description, detail } = req.body;

  const createdTodo = new Todo({
    title,
    description,
    detail,
    created: new Date().getTime(),
    creator: req.user.id,
    isComplete: false,
  });

  let user;
  try {
    user = await User.findById(req.user.id);
  } catch (err) {
    return next(new Error('Place creation failed', 500));
  }

  if (!user) {
    return next(new Error('Could not find user for provided id.', 500));
  }

  try {
    const sess = await mongoose.startSession();

    await sess.withTransaction(async () => {
      await createdTodo.save({ session: sess });
      user.todos.push(createdTodo);
      await user.save({ session: sess });
    });

    await sess.endSession();
  } catch (err) {
    return next(new Error('Place creation failed', 500));
  }

  res.status(201).json({ todo: createdTodo.toObject({ getters: true }) });
};

const deleteTodo = async (req, res) => {
  const { id } = req.params;
  let todo;
  try {
    todo = await Todo.findById(id).populate('creator');
  } catch (err) {
    throw new Error('Something went wrong. Could not delete place', 500);
  }

  if (!todo) {
    throw new Error('Could not find a todo for the provided id.', 404);
  }

  try {
    const sess = await mongoose.startSession();
    await sess.withTransaction(async () => {
      todo.creator.todos.pull(todo);

      await todo.remove({ session: sess });
      await todo.creator.save();
    });
    await sess.endSession();
  } catch (err) {
    throw new Error('Something went wrong. Could not delete todo', 500);
  }

  res.status(200).json({ message: 'Todo deleted' });
};

exports.getTodoByUser = getTodoByUser;
exports.createTodo = createTodo;
exports.changeTodoState = changeTodoState;
exports.deleteTodo = deleteTodo;
