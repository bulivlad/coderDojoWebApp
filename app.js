/**
 * Created by AdinaParaschiv on 2/21/2017.
 */

const express = require("express"),
    path = require("path"),
    routes = require('./routes/index'),
    usersRoute = require('./routes/usersRoute'),
    dojosRoute = require('./routes/dojosRoute'),
    badgesRoute = require('./routes/badgesRoute'),
    eventsRoute = require('./routes/eventsRoute'),
    bodyParser = require('body-parser'),
    expressValidator = require("express-validator"),
    mongoose = require('mongoose'),
    expressSession = require('express-session'),
    cookieParser = require('cookie-parser'),
    passport = require('passport'),
    passportLocal =   require('passport-local'),
    logger = require('./logger/logger'),
    validator = require('./validator/validator'),
    helper = require('./auxiliary/helper'),
    morgan = require('morgan');
    MongoStore = require('connect-mongo')(expressSession),
    https = require('https'),
    fs = require('fs');



let dataBaseName = process.env.MONGO_URI || 'mongodb://localhost/coderDojoTimisoara';
//Connecting to the database
mongoose.connect(dataBaseName, function(err){
    if (err){
        logger.error('Cannot connect to database: ' + err);
    } else {
        logger.info('Connected to dbs: ' + dataBaseName);
    }
});

helper.initializeApp();

let app = express();

//WHen running on the dev's computer no NODE_ENV is set-up, and so we start morgan
if(!process.env.NODE_ENV){
    app.use(morgan('dev'));
}

////Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
//TODO store secret as an environmental variable
app.use(expressSession({
    secret:'hj9g9897532u8904fsuig34534gggd',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({mongooseConnection: mongoose.connection})
}));

//Setting the static directory where the client files(css, js) are kept
app.use(express.static(path.join(__dirname, 'client')));
app.use(passport.initialize());//Grabs the data from the session
app.use(passport.session());//Puts data into local session

// This middleware is used for validating fields, the error formatter is used to format the error message which will be
// send to the client.
app.use(expressValidator({
    errorFormatter: validator.errorFormatter,
    customValidators: validator.customValidators
}));

//// We set the routes the data will take
app.use("/", routes);
app.use("/user", usersRoute);
app.use("/dojos", dojosRoute);
app.use("/events", eventsRoute);
app.use("/badges", badgesRoute);

let port = process.env.PORT || 3000;

//TODO SSL support does not exist for the free AppSvc we use at this point
//const httpOptions = {
//    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.crt')),
//    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.key'))
//};
//
//https.createServer(httpOptions, app)
//    .listen(port, function(){
//        logger.info(`LOGGING:Server started on port ${port}`);
//    });


app.listen(port, function(err) {
    logger.info(`Server started on port ${port}`);

});