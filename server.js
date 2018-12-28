const express = require("express");
const bodyParser = require("body-parser");
const moment = require("moment");
const multer = require("multer");
const pharmacy = require("./models/pharmacy");
const fs = require("fs");
const User = require("./models/user");
const mongoose = require("mongoose");
var nodeoutlook = require("nodejs-nodemailer-outlook");
const MONGODB_URI =
  "mongodb://GiteshMedi:shastri1@ds263590.mlab.com:63590/medicento";
const PERSON = require("./models/sperson");
const SalesOrder = require("./models/SalesOrder");
const SalesOrderItems = require("./models/SalesOrderItem");
const Products = require("./models/productandmedi");
const Product = require("./models/Product");
const message = require("./models/message");
const VpiInventory = require("./models/vpimedicine");
const Inventoy = require("./models/InventoryProduct");
const Dist = require("./models/Inventory");
mongoose.connect(
  MONGODB_URI,
  function () {
    console.log("connected to DB");
  }
);
mongoose.Promise = global.Promise;
var deepPopulate = require("mongoose-deep-populate")(mongoose);
var csv = require("fast-csv");
const app = express();
var datah = "Helow";
var distributor = {};
var pro = [];
const port = process.env.PORT || 3000;
var admin = require("firebase-admin");
var doc1 = undefined;

var serviceAccount = require("./public/medicentomessaging-firebase-adminsdk-rkrq1-df71338e06.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://medicentomessaging.firebaseio.com"
});

app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.set("view engine", "ejs");
app.locals.moment = moment;
var session = require("express-session");
app.use(
  session({
    secret: "ssshhhhh",
    resave: false,
    saveUninitialized: true
  })
);
var upload = multer({
  dest: "uploads/"
});

app.get("/pharmacy_login", (req, res, next) => {
  res.render("login");
});

app.get("/code", (req, res, next) => {
  pharmacy.findOne({
      _id: req.query.email
    })
    .exec()
    .then((doc) => {
      PERSON.findOne({
          Allocated_Pharma: doc._id
        })
        .populate('user')
        .exec()
        .then((doc2) => {
          doc1 = doc2;
          res.redirect("/pharmacy");
        })
        .catch((err) => {
          res.redirect("/pharmacy_login");
        });
    })
    .catch((err) => {
      res.redirect("/pharmacy_login");
    });
});

app.post("/login", (req, res, next) => {
  User.findOne({
      useremail: req.body.email,
      usercode: req.body.pharmaId
    })
    .exec()
    .then((doc) => {
      console.log(doc);
      PERSON.findOne({
          user: doc._id
        })
        .populate('user')
        .exec()
        .then((doc2) => {
          doc1 = doc2;
          res.redirect("/pharmacy");
        })
        .catch((err) => {
          res.redirect("/pharmacy_login");
        });
    })
    .catch((err) => {
      res.redirect("/pharmacy_login");
    });
});

app.get("/pharmacy", (req, res, next) => {
  date = Date.now();
  if (doc1 == undefined) {
    res.redirect("/pharmacy_login");
  }
  const title = "Dashboard";
  console.log(doc1);
  res.render("index", {
    date: date,
    deliverOrders: [],
    title: title,
    doc: doc1
  });
});

app.get("/order", (req, res, next) => {});

