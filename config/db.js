const mysql=require('mysql2/promise');


const pool=mysql.createPool({
    host: process.env.DB_HOST|| 'localhost',
    user: process.env.DB_USER|| 'root',
    password: process.env.DB_PASSWORD|| 'A002#tz1',
    database: process.env.DB_DATABASE|| 'crm',
    port: process.env.DB_PORT|| 3306,
    waitForConnections: true,
    queueLimit: 10,
    connectionLimit: 10,

});
 
pool.getConnection()
.then(connection=>{
    console.log('connected successfully to the database');
    connection.release();
}).catch(err=>{
console.error('error in connection');
console.log(err);
    });
    module.exports=pool;