const express = require('express');

const todoControllers = require('../../controllers/todo.controller');
const auth = require('../../middlewares/auth');

const router = express.Router();

router.use(auth());

router.get('/user/:uid', todoControllers.getTodoByUser);

router.post('/changeState/:id', todoControllers.changeTodoState);

router.delete('/:id', todoControllers.deleteTodo);

router.post('/', todoControllers.createTodo);

module.exports = router;
