const express = require('express')
const app = express()
var mysql = require('mysql')
const bodyParser = require('body-parser')
const file = require("fs") 
var atob = require('atob');
const path = require('path');
const https = require('https');
nodeMailer = require('nodemailer');

const port = process.env.PORT || 5000;

const connection = mysql.createPool({
    host: '198.12.249.79',
    user: 'candracp_journal',
    password: 'P@55W012D!',
    database: 'candracp_journal'
});

// const connection = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     password: '',
//     database: 'chandrajournal'
// });

// Body parser
app.use(bodyParser.json({ limit: '50mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(express.json());
app.use('/', express.static(__dirname + 'server/index.html'));
app.set('view engine', 'html');

// CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

//Check if app is served correctly
app.get('/', (req, res) =>
    res.send('App served successfully!'));

app.get('/test', (req, res) => {
    var sql = "Select * from `entries`";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            res.send(result);
        }
    });
});

//USER APIs
app.get('/user-login/:form', (req, res) => {
    const form = JSON.parse(req.params.form);
    var sql = "SELECT `UserId`," +
        " `UserName`," +
        " `FirstName`," +
        " `LastName`," +
        " `EmailAddress`," +
        " `CreatedTimestamp`" +
        " FROM `users` WHERE `EmailAddress` = '" + form.email + "'" +
        " AND `Password` = '" + form.password + "'";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            res.send(result);
        }
    });
});

app.post('/verify', bodyParser.json(), (req, res) => {
    const form = req.body;
    var sql = "SELECT `UserId`," +
        " `UserName`," +
        " `FirstName`," +
        " `LastName`," +
        " `EmailAddress`," +
        " `CreatedTimestamp`" +
        " FROM `users` WHERE `EmailAddress` = '" + form.email + "'" +
        " AND `verification` = '" + form.number + "'";
    console.log(sql);
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            if (!result.length){
                console.log(result);
                res.json("No matching account found");
            }else{
                console.log(result);
                res.json("Success");
            }
        }
    });
});

app.get('/user-details/:userId', (req, res) => {
    const userId = req.params.userId;
    console.log(userId);
    var sql = "SELECT `UserId`," +
        " `UserName`," +
        " `FirstName`," +
        " `LastName`," +
        " `Birthdate`," +
        " `EmailAddress`," +
        " `Phone`" +
        " FROM `users` WHERE `UserId` = '" + userId + "'";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            res.send(result);
        }
    });
});

app.get('/profile-image/:userId', (req,res)=>{
    const id = req.params.userId;
    var entryDir ='./images/profiles/' + id;
    file.readdir( entryDir, function(error, files) {  
        if (error){
            console.log("error");
            res.json("error");
        }else{
            var totalFiles = files.length;
            var images = []; 
            for (var i = 0;i<totalFiles;i++){
                var imagePath ='./images/profiles/' + id + '/' + id +".jpeg";
                imageBase64 = file.readFileSync(imagePath, "base64")
                images.push("data:image/jpeg;base64,"  + imageBase64);
                res.json(images);
            }
        } 
    });
})

app.post('/update-user-details', bodyParser.json(), (req, res) => {
    const form = req.body;
    console.log("Form: ",form);
    var sql = "UPDATE users SET" +
        " `UserName` = '" + form.username + "'," +
        " `FirstName` = '" + form.firstname + "'," +
        " `LastName` = '" + form.lastname + "'," +
        " `Birthdate` = '" + form.birthdate + "'," +
        " `EmailAddress` = '" + form.email + "'," +
        " `Phone` = '" + form.phone + "'" +
        "  WHERE `UserId` = '" + form.userid + "'";

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log("Result: ", result);
            res.send(result);
        }
    });
});

app.post('/user-signup', bodyParser.json(), (req, res) => {
    const form = req.body;
    var sql = "INSERT INTO `users` (`UserId`,`UserName`, `FirstName`, `LastName`,`EmailAddress`, `Password`,`Birthdate`,`CreatedTimestamp`) " +
        "VALUES (NULL, '" + form.username + "','" + form.firstname + "','" + form.lastname + "'," +
        " '" + form.email + "','" + form.password + "','" + form.birthdate + "', CURRENT_TIMESTAMP)";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            res.send(result);
        }
    });
});

//ENTRIES APIs

