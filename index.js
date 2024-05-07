const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const https = require("https");
const { JSDOM } = require("jsdom");

let leaderboardData;

function https_fetch(url, path, method, headers, body, get_headers) {
  if (body) headers["Content-Length"] = body.length;
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url,
        path: path,
        method: method,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
          DNT: "1",
          "Sec-GPC": "1",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          TE: "trailers",
          ...headers,
        },
      },
      (res) => {
        if (get_headers) resolve(res.headers);
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    if (body) req.write(body);
    req.end();
  });
}

const refreshLeaderboardData = async (page = 1) => {
  try {
    const data = await https_fetch(
      "api.lurkr.gg",
      `/v2/levels/sciencekingdom?page=${page}`,
      "GET"
    );
    const honoka = JSON.parse(data);
    if (page === 1) leaderboardData = honoka;
    else leaderboardData.levels.push(...honoka.levels);

    if (honoka.levels.length > 0) await refreshLeaderboardData(page + 1);
  } catch (err) {
    console.log(err);
  }
};

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
  let levelingData = leaderboardData;
  let filteredData = levelingData.levels || [];
  //console.log(levelingData);

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

app.listen(port, async () => {
  console.log(`App is running on port ${port}`);
  await refreshLeaderboardData();
  setInterval(refreshLeaderboardData, 600000);
});
