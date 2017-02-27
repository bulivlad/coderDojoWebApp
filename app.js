/**
 * Created by AdinaParaschiv on 2/21/2017.
 */

const express = require("express"),
      path = require("path"),
      templating = require("./templating/info.js"),
      routes = require('./routes/index');


//Read data files
templating.initiate();


let app = express();


//Setam directorul static de unde se iau fisierele pentru aplicatia client
app.use(express.static(path.join(__dirname, 'client')));


// We set the routes the data will take
app.use("/", routes);



//Pornit aplicatia sa asculte pe portul 3000
//Set port
app.set("port", (process.env.PORT || 3000));

app.listen(app.get("port"), function(){
    console.log(`LOGGING:Server started on port ${app.get("port")}`);
});