app.post('/create-entry', bodyParser.json(), (req, res) => {
    const form = req.body;
    var images = form.images;
    var sql = "INSERT INTO `entries` (`EntryNo`,`Title`, `Content`, `CreatedTimestamp`,`hasImage`,`UserId`) " +
        "VALUES (NULL, '" + form.title + "','" + form.content + "',CURRENT_TIMESTAMP, '" + form.hasImage + 
        "', '" + form.userId+ "')";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            var entryDir ='./images/entries/' + result['insertId'];
                file.access(entryDir, function(err) {
                    if (err.code === 'ENOENT') {
                        file.mkdir(entryDir,function(err){
                            if (err) {
                                res.send(err);
                            } else{
                                console.log("Directory created successfully!");
                                for (var i = 0;i<JSON.parse(images).length;i++ ){
                                    var filename = result['insertId'] + '-' + i + ".jpeg";
                                    var base64Data = atob(JSON.parse(images)[i]).replace("-", "+").replace("_", "/");
                                    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
                                    var filePath = entryDir+'/'+filename;
                                    
                                    file.writeFile(filePath, base64Data, 'base64', function(err) {
                                        if(err===null){
                                            console.log("Files Created Successfully!");
                                        }else{
                                            console.log("Error Encountered: ",err);
                                        }
                                    });
                               }  
                            }
                        });
                    }
                });
           res.send('{"Success": true}');
        }
    });
});

app.post('/get-entries', bodyParser.json(), (req, res) => {
    const id = req.body.id;
    const page = req.body.page;
    const limit = 6;
    const offset = (page - 1) * limit;
    var totalPages;
    var results = {};
    var sqlCount = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + "'";

    var sql = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + "'" +
        " ORDER BY `CreatedTimestamp` DESC" +
        " LIMIT " + limit + " OFFSET " + offset;

    connection.query(sqlCount, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
            res.end("Error occured.");
        }
        else {
            totalPages = Math.ceil(result.length / limit);
        }
    });

    connection.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(rows);
            results['page'] = page;
            results['totalPages'] = totalPages;
            results['rows'] = rows;
            res.send(results);
        }
    });
});

app.post('/search-entries', bodyParser.json(), (req, res) => {
    const id = req.body.id;
    const page = req.body.page;
    const searchKey = req.body.searchKey;
    const limit = 6;
    const offset = (page - 1) * limit;
    var totalPages;
    var results = {};
    var sqlCount = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + "' AND `Title` LIKE '%" + searchKey + "%'";

    var sql = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + "' AND `Title` LIKE '%" + searchKey + "%'" +
        " ORDER BY `CreatedTimestamp` DESC" +
        " LIMIT " + limit + " OFFSET " + offset;

    connection.query(sqlCount, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
            res.end("Error occured.");
        }
        else {
            totalPages = Math.ceil(result.length / limit);
        }
    });

    connection.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(rows);
            results['page'] = page;
            results['totalPages'] = totalPages;
            results['rows'] = rows;
            res.send(results);
        }
    });
});

app.post('/filter-entries', bodyParser.json(), (req, res) => {
    const id = req.body.id;
    const page = req.body.page;
    const date = req.body.date;
    const limit = 6;
    const offset = (page - 1) * limit;
    var totalPages;
    var results = {};
    var sqlCount = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + 
        "' AND date(`CreatedTimestamp`) = '"+date+
        "' ORDER BY `CreatedTimestamp` DESC";

    var sql = "SELECT `EntryNo`," +
        " `Title`," +
        " `Content`," +
        " `CreatedTimestamp`," +
        " `hasImage`" +
        " FROM `entries` WHERE `UserId` = '" + id + 
        "' AND date(`CreatedTimestamp`) = '"+date+
        "' ORDER BY `CreatedTimestamp` DESC"+
        " LIMIT " + limit + " OFFSET " + offset;

    connection.query(sqlCount, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
            res.end("Error occured.");
        }
        else {
            totalPages = Math.ceil(result.length / limit);
        }
    });

    connection.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(rows);
            results['page'] = page;
            results['totalPages'] = totalPages;
            results['rows'] = rows;
            res.send(results);
        }
    });
});

