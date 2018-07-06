const OrientDB = require('orientjs');
const server = OrientDB({
   host:     'localhost',
   port:     process.env.OrientPort,
   username: 'root',
   password: 'root',
   useToken: false
});

const dbName = process.env.OrientDbName;
console.log('dbName', dbName);
server.list()
   .then(
      function(list){
        const listArray = list.map(db => db.name );
        console.log('Databases', listArray);
        if (listArray.indexOf(dbName) < 0) {
          server.create({
             name:    dbName,
             type:    'graph',
             storage: 'plocal'
             })
             .then(
                function(create){
                   console.log('Created Database:', create.name);
                }
             );
        }
      }
   );


 const db = server.use({
    name: dbName
 });

module.exports = db;
