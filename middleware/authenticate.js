var {
    User
} = require('../server/models/user')
var authenticate = (req, res, next) => {
    var token = req.header('x-auth');
    debugger
    User.findByToken(token).then((user) => {
        if (!user) {
            Promise.reject()
        }
        req.user = user;
        req.token = token;
        next();
    }).catch((e) => {
        debugger
        res.status(401).end()
    })
}

module.exports = {
    authenticate
}