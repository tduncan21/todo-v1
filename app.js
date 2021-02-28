const express = require('express');
const bodyParser = require('body-parser');
const date = require(__dirname + "/date.js");
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.static("components"));
app.set('view engine', 'ejs');

let items = [];
let workItems = [];


app.get('/', (req, res) => {
    let day = date.getDate();
    res.render('list', {listTitle: day, itemList: items});
});

app.get('/work', (req, res)=>{
    res.render("list", {listTitle: "Work List", itemList: workItems});
})

app.post('/', (req, res) => {
    item = req.body.newItem;
    if(req.body.list === "Work"){
        workItems.push(item);
        res.redirect("/work")
    } else {
        items.push(item);
        res.redirect('/');
    }    
});

app.get('/remove', (req, res) => {
    items.pop();
    res.redirect('/');
});

app.listen(process.env.PORT || 3000, () => {
    console.log("Server running");
});