app.post('/update-entry', bodyParser.json(), (req, res) => {
    const form = req.body;
    var images = form.images;
    var sql = "UPDATE `entries` SET" +
        " `Title` = '" + form.title + "'," +
        " `Content` = '" + form.content + "'," +
        " `hasImage` = '" + form.hasImage + "'" +
        "  WHERE `EntryNo` = '" + form.entryNo + "'";

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            console.log(result);
            var entryDir ='./images/entries/' + form.entryNo;
            file.access(entryDir, function(err) {
                if (err) {
                    if (err.code === 'ENOENT') {
                        file.mkdir(entryDir,function(err){
                            if (err) {
                                res.send(err);
                            }else{
                                console.log("Directory created successfully!");
                                for (var i = 0;i<JSON.parse(images).length;i++ ){
                                    var filename = form.entryNo + '-' + i + ".jpeg";
                                    var base64Data = atob(JSON.parse(images)[i]).replace("-", "+").replace("_", "/");
                                    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
                                    var filePath = entryDir+'/'+filename;
                                    file.writeFile(filePath, base64Data, 'base64', function(err) {
                                        if(err===null){
                                            console.log("Files Created Successfully!");
                                        }else{
                                            console.log("Error Encountered: ",err);
                                        }
                                    });
                                }     
                            }
                        });
                    }else{
                            res.json({"error": err}) 
                    }
                }else{
                    file.readdir( entryDir, function(error, files) {  
                        if (error){
                            console.log(error);
                            res.json({ "error": error });
                        }else{
                            var totalFiles = files.length; 
                            console.log(totalFiles);
                            if (totalFiles !=0){
                                for (var i = 0;i<totalFiles;i++ ){
                                    var filename = form.entryNo + '-' + i + ".jpeg";
                                    var filePath = entryDir+'/'+filename;
                                    console.log(filePath);
                                    file.unlink(filePath, function(err) {
                                        if(err===null){
                                            console.log("File Deleted Successfully!");
                                            for (var i = 0;i<JSON.parse(images).length;i++ ){
                                                var filename = form.entryNo + '-' + i + ".jpeg";
                                                var base64Data = atob(JSON.parse(images)[i]).replace("-", "+").replace("_", "/");
                                                base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
                                                base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                                                base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
                                                var filePath = entryDir+'/'+filename;
                                                
                                                file.writeFile(filePath, base64Data, 'base64', function(err) {
                                                    if(err===null){
                                                        console.log("Files Created Successfully!");
                                                    }else{
                                                        console.log("Error Encountered: ",err);
                                                    }
                                                });
                                            } 
                                        }else{
                                            res.json({ "error": err });
                                        }
                                    });
                                }  
                            }else{
                                for (var i = 0;i<JSON.parse(images).length;i++ ){
                                    var filename = form.entryNo + '-' + i + ".jpeg";
                                    var base64Data = atob(JSON.parse(images)[i]).replace("-", "+").replace("_", "/");
                                    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                                    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
                                    var filePath = entryDir+'/'+filename;
                                    
                                    file.writeFile(filePath, base64Data, 'base64', function(err) {
                                        if(err===null){
                                            console.log("Files Created Successfully!");
                                        }else{
                                            console.log("Error Encountered: ",err);
                                        }
                                    });
                                } 
                            }
                        }
                    });
                }
            console.log(result);
            res.send(result);
            });
        }
    });
});

app.post('/update-password', bodyParser.json(), (req, res) => {
    const form = req.body;
    var sql = "UPDATE `users` SET" +
        " `Password` = '" + form.password +
        "'  WHERE `EmailAddress` = '" + form.email + "'";

    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }else {
            console.log(result);
            res.json("Success");
        }
    });
});

app.post('/upload-profile', bodyParser.json(), (req, res) => {
    const form = req.body;
    var image = form.image;
    var entryDir ='./images/profiles/' + form.userId;
    file.access(entryDir, function(err) {          
        if (err){
            if (err.code === 'ENOENT') {
                file.mkdir(entryDir,function(err){
                    if (err) {
                        res.json("error");
                    } else{
                        console.log("Directory created successfully!");                      
                        var filename = form.userId + ".jpeg";
                                        
                        var base64Data = atob(JSON.parse(image)).replace("-", "+").replace("_", "/");
                        base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");
                        base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                        base64Data = base64Data.replace(/^data:image\/png;base64,/, "");
                                        
                        var filePath = entryDir+'/'+filename; 
    
                        file.writeFile(filePath, base64Data, 'base64', function(err) {
                            if(err===null){
                                console.log("Profile Image Created Successfully!");
                                res.json("success");
                            }else{
                                console.log("Error Encountered: ",err);
                                res.json("error");
                            }
                        });
                    }
                });
            }else{
                console.log("called");
                res.json("error");
            }
        }else{      
            var filename = form.userId + ".jpeg";
            var filePath = entryDir+'/'+filename; 
            file.unlink(filePath, function(err) {
                if(err===null){
                    console.log("File Deleted Successfully!");                 
                    var base64Data = atob(JSON.parse(image)).replace("-", "+").replace("_", "/");
                    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, "");  
                    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");            
                    file.writeFile(filePath, base64Data, 'base64', function(err) {
                        if(err===null){
                            res.json("success");
                        }else{
                            res.json("error");
                        }
                    });
                }else{
                    var base64Data = atob(JSON.parse(image)).replace("-", "+").replace("_", "/");
                    base64Data = base64Data.replace(/^data:image\/jpeg;base64,/, ""); 
                    base64Data = base64Data.replace(/^data:image\/jpg;base64,/, "");
                    base64Data = base64Data.replace(/^data:image\/png;base64,/, "");         

                    file.writeFile(filePath, base64Data, 'base64', function(err) {
                        if(err===null){
                            res.json("success");
                        }else{
                            res.json("error");
                        }
                    });
                }
            });       
        }
    });
});

