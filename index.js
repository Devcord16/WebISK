const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios")

const { JSDOM } = require("jsdom");

let levelingData = [];

const refreshLeaderboardData = async () => {
  try {
    const { data } = await axios.get("https://lurkr.gg/levels/1054414599945998416");
    const dom = new JSDOM(data);
    const scriptContent = dom.window.document.querySelector("script#__NEXT_DATA__").textContent;
    const parsedData = JSON.parse(scriptContent);
    levelingData = parsedData.props.pageProps;
  } catch (error) {
    console.error("Error refreshing leaderboard data:", error.message);
  }
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
  try {
    let filteredData = levelingData.levels || [];
    const pageCount = Math.ceil(filteredData.length / 10);
    let page = parseInt(req.query.p) || 1;
    const usernameToSearch = req.query.username;

    if (usernameToSearch) {
      filteredData = filteredData.filter((user) => user.username && user.username.includes(usernameToSearch));
    }

    if (page > pageCount) {
      page = pageCount;
    }

    const temp = { ...levelingData };
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
    });
  } catch (error) {
    console.error("Error processing leaderboard request:", error.message);
    res.status(500).send("Internal Server Error");
  }
});
