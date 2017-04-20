/**
 * Created by AdinaParaschiv on 2/21/2017.
 */

const express = require("express"),
      path = require("path"),
      templating = require("./templating/info.js"),
      routes = require('./routes/index'),
      usersRoute = require('./routes/usersRoute'),
      dojosRoute = require('./routes/dojosRoute'),
      bodyParser = require('body-parser'),
      expressValidator = require("express-validator"),
      mongoose = require('mongoose'),
      expressSession = require('express-session'),
      cookieParser = require('cookie-parser'),
      passport = require('passport'),
      //passportLocal =   require('passport-local'),
      logger = require('./logger/logger'),
      validator = require('./validator/validator');



let dataBaseName = 'coderDojoTimisoara';
//Connecting to the database
mongoose.connect('mongodb://localhost/' + dataBaseName, function(err){
    if (err){
        console.log("Error:", err);
        logger.error('Cannot connect to database: ' + err);
    } else {
        logger.info('Connected to dbs: ' + dataBaseName);
    }
});



//Read data files
//templating.initiate();


let app = express();

//Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressSession({
    secret:'hj9g9897532u8904fsuig34534gggd',
    resave: false,
    saveUninitialized: false
}));

//Setting the static directory where the client files(css, js) are kept
app.use(express.static(path.join(__dirname, 'client')));
app.use(passport.initialize());//Grabs the data from the session
app.use(passport.session());//Puts data into local session



// This middleware is used for validating fields, the error formater is used to format the error message which will be
// send to the client.
app.use(expressValidator({
    errorFormatter: validator.errorFormatter,
    customValidators: validator.customValidators
}));

// We set the routes the data will take
app.use("/", routes);
app.use("/user", usersRoute);
app.use("/dojos", dojosRoute);





//Starting the server on port 3000
//Set port
app.set("port", (process.env.PORT || 3000));

app.listen(app.get("port"), function(){
    logger.info(`LOGGING:Server started on port ${app.get("port")}`);

});