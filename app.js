//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

/*
Don't forget to change MYUSERNAME and MYPASSWORD parts.
X, Y is just about what mongo gives you as the link.
*/
mongoose.connect("mongodb+srv://MYUSERNAME:MYPASSWORD@X.Y.mongodb.net/todoDB?retryWrites=true&w=majority");

const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item", itemsSchema);

const doc1 = new Item({
  name : "Welcome to your to do list"
});
const doc2 = new Item({
  name : "Use + button to add new entry"
});
const doc3 = new Item({
  name : "Use a checkbox to delete an entry"
});

const defaultItems = [doc1,doc2,doc3];

const listsSchema = {
  name : String,
  items : [itemsSchema]
};

const List = mongoose.model("List", listsSchema);


app.get("/", function(req, res) {
  Item.find(function(err,items) {
    if (err) {
        console.log(err);
    }else {
      if (items.length === 0) {
        Item.insertMany(defaultItems,function(err) {
          console.log(err);
        })
        res.redirect("/");
      }else {
        res.render("list", {listTitle: "Today", newListItems: items});
      }
    }
  });
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listTitle = req.body.list;
  const newItem = new Item({
    name : itemName
  });
  if (listTitle === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name : listTitle}, function(err,foundList) {
      if (!err) {
        if (foundList) {
          foundList.items.push(newItem);
          foundList.save();
          res.redirect("/"+listTitle); 
        }
      } else {
        console.log(err);
      }
    })
  }
});

app.post("/delete", function(req,res) {
  let delId = req.body.checkbox;
  let listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndDelete(delId,function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted "+delId);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name : listName}, {$pull : {items : {_id : delId}}}, function(err,foundList) {
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }

  
});

app.get("/:x", function(req, res) {
  const customListName = _.lowerCase(req.params.x);
  List.findOne({name : customListName}, function(err,result) {
    if (!err) {
      if (result) {
        res.render("list", {listTitle: result.name, newListItems: result.items});
      } else {
        const list = new List({
          name : customListName,
          items : defaultItems
        });
        list.save();
        res.redirect("/"+customListName);
      }
    } else {
      console.log(err);
    }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT, function() {
  console.log("Server started on specified heroku port");
});
