require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const _ = require('lodash');
// const date = require(__dirname + "/date.js");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// app.use(express.static("components"));
app.set('view engine', 'ejs');

mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASSWORD + "@cluster0.hqjwd.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = new mongoose.Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

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


app.get('/', (req, res) => {
    
    List.find({}, {name: 1, _id: 0}, (err, results) => {
        if(err) {
            console.log(err);
        } else {
            availableLists = results;
        }
    });

    Item.find({}, (err, results) => {
        if(err) {
            console.log("First: " + err);
        } else {
            if(results.length === 0){
                Item.insertMany(defaultItems, (err) => {
                    if(err){
                        console.log("Second: " + err);
                    } else {
                        console.log("Default items added");
                    }
                    res.redirect("/");
                });
            } else {
                res.render('list', {listTitle: "Today", itemList: results, availableLists: availableLists});
            }
        }
    });    
});

app.get('/favicon.ico', (req,res)=>{
    res.redirect('/');   
});

app.get('/:listName', (req, res)=>{
    const customListName = _.capitalize(req.params.listName);
    
    List.findOne({name: customListName}, (err, results) => {
        if(!err) {
            if(!results) {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            } else {
                res.render("list", {listTitle: results.name, itemList: results.items, availableLists: availableLists});
            }
        } else {
            console.log(err);            
        }
    });
});

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