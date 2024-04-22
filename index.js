const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios")

const { JSDOM } = require("jsdom");

let levelingData = [];

const refreshLeaderboardData = async () => {
  try {
    const { data } = await axios.get("https://lurkr.gg/levels/1054414599945998416")
    const dom = new JSDOM(data)
    levelingData = dom.window.document.querySelector(
      "script#__NEXT_DATA__"
    ).textContent;
    levelingData = JSON.parse(levelingData);
    levelingData = levelingData.props.pageProps;
  } catch(e) { console.log(e) }
};

refreshLeaderboardData();

setInterval(refreshLeaderboardData, 45000);

const app = express();

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/", function (req, res) {
  res.render("home", { title: "Home", url: req.fullUrl });
});

app.get("/info", (req, res) => {
  res.render("info", { title: "Information", url: req.fullUrl });
});

app.get("/leaderboard", function (req, res) {
  let filteredData = levelingData.levels || [];

  const pageCount = Math.ceil(filteredData.length / 10);
  let page = parseInt(req.query.p) || 1;
  const usernameToSearch = req.query.username;

  if (usernameToSearch) {
    // If a username is provided in the query, filter the data based on the username
    filteredData = filteredData.filter(
      (user) => user.username && user.username.includes(usernameToSearch)
    );
  }

  if (page > pageCount) {
    page = pageCount;
  }

  const temp = { ...levelingData }; // Use the spread operator to create a shallow copy
  temp.levels = filteredData.slice((page - 1) * 10, page * 10);
  let levels = [];
  for (let i = 0; i < temp.levels.length; i++) {
    const originalIndex = levelingData.levels.indexOf(temp.levels[i]);
    levels.push(originalIndex + 1);
  }
  res.render("leaderboard", {
    title: "Leaderboard",
    levels: levels,
    levelingData: temp,
    page: page,
    pageCount: pageCount,
    url: req.fullUrl,
    searchTerm: usernameToSearch,
    url: req.fullUrl,
  });
});

const port = 8080;

app.listen(port, () => {
  console.log(`App is running on port ${port}`);
});