app.get("/pharmacy_orders", (req, res, next) => {
  const title = "Orders";
  if (doc1 == undefined) {
    res.redirect("/pharmacy_login");
  }
  SalesOrder.find({
      sales_person_id: doc1._id
    })
    .populate("order_items")
    .exec()
    .then((docu) => {
      console.log(docu);
      res.render("pharmacy_orders", {
        title: title,
        doc: doc1,
        docu: docu
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/pharmacy_product", (req, res, next) => {
  const title = "Product";
  if (doc1 == undefined) {
    res.redirect("/pharmacy_login");
  }
  Products.find()
    .populate("product_id", "medicento_name company_name total_stock")
    .populate("inventory_product_id", "stock_left")
    .exec()
    .then((prod) => {
      console.log(prod);
      res.render("pharmacy_products", {
        title: title,
        doc: doc1,
        prod: prod
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/logout", (req, res, next) => {
  doc1 = undefined;
  res.redirect("/pharmacy_login");
});

app.get("/distributor_login", (req, res, next) => {
  res.render("distributor_login");
});

app.get("/distributor_product_tulsi", (req, res, next) => {
  if (datah == "Helow") {
    console.log("Not");
    res.render("distributor_product_tulsi", {
      title: "Inventoy Product",
      data: datah,
      product1: []
    });
  } else {
    var data = datah;
    datah = "Helow";
    res.render("distributor_product_tulsi", {
      title: "Inventoy Product",
      data: data[0],
      product1: data.slice(1, 100)
    });
  }
});

app.post("/dlogin", (req, res, next) => {
  if (req.body.email == "medicento@test.com" && req.body.password == "test") {
    res.redirect("/distributor_static");
  } else if (
    req.body.email == "tulsipharma@yahoo.co.in" &&
    req.body.password == "tulsimed"
  ) {
    res.redirect("/distributor_tulsi");
  } else {
    Dist.findOne({
        email: req.body.email,
        password: req.body.password
      })
      .exec()
      .then((doc) => {
        if (doc == null) {
          res.redirect("/distributor_login");
        }
        console.log(doc);
        req.session.dist = doc;
        res.redirect("/distributor");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/distributor_login");
      });
  }
});

app.get("/distributor_static", (req, res, next) => {
  res.render("distributor_static", {
    date: new Date(),
    title: "Dashboard"
  });
});

app.get("/distributor_tulsi", (req, res, next) => {
  res.render("distributor_tulsi", {
    date: new Date(),
    title: "Dashboard"
  });
});

app.get("/distributor_order_tulsi", (req, res, next) => {
  res.render("distributor_order_tulsi", {
    title: "Orders"
  });
});

app.post("/upload_tulsi", upload.single("csvdata"), function (req, res, next) {
  const fileRows = [];
  const product = [];
  const comp = [];
  var count1 = 0;
  csv
    .fromPath(req.file.path)
    .on("data", function (data) {
      fileRows.push(data); // push each row
    })
    .on("end", function () {
      datah = fileRows;
      res.redirect("/distributor_product_tulsi");
      // remove temp file
      //process "fileRows" and respond
    });
});

app.get("/distributor_order_static", (req, res, next) => {
  SalesOrder.find()
    .populate("order_items")
    .populate("pharmacy_id")
    .populate("sales_person_id")
    .exec()
    .then((docu) => {
      console.log(docu[0]);
      res.render("distributor_order_static", {
        title: "Orders",
        doc: doc1,
        docu: docu.reverse(),
        distributor: req.session.dist
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.get("/distributor_logout", (req, res, next) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/distributor_login");
    }
  });
});

app.get("/list", (req, res, next) => {
  var list = [];
  pharmacy
    .find()
    .exec()
    .then(function (pharm) {
      pharm.forEach((member) => {
        list.push({
          pharma_name: member.pharma_name,
          id: member._id.toString(),
          totalAmount: 0
        });
      });
      SalesOrder.find()
        .exec()
        .then(function (order_items) {
          var total = 0;
          order_items.forEach((item) => {
            list.forEach((member) => {
              if (member.id === item.pharmacy_id.toString()) {
                member.totalAmount += Number(item.grand_total) + 0;
                total += Number(item.grand_total) + 0;
              }
            });
          });
          list.sort(function (a, b) {
            return parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
          });
          list.reverse();
          res.status(200).json(list);
          console.log(total * (95 / 126));
        });
      // console.log(list);
      // res.status(200).json(list);
    });
});

app.get("/distributor", isLoggedIn, (req, res, next) => {
  var today = new Date();
  var month1 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month2 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month3 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month4 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month5 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month6 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month7 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month8 = today.getMonth() + 1;
  today.setMonth(today.getMonth() - 1);
  var month9 = today.getMonth() + 1;
  // console.log(month1,month2,month3,month4,month5);
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];

  function monthNumToName(monthnum) {
    return months[monthnum - 1] || "";
  }
  var monthsName = [
    monthNumToName(month1),
    monthNumToName(month2),
    monthNumToName(month3),
    monthNumToName(month4),
    monthNumToName(month5),
    monthNumToName(month6),
    monthNumToName(month7),
    monthNumToName(month8),
    monthNumToName(month9)
  ];
  var monthsNumber = [
    month1,
    month2,
    month3,
    month4,
    month5,
    month6,
    month7,
    month8,
    month9
  ];
  var monthRevenue = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var maxOrderSize = 0,
    totalOrders = 0,
    total = 0;
  var statusActive = 0,
    statusCanceled = 0,
    statusDelivered = 0,
    statusActive = 0,
    statusNotDelivered = 0,
    statusShipped = 0,
    statusPacked = 0;
  var list = [];
  pharmacy
    .find()
    .exec()
    .then(function (pharm) {
      pharm.forEach((member) => {
        list.push({
          pharma_name: member.pharma_name,
          id: member._id.toString(),
          totalAmount: 0
        });
      });
      var totalPharmacy = list.length;
      SalesOrder.find()
        .exec()
        .then(function (order_items) {
          order_items.forEach((order) => {
            list.forEach((member) => {
              if (member.id === order.pharmacy_id.toString()) {
                member.totalAmount +=
                  Number((95 / 126) * order.grand_total) + 0;
              }
            });
            switch (order.created_at.getMonth() + 1) {
              case month1:
                monthRevenue[0] += (95 / 126) * Number(order.grand_total);
                break;
              case month2:
                monthRevenue[1] += (95 / 126) * Number(order.grand_total);
                break;
              case month3:
                monthRevenue[2] += (95 / 126) * Number(order.grand_total);
                break;
              case month4:
                monthRevenue[3] += (95 / 126) * Number(order.grand_total);
                break;
              case month5:
                monthRevenue[4] += (95 / 126) * Number(order.grand_total);
                break;
              case month6:
                monthRevenue[5] += (95 / 126) * Number(order.grand_total);
                break;
              case month7:
                monthRevenue[6] += (95 / 126) * Number(order.grand_total);
                break;
              case month8:
                monthRevenue[7] += (95 / 126) * Number(order.grand_total);
                break;
              case month9:
                monthRevenue[8] += (95 / 126) * Number(order.grand_total);
                break;
            }
            if (order.status === "Active") statusActive++;
            else if (order.status === "Delivered") statusDelivered++;
            else if (order.status === "Canceled") statusCanceled++;
            else if (order.status === "Not Delivered") statusNotDelivered++;
            else if (order.status === "Packed") statusPacked++;
            else if (order.status === "Shipped") statusShipped++;
            totalOrders += 1;
            total += (95 / 126) * Number(order.grand_total);
            if ((95 / 126) * Number(order.grand_total) > maxOrderSize) {
              maxOrderSize = ((95 / 126) * Number(order.grand_total)).toFixed(
                2
              );
            }
          });
          list.sort(function (a, b) {
            return parseFloat(a.totalAmount) - parseFloat(b.totalAmount);
          });
          list.reverse();
          total = total.toFixed(2);
          console.log(monthRevenue);
          statusActive += statusNotDelivered;
          date = Date.now();
          res.render("distributor_dashboard", {
            date: date,
            title: "Dashboard",
            distributor: req.session.dist,
            maxOrderSize: maxOrderSize,
            totalOrders: totalOrders - statusCanceled,
            statusActive: statusActive,
            statusCanceled: statusCanceled,
            statusDelivered: statusDelivered,
            statusActive: statusActive,
            statusNotDelivered: statusNotDelivered,
            statusShipped: statusShipped,
            statusPacked: statusPacked,
            total: total,
            monthlyRevenue: monthRevenue,
            monthsName: monthsName,
            monthsNumber: monthsNumber,
            list: list,
            totalPharmacy: totalPharmacy
          });
        });
    });

  console.log(req.session.dist);
});

app.get("/distributor_order", isLoggedIn, (req, res, next) => {
  SalesOrder.find()
    .populate("order_items")
    .populate("pharmacy_id")
    .populate("sales_person_id")
    .exec()
    .then((docu) => {
      console.log(docu[0]);
      res.render("distributor_orders", {
        title: "Orders",
        doc: doc1,
        docu: docu.reverse(),
        distributor: req.session.dist
      });
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/csvFile", (req, res, next) => {
  SalesOrder.findById(req.body.id)
    .populate("order_items")
    .populate("pharmacy_id")
    .exec()
    .then((order) => {
      console.log(order);
      var arr = [];
      arr.push([
        "Order_id",
        "created_at",
        "pharmacy_name",
        "grand_total",
        "order_item_id",
        "medicine_name",
        "quantity",
        "price",
        "manufacturer_name",
        "total_amount"
      ]);
      arr.push([
        order._id,
        moment(order.created_at).format("YYYY/DD/MM"),
        order.pharmacy_id.pharma_name,
        order.grand_total,
        order.order_items[0]._id,
        order.order_items[0].medicento_name,
        order.order_items[0].quantity,
        order.order_items[0].paid_price,
        order.order_items[0].company_name,
        order.order_items[0].total_amount
      ]);
      if (order.order_items.length > 1) {
        for (var i = 1; i < order.order_items.length; i++) {
          arr.push([, , , ,
            order.order_items[i]._id,
            order.order_items[i].medicento_name,
            order.order_items[i].quantity,
            order.order_items[i].paid_price,
            order.order_items[i].company_name,
            order.order_items[i].total_amount
          ]);
        }
      }
      var ws = fs.createWriteStream("./uploads/order.csv");
      csv.write(arr, {
        headers: true
      }).pipe(ws);
      nodeoutlook.sendEmail({
        auth: {
          user: "Team.medicento@outlook.com",
          pass: "med4lyf@51"
        },
        from: "Team.medicento@outlook.com",
        to: "giteshshastri96@gmail.com,Contact.medicento@gmail.com,sale.medicento@gmail.com",
        subject: "Sales Order - VPI - " +
          order.pharmacy_id.pharma_name +
          " | " +
          moment(order.created_at).format("YYYY/DD/MM"),
        attachments: [{
          filename: "SalesOrder_Medicento_" +
            order.pharmacy_id.pharma_name +
            "_" +
            moment(Date.now()).format("DD-MM-YY") +
            ".csv",
          path: "./uploads/order.csv"
        }]
      });
    })
    .catch((error) => {
      console.log(error);
    });
  res.redirect("/distributor_order");
});

app.post("/upload", isLoggedIn, upload.single("csvdata"), function (
  req,
  res,
  next
) {
  const fileRows = [];
  const product = [];
  const comp = [];
  var count1 = 0;
  if (req.session.dist.email == "contact@vpiindia.com") {
    VpiInventory.remove({}).exec();
  }
  // open uploaded file
  csv
    .fromPath(req.file.path)
    .on("data", function (data) {
      fileRows.push(data); // push each row
      if (data[1] != "Item name") {
        var vpi = new VpiInventory();
        vpi.Item_name = data[1];
        vpi.batch_no = data[2];
        vpi.expiry_date = data[3];
        vpi.qty = data[4];
        vpi.packing = data[5];
        vpi.item_code = data[0];
        vpi.mrp = data[6];
        vpi.manfc_code = data[7];
        vpi.manfc_name = data[8];
        vpi.save();
      }
    })
    .on("end", function () {
      message
        .find()
        .exec()
        .then((mess) => {
          mess[0].count = mess[0].count + 1;
          mess[0].save();
          console.log(mess[0]);
        })
        .catch();
      datah = fileRows;
      pro = product;
      res.redirect("/distributor_product");
      // remove temp file
      //process "fileRows" and respond
    });
});

app.get(
  "/distributor_product",
  isLoggedIn,
  upload.single("csvdata"),
  (req, res, next) => {
    if (datah == "Helow") {
      console.log("Not");
      res.render("distributor_product", {
        title: "Inventoy Product",
        data: datah,
        product1: [],
        distributor: req.session.dist
      });
    } else {
      var data = datah;
      datah = "Helow";
      res.render("distributor_product", {
        title: "Inventoy Product",
        data: data[0],
        distributor: req.session.dist,
        product1: data.slice(1, 100)
      });
    }
  }
);

app.get("/distributor_review", (req, res, next) => {
  const title = "Review";
  res.render("distributor_review");
});

app.get("**", (req, res, next) => {
  res.render("pageNotFound");
});

function isLoggedIn(req, res, next) {
  if (req.session.dist) {
    next();
  } else {
    res.redirect("/distributor_login");
  }
}

app.listen(port, function () {
  console.log("Server Has Started at port : " + port);
});