app.get('/delete-entry/:id', (req, res) => {
    const id = req.params.id;
    console.log(id);
    var sql = "DELETE FROM `entries` WHERE `EntryNo` = '"+id+"'";
    connection.query(sql, (err, result) => {
        if (err) {
            console.log(err);
            res.json({ "error": err });
        }
        else {
            var entryDir ='./images/entries/' + id;
            file.readdir( entryDir, function(error, files) {  
                if (error){
                    console.log(error);
                    res.json({ "error": error });
                }else{
                    var totalFiles = files.length; 
                    console.log(totalFiles);
                    if (totalFiles !=0){
                        for (var i = 0;i<totalFiles;i++ ){
                            var filename = id + '-' + i + ".jpeg";
                            var filePath = entryDir+'/'+filename;
                            console.log(filePath);
                            file.unlink(filePath, function(err) {
                                if(err===null){
                                    console.log("File Deleted Successfully!");
                                }else{
                                    res.json({ "error": err });
                                }
                            });
                       }  
                       file.rmdir(entryDir, function(err) {
                        if(err===null){
                            console.log("Directory Deleted Successfully!");
                        }else{
                            res.json({ "error": err });
                        }
                    });
                    }else{
                        file.rmdir(entryDir, function(err) {
                            if(err===null){
                                console.log("Directory Deleted Successfully!");
                            }else{
                                res.json({ "error": err });
                            }
                        });
                    }
                }
            });
            console.log(result);
            res.send(result);
        }
    });
});

app.get('/get-entry-image-total/:id', (req, res) => {
    const id = req.params.id;
    console.log(id);
    var entryDir ='./images/entries/' + id;
    file.readdir( entryDir, function(error, files) {  
        if (error){
            console.log(error);
            res.json({ "error": error });
        }else{
            var totalFiles = files.length;
            var images = []; 
            for (var i = 0;i<totalFiles;i++){
                var imagePath ='./images/entries/' + id + '/' + id + '-'+ i +".jpeg";
                imageAsBase64 = file.readFileSync(imagePath, 'base64');
                images.push("data:image/jpeg;base64,"  + imageAsBase64);
            }
            res.json(images);
        }
    });
});

app.post('/send-email',bodyParser.json(), (req, res) => {
    const email = req.body.email;
    console.log(email);
    var sql = "SELECT * FROM `users` WHERE `EmailAddress` = '"+email+"'";
    console.log(sql);
    connection.query(sql, (err, result) => {
        if (err){
            res.json(err);
        }else{
            if (!result.length){
                console.log(result);
                res.json("No matching email found.");
            }else{
                var verification = Math.floor(100000 + Math.random() * 900000);
                var sql = "UPDATE `users` SET `verification` = " + verification + " WHERE `EmailAddress` = '"+email+"'";
                connection.query(sql, (err, result) => {
                    if (err){
                        res.json(err);
                    }else{
                        let transporter = nodeMailer.createTransport({
                            host: 'smtp.gmail.com',
                            port: 465,
                            secure: true,
                            auth: {
                                // should be replaced with real sender's account
                                user: 'journal4life.com@gmail.com',
                                pass: 'Pa55word!'
                            }
                        });
                        let mailOptions = {
                            // should be replaced with real recipient's account
                            to: email,
                            subject: "Journal4Life Email Verification",
                            text: "Hi there! It looks like you're trying to recover your account. Your verification number is " + verification +". For your account's security, please avoid sharing your verification number with anyone."
                        };
                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                res.json(error);
                            }else{
                                res.json("Success");
                            }
                        });
                    }
                });
            }
        }
    });
  });

https.createServer({
    key: file.readFileSync('journal4life.key'),
    cert: file.readFileSync('journal4life.crt'),
    ca: ['gd1.crt', 'gd2.crt']
  }, app).listen(port, () => console.log(`App listening at 198.12.249.79:${port}`))