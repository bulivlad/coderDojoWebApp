/**
 * Created by catap_000 on 5/20/2017.
 */


const eventController = require('../controllers/eventController')
let helper = {};


helper.initializeApp = function(){
  eventController.createEventsFromRecurrentEventsForAllDojos();
};



module.exports = helper;