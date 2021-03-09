require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
// const date = require(__dirname + "/date.js");
const app = express();
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require("passport-local-mongoose");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(session({
    secret:process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// app.use(express.static("components"));
app.set('view engine', 'ejs');


mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@cluster0.hqjwd.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const itemsSchema = new mongoose.Schema({
    name: String
});

const userSchema = new mongoose.Schema({
    displayName: String,
    username: String,
    password: String
});
userSchema.plugin(passportLocalMongoose); // Hash and Salt

const Item = mongoose.model("Item", itemsSchema);
const User = mongoose.model("User", userSchema);
const item1 = new Item({
    name: "Welcome to your todo list!"
});
const item2 = new Item({
    name: "Hit the '+' button to add a new item"
});
const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];
let availableLists = [];

const listSchema = {
    name: {
        type: String,
        unique: true
    },
    items: [itemsSchema]
};


const List = mongoose.model("List", listSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.route('/')
    .get((req, res) => {
        res.render("login");
    })
    .post((req, res) => {
        const user = new User({
            username: req.body.email,
            password: req.body.password
        });
        req.login(user, (err) => {
            if(!err) {
                passport.authenticate("local");
            }
        })
    });

app.route('/register')
    .get((req, res) => {
        res.render("register");
    })
    .post((req, res) => {
        User.register({username: req.body.username, displayName: req.body.displayName}, req.body.password, (err, user) => {
            if(!err) {
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/list");
                })
            } else {
                console.log(err);
                res.redirect("/register");
            }
        })
    });

app.get('/list', (req, res) => {
    if(req.isAuthenticated()) {
        res.render('list');
        console.log(req.user);
    //     List.find({}, {name: 1, _id: 0}, (err, results) => {
    //         if(err) {
    //             console.log(err);
    //         } else {
    //             availableLists = results;
    //         }
    //     });
    
    //     Item.find({}, (err, results) => {
    //         if(err) {
    //             console.log("First: " + err);
    //         } else {
    //             if(results.length === 0){
    //                 Item.insertMany(defaultItems, (err) => {
    //                     if(err){
    //                         console.log("Second: " + err);
    //                     } else {
    //                         console.log("Default items added");
    //                     }
    //                     res.redirect("/");
    //                 });
    //             } else {
    //                 res.render('list', {listTitle: "Today", itemList: results, availableLists: availableLists});
    //             }
    //         }
    //     });    
    // } else {
    //     res.redirect("/");
     }
    
});

app.get('/favicon.ico', (req,res)=>{
    res.redirect('/');   
});

// app.get('/:listName', (req, res)=>{
//     const customListName = _.capitalize(req.params.listName);
    
//     List.findOne({name: customListName}, (err, results) => {
//         if(!err) {
//             if(!results) {
//                 const list = new List({
//                     name: customListName,
//                     items: defaultItems
//                 });
//                 list.save();
//                 res.redirect("/" + customListName);
//             } else {
//                 res.render("list", {listTitle: results.name, itemList: results.items, availableLists: availableLists});
//             }
//         } else {
//             console.log(err);            
//         }
//     });
// });

app.post('/', (req, res) => {
    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });

    if(listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName}, (err, results) => {
            results.items.push(item);
            results.save();
            res.redirect("/" + listName);
        })
    }
});

app.post('/remove', (req, res) => {
    const itemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        // Default list
        Item.findByIdAndRemove(itemId, (err) => {
            if(err) {
                console.log(err);
            } else {
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate(
            {name: listName},
            {$pull: {items: {_id: itemId}}},
            (err, results)=>{
                if(err){
                    console.log(err);
                } else {
                    res.redirect("/" + listName);
                }
            }
        )
    }    
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});