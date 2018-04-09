const express = require('express');
const _ = require('lodash')
const bcrypt = require('bcryptjs')
const config = require('config')
var bodyParser = require('body-parser')
var {
    ObjectID
} = require('mongodb')
var {
    mongoose
} = require('./db/mongoose')
var {
    Todo
} = require('./models/todo')
var {
    User
} = require('./models/user')
var {
    authenticate
} = require('../middleware/authenticate')
var app = express();
var cors = require('cors')

var app = express()
app.use(cors())
app.use(bodyParser.json());

app.post('/todos', authenticate, (req, res) => {
    var todo = new Todo({
        text: req.body.text,
        description: req.body.description,
        _createdBy: req.user._id
    });

    todo.save().then((doc) => {
        res.status(200).json({
            status: 200,
            data: doc,
            message: "Succesfully Todos Recieved"
        })
    }, (e) => {
        res.status(400).send(e);
    });
});

app.post('/users', (req, res) => {
    var body = _.pick(req.body, ['email', 'password', 'name']);
    var user = new User(body)

    user.save().then(() => {
        return user.generateAuthToken();
    }).then((token) => {
        // res.header('x-auth', token).status(200).send(user)
        res.status(200).json({
            status: 200,
            token: token,
            message: "Succesfully Created User"
        })
    }).catch(e => {
        res.status(400).send(e);
    });
});

app.get('/todos', authenticate, (req, res) => {
    debugger
    Todo.find({
        _createdBy: req.user._id
    }).then((todos) => {
        res.status(200).json({
            status: 200,
            data: {
                docs: todos
            },
            message: "Succesfully Todos Recieved"
        });
    }, (e) => {
        res.status(400).send(e);
    })
})

app.get('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id
    var err = "Error: ID is not valid"
    if (!ObjectID.isValid(id)) {
        return res.status(404).send(err);
    }
    Todo.findOne({
        _id: id,
        _createdBy: req.user._id
    }).then((todo) => {
        res.send({
            todo
        });
    }, (e) => {
        res.status(400).send(e);
    })
})

app.delete('/todos/:id', authenticate, (req, res) => {
    debugger
    var id = req.params.id
    var err = "Error: ID is not valid"
    if (!ObjectID.isValid(id)) {
        return res.status(404).send(err);
    }
    Todo.findOneAndRemove({
        _id: id,
        _createdBy: req.user._id
    }).then((todo) => {
        return res.status(204).json({
            status: 204,
            message: "Succesfully Todo Deleted"
        })
    }, (e) => {
        return res.status(400).json({
            status: 400,
            message: e.message
        })
    })
})


app.post('/users/login', (req, res) => {
    var body = _.pick(req.body, ['email', 'password']);

    User.findByCredentials(body.email, body.password)
        .then((user) => {
            debugger
            return user.generateAuthToken().then((token) => {
                res.status(200).json({
                    status: 200,
                    token: token,
                    message: "Succesfully Logged in User"
                })
            })
        }).catch((e) => {
            console.log(e)
            res.status(400).send();
        })
})

app.patch('/todos/:id', authenticate, (req, res) => {
    debugger
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);
    var err = "Error: ID is not valid"
    if (!ObjectID.isValid(id)) {
        return res.status(404).send(err);
    }
    debugger
    if (_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }
    debugger
    Todo.findOneAndUpdate({
        _id: id,
        _createdBy: req.user._id
    }, {
        $set: body
    }, {
        new: true
    }).then((todo) => {

        if (!todo) {
            return res.status(404).send();
        }
        res.send(todo);
    }, (e) => {
        res.status(400).send(e);
    })
})

app.get('/users/me', authenticate, (req, res) => {
    debugger
    res.send(req.user);
})

app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then(() => {
        res.status(200).send()
    }), () => {
        res.status(400).send();
    }
})

var port = config.get('development.PORT')
app.listen(port, () => {
    console.log(config)
    debugger
    console.log('Started on port ' + port);
});