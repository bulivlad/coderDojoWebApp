db.dojos.update(
    {_id: ObjectId("58c54a59f91832630b456328")},
    {$set:{children:[
                {"parentEmail" : "catapara@gmail.com", "childName" : "Lil Para", _id:"4234523522"},
                {"parentEmail" : "catapara@gmail.com", "childName" : "Mihai Sac", _id:"1324245633232"}]
          }
    });