const feed = document.getElementById("feed");
const contentRow = document.getElementById("content-row");
const clockEl = document.getElementById("clock");
const phosphorBtn = document.getElementById("phosphor-toggle");
const cmdPromptEl = document.querySelector(".cmd-prompt");

// ---------- fake path / session state ----------
const BOOT_TIME = Date.now();
const VOLUME_SERIAL = [0, 0].map(() =>
  Math.floor(Math.random() * 0xffff).toString(16).toUpperCase().padStart(4, "0")
).join("-");
let currentPath = "C:\\SYS400";

function setPath(path) {
  currentPath = path;
  cmdPromptEl.textContent = currentPath + ">";
  document.body.style.setProperty("--prompt-prefix", JSON.stringify(currentPath + "> "));
}

function formatUptime() {
  const secs = Math.floor((Date.now() - BOOT_TIME) / 1000);
  const m = String(Math.floor(secs / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ---------- clock ----------
function tick() {
  const now = new Date();
  clockEl.textContent = now.toTimeString().slice(0, 8);
}
tick();
setInterval(tick, 1000);

// ---------- phosphor color toggle ----------
const PHOSPHOR_CYCLE = ["green", "amber"];
const PHOSPHOR_LABELS = { green: "[ COLOR: GRN ]", amber: "[ COLOR: AMB ]" };

const storedPhosphor = localStorage.getItem("phosphor");
const savedPhosphor = PHOSPHOR_CYCLE.includes(storedPhosphor) ? storedPhosphor : "green";
document.body.dataset.phosphor = savedPhosphor;
phosphorBtn.textContent = PHOSPHOR_LABELS[savedPhosphor];

phosphorBtn.addEventListener("click", () => {
  const current = PHOSPHOR_CYCLE.indexOf(document.body.dataset.phosphor);
  const next = PHOSPHOR_CYCLE[(current + 1) % PHOSPHOR_CYCLE.length];
  document.body.dataset.phosphor = next;
  localStorage.setItem("phosphor", next);
  phosphorBtn.textContent = PHOSPHOR_LABELS[next];
});

// ---------- terminal feed ----------
const MAX_LINES = 60;
let lineQueue = [];
let typing = false;

function pushLine(text, opts = {}) {
  lineQueue.push({ text, opts });
  if (!typing) drainQueue();
}

function drainQueue() {
  if (lineQueue.length === 0) { typing = false; return; }
  typing = true;
  const { text, opts } = lineQueue.shift();

  if (opts.action) {
    opts.action();
    contentRow.scrollTop = contentRow.scrollHeight;
    setTimeout(drainQueue, opts.delay ?? 0);
    return;
  }

  const div = document.createElement("div");
  div.className = "feed-line"
    + (opts.dim ? " dim" : "")
    + (opts.prompt ? " prompt" : "")
    + (opts.ascii ? " ascii" : "")
    + (opts.error ? " error" : "");
  div.textContent = text;
  feed.appendChild(div);

  while (feed.children.length > MAX_LINES) {
    feed.removeChild(feed.firstChild);
  }

  contentRow.scrollTop = contentRow.scrollHeight;
  setTimeout(drainQueue, opts.delay ?? 70);
}

function pushBlock(lines, baseDelay = 70) {
  lines.forEach((l) => {
    if (typeof l === "string") pushLine(l, { delay: baseDelay });
    else pushLine(l.text, { ...l, delay: l.delay ?? baseDelay });
  });
}

function clearFeed() {
  lineQueue = [];
  feed.innerHTML = "";
}

// ---------- fake loading bar ----------
function loadingBar(label, callback) {
  const div = document.createElement("div");
  div.className = "feed-line dim";
  feed.appendChild(div);
  while (feed.children.length > MAX_LINES) feed.removeChild(feed.firstChild);

  const total = 20;
  let progress = 0;
  const id = setInterval(() => {
    progress++;
    const filled = "#".repeat(progress);
    const empty = ".".repeat(total - progress);
    const pct = Math.round((progress / total) * 100);
    div.textContent = `${label} [${filled}${empty}] ${pct}%`;
    contentRow.scrollTop = contentRow.scrollHeight;
    if (progress >= total) {
      clearInterval(id);
      setTimeout(callback, 150);
    }
  }, 20);
}

// ---------- ascii art ----------
const LOGO_ASCII = [
  "  _________ ___ _______ ___ __  __  ___  ",
  " / ___/ __ \\\\__ \\\\ ___// _ \\\\/ / / / / _ \\\\ ",
  " \\\\__ \\\\/ /_/ /_/ / /__ / / / /_/ / / /// ",
  "/____/\\\\____/____/____//_/  \\\\____/\\\\____/  ",
  "                                            ",
  "     [ TERMINAL EMULATION SYSTEM ]         ",
].join("\n");

// rendered from background-removed.png via grayscale-to-character-density mapping,
// sized to 32 rows so it spans the full height of the about text block
const ART_ABOUT = [
  "                 .:-==-:.                   ",
  "               :*%%%%%%%**+:                ",
  "              -%@@%%%%####%#*:              ",
  "            .*%%%%##****+=*##%=             ",
  "            *@#**++=-::::::-+#%.            ",
  "           .@#*++==-::::::::-*#+            ",
  "           -%#*++=-:::....:::=*#.           ",
  "           -%#*+==-:::::::::-=+*:           ",
  "           -%*+==--::::....::--=.           ",
  "           -##*++=--::::----::--.           ",
  "           -##%****+-:=**+=+-:--.           ",
  "           -###**++#=.-+**=--::-:.          ",
  "          :#**##*+=*=..-===-::--::          ",
  "          =%*+===-+*-::.::...:-=::          ",
  "          -%#*=--=**-:::..::::-=-:          ",
  "          .##*+===#%*=+-::::::=+:.          ",
  "           +##+=-+#*++=-:::::-++-           ",
  "           :##*=*##*+++++-::-=++.           ",
  "            *#**###*==-=**=-==+=            ",
  "            -%*#***++=--=*++===.            ",
  "             #%%*#**+=+=+**==+-             ",
  "             =@%##*++++***#++=-             ",
  "             -%%%%#******##+=-:             ",
  "            .*#*#######***+---..            ",
  "         :=+**##***##**+==--:...:..         ",
  "      :=*###**###**++==----. ........       ",
  "  .:=+*****##*******+====:..............    ",
  ":-======+++***+++++==++-:.................. ",
  "=-------====+++++=-:=**=....................",
  ":::---::-==--==+==-=%%#+- ....:.............",
  ":::--:::---::-===-+%#==*#= ..::.............",
  "::::-::::-=:.:==--#@%*=***:..:.......... .:.",
].join("\n");

const ART_PROJECTS = [
  "      _____________",
  "     /            /|",
  "    /____________/ |",
  "   |  [DIR] SRC  |  |",
  "   |  [DIR] DOCS |  |",
  "   |  [DIR] BIN  | /",
  "   |____________|/",
].join("\n");

const ART_CONTACT = [
  "       _____________",
  "      /            /|",
  "     /   @  MAIL  / |",
  "    /____________/  |",
  "    |____________|  |",
  "      \\\\          \\\\ |",
  "       \\\\__________\\\\|",
].join("\n");

const GALLERY = [
  LOGO_ASCII,
  ART_ABOUT,
  ART_PROJECTS,
  ART_CONTACT,
  [
    "    /\\\\_/\\\\",
    "   ( o.o )   SYS400 CAT MASCOT",
    "    > ^ <",
  ].join("\n"),
];
let galleryIndex = 0;

const IMAGES = {
  logo: LOGO_ASCII,
  about: ART_ABOUT,
  projects: ART_PROJECTS,
  contact: ART_CONTACT,
  cat: GALLERY[GALLERY.length - 1],
};

// ---------- content sections ----------
const sections = {
  home: () => [
    { text: "SYSTEM READY", dim: true },
    "WELCOME TO SYS400 TERMINAL SERVICES",
    { text: "------------------------------------------------------------------------------------------------", dim: true },
    { text: "USER SESSION ESTABLISHED", prompt: true },
    "TYPE A COMMAND OR FUNCTION KEY BELOW TO LOAD A MODULE.",
    "  F1  HOME       F2  ABOUT         F3  PROJECTS     F4  CONTACT     F12  CLEAR",
    "TYPE 'HELP' FOR THE FULL COMMAND LIST.",
    { text: "------------------------------------------------------------------------------------------------", dim: true },
  ],
  about: {
    header: [
      { text: "MODULE: ABOUT", prompt: true },
      { text: "------------------------------------------------------------------------------------------------", dim: true },
    ],
    content: [
    "NAME ....... FRANK KENNEDY                    LOCATION ... NORTH CAROLINA, USA",
    "ROLE ....... FULL-STACK DEVELOPER & IT PROF.   ACTIVE ..... 2012 - PRESENT (14+ YRS)",
    "",
    "SKILLS:",
    "  OS .......... WINDOWS, MACOS, LINUX, IOS/IPADOS, ANDROID",
    "  FRONTEND .... HTML5, CSS3, REACT, BOOTSTRAP, ANGULAR",
    "  BACKEND ..... JAVASCRIPT, PHP, SQL, JAVA, PYTHON, SWIFT",
    "  PLATFORM .... SERVICENOW DEV/ADMIN, REST APIS, OAUTH",
    "",
    "BIO:",
    "  NORTH CAROLINA-BASED IT PROFESSIONAL WITH 14+ YEARS IN ADVANCED TECHNICAL SUPPORT, SERVICENOW DEVELOPMENT, AND ENTERPRISE INFRASTRUCTURE. SPECIALIZES IN SOLVING COMPLEX TECHNICAL PROBLEMS, BUILDING SCALABLE WORKFLOWS, AND INTEGRATING MODERN SYSTEMS VIA REST APIS, OAUTH, SQL, AND FULL-STACK DEVELOPMENT. BACKGROUND INCLUDES SUPPORTING MULTIMILLION-DOLLAR E-COMMERCE OPERATIONS, BUILDING FORENSIC WORKSTATIONS FOR GOVERNMENT AGENCIES, AND CONTRIBUTING TO OFFICE 365 MIGRATIONS.",
    "",
    "  OUTSIDE OF WORK: SELF-TAUGHT CODER AND LIFELONG TINKERER WHO LOVES HOME SERVERS, DRONES, VIDEO PRODUCTION, AND MUSIC CREATION.",
    "",
    "EXPERIENCE:",
    "  2012-PRESENT   FREELANCE — FRANKKENNEDY.DEV",
    "  2024-2026      ADVANCED SUPPORT ANALYST — MPULSE",
    "  2021-2024      SERVICENOW SYS ADMIN/DEV — CDW/ILLUMIFIN",
    "  2014-2021      IT MANAGER/WEB DEV — TRI-TECH FORENSICS",
    ],
    footer: [
      { text: "------------------------------------------------------------------------------------------------", dim: true },
      { text: "END OF RECORD", dim: true },
    ],
  },
  projects: {
    header: [
      { text: "MODULE: PROJECTS", prompt: true },
      { text: "------------------------------------------------------------------------------------------------", dim: true },
    ],
    content: [
    "REC 001  WEB DEVELOPMENT ............... [ STATUS: ACTIVE ]",
    "         CUSTOM-BUILT WEBSITES AND WEB APPS TAILORED TO YOUR BRAND — FAST, RESPONSIVE, MODERN FRAMEWORKS.",
    "",
    "REC 002  APPLICATION DEVELOPMENT ........ [ STATUS: ACTIVE ]",
    "         CROSS-PLATFORM MOBILE AND DESKTOP APPS WITH ROBUST BACK-ENDS AND SEAMLESS API INTEGRATIONS.",
    "",
    "REC 003  CUSTOM HARDWARE BUILDS ......... [ STATUS: ACTIVE ]",
    "         HANDCRAFTED WORKSTATIONS, GAMING RIGS, AND STORAGE TOWERS BUILT TO SPEC.",
    "",
    "REC 004  DRONE PHOTOGRAPHY ............... [ STATUS: ACTIVE ]",
    "         CINEMATIC AERIAL FOOTAGE AND HI-RES PHOTOGRAPHY FOR REAL ESTATE, EVENTS, AND CONTENT CREATORS.",
    "",
    "REC 005  DIGITAL RECON (OSINT) ........... [ STATUS: BETA ]",
    "         OPEN-SOURCE INTELLIGENCE GATHERING AND DIGITAL FOOTPRINT ANALYSIS FOR SECURITY RESEARCH.",
    "",
    "REC 006  VIDEOGAMES ....................... [ STATUS: WIP ]",
    "         FUN AND ADDICTIVE GAMES FOR ALL PLATFORMS, CURRENTLY IN DEVELOPMENT.",
    ],
    footer: [
      { text: "------------------------------------------------------------------------------------------------", dim: true },
      { text: "END OF RECORD", dim: true },
    ],
  },
  contact: {
    header: [
      { text: "MODULE: CONTACT", prompt: true },
      { text: "------------------------------------------------------------------------------------------------", dim: true },
    ],
    content: [
    "EMAIL ........... FRANK@FRANKKENNEDY.DEV          PHONE ........... +1 (803) 517-5480",
    "WEBSITE ......... FRANKKENNEDY.DEV                GITHUB .......... GITHUB.COM/VYPORX",
    "LINKEDIN ........ LINKEDIN.COM/IN/FRANKJKENNEDY    INSTAGRAM ....... @VYPORX",
    "LOCATION ........ NORTH CAROLINA, USA",
    "",
    "  AVAILABLE FOR NEW PROJECTS. REACH OUT VIA ANY CHANNEL ABOVE TO DISCUSS WORK OR OPPORTUNITIES.",
    ],
    footer: [
      { text: "------------------------------------------------------------------------------------------------", dim: true },
      { text: "END OF RECORD", dim: true },
    ],
  },
};

// ---------- snake game ----------
const gameCanvas = document.getElementById("game-canvas");
let snakeState = null;

function startSnake() {
  const W = 38;
  const H = 16;
  feed.hidden = true;
  document.getElementById("cmd-form").hidden = true;
  gameCanvas.hidden = false;
  cmdInput.blur();

  snakeState = {
    w: W,
    h: H,
    snake: [{ x: 10, y: 8 }, { x: 9, y: 8 }, { x: 8, y: 8 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: { x: 20, y: 8 },
    score: 0,
    over: false,
    intervalId: null,
  };

  placeFood();
  renderSnake();
  scheduleSnakeTick();
}

// monospace cells are taller than they are wide, so a vertical step covers
// more visual distance than a horizontal one — slow vertical ticks down to
// compensate so the snake's perceived speed is the same in all directions.
const SNAKE_BASE_INTERVAL = 95;
const SNAKE_VERTICAL_FACTOR = 1.7;

function scheduleSnakeTick() {
  const s = snakeState;
  if (!s || s.over) return;
  const interval = s.nextDir.y !== 0 ? SNAKE_BASE_INTERVAL * SNAKE_VERTICAL_FACTOR : SNAKE_BASE_INTERVAL;
  s.intervalId = setTimeout(() => {
    snakeTick();
    scheduleSnakeTick();
  }, interval);
}

function placeFood() {
  const s = snakeState;
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * s.w), y: Math.floor(Math.random() * s.h) };
  } while (s.snake.some((seg) => seg.x === pos.x && seg.y === pos.y));
  s.food = pos;
}

function snakeTick() {
  const s = snakeState;
  if (!s || s.over) return;
  s.dir = s.nextDir;
  const head = s.snake[0];
  const newHead = { x: head.x + s.dir.x, y: head.y + s.dir.y };

  const hitWall = newHead.x < 0 || newHead.x >= s.w || newHead.y < 0 || newHead.y >= s.h;
  const hitSelf = s.snake.some((seg) => seg.x === newHead.x && seg.y === newHead.y);

  if (hitWall || hitSelf) {
    endSnake();
    return;
  }

  s.snake.unshift(newHead);
  if (newHead.x === s.food.x && newHead.y === s.food.y) {
    s.score += 10;
    placeFood();
  } else {
    s.snake.pop();
  }
  renderSnake();
}

function renderSnake() {
  const s = snakeState;
  const grid = Array.from({ length: s.h }, () => Array(s.w).fill(" "));
  s.snake.forEach((seg, i) => {
    if (seg.y >= 0 && seg.y < s.h && seg.x >= 0 && seg.x < s.w) {
      grid[seg.y][seg.x] = i === 0 ? "@" : "o";
    }
  });
  grid[s.food.y][s.food.x] = "*";

  const border = "#".repeat(s.w + 2);
  const rows = grid.map((row) => "#" + row.join("") + "#");
  const text = [
    `SNAKE.EXE   SCORE: ${s.score}   [ESC=QUIT]`,
    border,
    ...rows,
    border,
  ].join("\n");
  gameCanvas.textContent = text;
}

function endSnake() {
  const s = snakeState;
  s.over = true;
  clearTimeout(s.intervalId);
  gameCanvas.hidden = true;
  feed.hidden = false;
  document.getElementById("cmd-form").hidden = false;
  pushLine(`GAME OVER — FINAL SCORE: ${s.score}`, { prompt: true });
  pushLine("TYPE 'SNAKE' TO PLAY AGAIN.", { dim: true });
  cmdInput.focus();
  snakeState = null;
}

document.addEventListener("keydown", (e) => {
  if (snakeState && !snakeState.over) {
    const s = snakeState;
    const opposite = (a, b) => a.x === -b.x && a.y === -b.y;
    let proposed = null;
    if (e.key === "ArrowUp") proposed = { x: 0, y: -1 };
    else if (e.key === "ArrowDown") proposed = { x: 0, y: 1 };
    else if (e.key === "ArrowLeft") proposed = { x: -1, y: 0 };
    else if (e.key === "ArrowRight") proposed = { x: 1, y: 0 };
    else if (e.key === "Escape") { endSnake(); return; }
    else return;

    e.preventDefault();
    if (!opposite(proposed, s.dir)) s.nextDir = proposed;
  }
});

const FILES = [
  { name: "HOME.SYS", size: 1024 },
  { name: "ABOUT.SYS", size: 4096 },
  { name: "PROJECTS.SYS", size: 3072 },
  { name: "CONTACT.SYS", size: 1536 },
];

// ---------- command registry ----------
const commands = {
  help: {
    desc: "list available commands",
    run: () => {
      pushLine("AVAILABLE COMMANDS:", { prompt: true });
      Object.entries(commands).forEach(([name, cmd]) => {
        pushLine(`  ${name.padEnd(10)} ${cmd.desc}`, { dim: true, delay: 30 });
      });
      pushLine("TYPE 'MAN <COMMAND>' FOR DETAILS.", { dim: true });
    },
  },
  man: {
    desc: "man <command> — show details for a command",
    run: (args) => {
      const name = (args[0] || "").toLowerCase();
      if (!name) { pushLine("USAGE: MAN <COMMAND>", { dim: true }); return; }
      const cmd = commands[name];
      if (!cmd) { pushLine(`NO MANUAL ENTRY FOR '${name.toUpperCase()}'`, { error: true }); return; }
      pushLine(`NAME`, { prompt: true });
      pushLine(`  ${name} - ${cmd.desc}`, { dim: true });
    },
  },
  home: { desc: "load home module", run: () => loadingBar("LOADING HOME MODULE", () => pushBlock(sections.home())) },
  about: {
    desc: "load about module",
    run: () => loadingBar("LOADING ABOUT MODULE", () => {
      pushBlock(sections.about.header);
      pushBlock(sections.about.content);
      pushBlock(sections.about.footer);
    }),
  },
  projects: {
    desc: "load projects module",
    run: () => loadingBar("LOADING PROJECTS MODULE", () => {
      pushBlock(sections.projects.header);
      pushBlock(sections.projects.content);
      pushBlock(sections.projects.footer);
    }),
  },
  contact: {
    desc: "load contact module",
    run: () => loadingBar("LOADING CONTACT MODULE", () => {
      pushBlock(sections.contact.header);
      pushBlock(sections.contact.content);
      pushBlock(sections.contact.footer);
    }),
  },
  logo: {
    desc: "display system logo (ascii art)",
    run: () => pushLine(LOGO_ASCII, { ascii: true }),
  },
  art: {
    desc: "cycle through the ascii art gallery",
    run: () => {
      loadingBar("RENDERING ART", () => {
        pushLine(GALLERY[galleryIndex], { ascii: true });
        galleryIndex = (galleryIndex + 1) % GALLERY.length;
      });
    },
  },
  show: {
    desc: "show <about|projects|contact|logo|cat> — display ascii art",
    run: (args) => {
      const name = (args[0] || "").toLowerCase();
      const art = IMAGES[name];
      if (!art) {
        pushLine(`USAGE: SHOW <${Object.keys(IMAGES).join("|").toUpperCase()}>`, { dim: true });
        return;
      }
      loadingBar(`RENDERING ${name.toUpperCase()}`, () => pushLine(art, { ascii: true }));
    },
  },
  games: {
    desc: "open the games menu",
    run: () => {
      pushLine("GAMES MENU", { prompt: true });
      pushLine("  SNAKE    - classic ascii snake (arrow keys, esc to quit)", { dim: true });
      pushLine("TYPE A GAME NAME TO LAUNCH IT.", { dim: true });
    },
  },
  snake: {
    desc: "play ascii snake (arrow keys, esc to quit)",
    run: () => loadingBar("LOADING SNAKE.EXE", startSnake),
  },
  clear: {
    desc: "clear the screen buffer",
    run: () => { clearFeed(); pushLine("BUFFER CLEARED", { dim: true }); },
  },
  date: {
    desc: "show current date",
    run: () => pushLine(new Date().toDateString().toUpperCase(), { dim: true }),
  },
  time: {
    desc: "show current time",
    run: () => pushLine(new Date().toTimeString().slice(0, 8), { dim: true }),
  },
  whoami: {
    desc: "show current session user",
    run: () => pushLine("USER: GUEST@SYS400", { dim: true }),
  },
  echo: {
    desc: "echo <text> — print text back to the screen",
    run: (args) => pushLine(args.join(" ") || ""),
  },
  color: {
    desc: "color <green|amber> — set phosphor color",
    run: (args) => {
      const choice = (args[0] || "").toLowerCase();
      if (!PHOSPHOR_CYCLE.includes(choice)) {
        pushLine(`USAGE: COLOR <${PHOSPHOR_CYCLE.join("|").toUpperCase()}>`, { dim: true });
        return;
      }
      document.body.dataset.phosphor = choice;
      localStorage.setItem("phosphor", choice);
      phosphorBtn.textContent = PHOSPHOR_LABELS[choice];
      pushLine(`PHOSPHOR SET TO ${choice.toUpperCase()}`, { dim: true });
    },
  },
  ls: {
    desc: "list available modules",
    run: () => {
      pushLine("MODULES:", { prompt: true });
      FILES.forEach((f) => pushLine(`  ${f.name}`, { dim: true, delay: 30 }));
    },
  },
  dir: {
    desc: "list available modules (dos-style)",
    run: () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US");
      const timeStr = now.toTimeString().slice(0, 5);
      pushLine(" VOLUME IN DRIVE C IS SYS400", { dim: true });
      pushLine(" DIRECTORY OF C:\\SYS400", { dim: true });
      pushLine("", { delay: 30 });
      FILES.forEach((f) => {
        pushLine(`${dateStr}  ${timeStr}    ${String(f.size).padStart(10)} ${f.name}`, { dim: true, delay: 30 });
      });
      pushLine(`        ${FILES.length} FILE(S)`, { dim: true });
    },
  },
  cd: {
    desc: "cd <dir> — change directory",
    run: (args) => {
      const target = (args[0] || "").toUpperCase();
      const dirs = ["HOME", "ABOUT", "PROJECTS", "CONTACT"];
      if (!target) { pushLine(currentPath, { dim: true }); return; }
      if (target === ".." || target === "\\" || target === "/") {
        setPath("C:\\SYS400");
        return;
      }
      if (!dirs.includes(target)) {
        pushLine(`THE SYSTEM CANNOT FIND THE PATH SPECIFIED: ${target}`, { error: true });
        return;
      }
      setPath(`C:\\SYS400\\${target}`);
      pushLine(`USE 'TYPE ${target}.SYS' TO VIEW THIS MODULE.`, { dim: true });
    },
  },
  type: {
    desc: "type <file> — load a module's content",
    run: (args) => {
      const fileName = (args[0] || "").toUpperCase();
      const base = fileName.replace(/\.SYS$/, "");
      const cmd = commands[base.toLowerCase()];
      if (!FILES.some((f) => f.name === `${base}.SYS`) || !cmd) {
        pushLine(`FILE NOT FOUND - ${fileName || "?"}`, { error: true });
        return;
      }
      cmd.run([]);
    },
  },
  ver: {
    desc: "show terminal version",
    run: () => pushLine("SYS400 TERMINAL EMULATION SYSTEM — VERSION 2.3 (BUILD 1994)", { dim: true }),
  },
  cls: {
    desc: "clear the screen buffer (alias of clear)",
    run: (args) => commands.clear.run(args),
  },
  vol: {
    desc: "show volume label and serial number",
    run: () => {
      pushLine(" VOLUME IN DRIVE C IS SYS400", { dim: true });
      pushLine(` VOLUME SERIAL NUMBER IS ${VOLUME_SERIAL}`, { dim: true });
    },
  },
  sysinfo: {
    desc: "display system hardware information",
    run: () => loadingBar("QUERYING HARDWARE", () => {
      pushLine("SYSTEM INFORMATION", { prompt: true });
      pushLine("  CPU ......... SYS400 PHOSPHOR CORE @ 4.77 MHZ", { dim: true });
      pushLine("  MEMORY ...... 640K CONVENTIONAL, OK", { dim: true });
      pushLine("  DISPLAY ..... MONOCHROME CRT, P1 PHOSPHOR", { dim: true });
      pushLine("  STORAGE ..... 20MB FIXED DISK", { dim: true });
      pushLine(`  UPTIME ...... ${formatUptime()}`, { dim: true });
    }),
  },
  mem: {
    desc: "show memory usage",
    run: () => {
      pushLine("  640K CONVENTIONAL + 0K EXTENDED = 640K TOTAL", { dim: true });
      pushLine("  612K AVAILABLE", { dim: true });
    },
  },
  ping: {
    desc: "ping <host> — simulate a network ping",
    run: (args) => {
      const host = (args[0] || "127.0.0.1").toUpperCase();
      pushLine(`PINGING ${host} WITH 32 BYTES OF DATA:`, { dim: true });
      for (let i = 0; i < 4; i++) {
        const ms = Math.floor(Math.random() * 40) + 8;
        pushLine(`REPLY FROM ${host}: BYTES=32 TIME=${ms}MS TTL=64`, { dim: true, delay: 350 });
      }
    },
  },
  sudo: {
    desc: "sudo <command> — request elevated privileges",
    run: () => pushLine("ACCESS DENIED: INSUFFICIENT PRIVILEGES. NICE TRY.", { error: true }),
  },
  ipconfig: {
    desc: "display the session's public ip address",
    run: () => {
      loadingBar("QUERYING NETWORK ADAPTER", async () => {
        pushLine("SYS400 NETWORK ADAPTER", { prompt: true });
        pushLine("  CONNECTION .... ETHERNET", { dim: true });
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          if (!res.ok) throw new Error("bad response");
          const data = await res.json();
          pushLine(`  PUBLIC IP ..... ${data.ip}`, { dim: true });
        } catch {
          pushLine("  PUBLIC IP ..... UNAVAILABLE (NO UPLINK)", { error: true });
        }
      });
    },
  },
  exit: {
    desc: "log off and restart the terminal session",
    run: () => loadingBar("LOGGING OFF", () => {
      pushLine("SESSION TERMINATED.", { dim: true });
      pushLine("REBOOTING...", { dim: true });
      setTimeout(() => {
        clearFeed();
        setPath("C:\\SYS400");
        bootSequence();
      }, 900);
    }),
  },
  logoff: {
    desc: "alias of exit",
    run: (args) => commands.exit.run(args),
  },
};

function runCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return;
  pushLine(trimmed.toUpperCase(), { prompt: true });
  const [name, ...args] = trimmed.split(/\s+/);
  const cmd = commands[name.toLowerCase()];
  if (!cmd) {
    pushLine(`'${name.toUpperCase()}' IS NOT RECOGNIZED. TYPE 'HELP' FOR A LIST OF COMMANDS.`, { error: true });
    return;
  }
  cmd.run(args);
}

document.querySelectorAll(".fkey").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.target;
    runCommand(target === "clear" ? "clear" : target);
  });
});

// ---------- physical function keys (F1-F4, F12) ----------
const FKEY_TARGETS = {};
document.querySelectorAll(".fkey").forEach((btn) => {
  const match = btn.textContent.match(/^F(\d+)/);
  if (match) FKEY_TARGETS[`F${match[1]}`] = btn.dataset.target;
});

document.addEventListener("keydown", (e) => {
  if (snakeState) return;
  const target = FKEY_TARGETS[e.key];
  if (!target) return;
  e.preventDefault();
  runCommand(target === "clear" ? "clear" : target);
});

const cmdForm = document.getElementById("cmd-form");
const cmdInput = document.getElementById("cmd-input");

cmdForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = cmdInput.value;
  if (value.trim()) {
    history.push(value);
    historyIndex = history.length;
  }
  runCommand(value);
  cmdInput.value = "";
  tabMatches = null;
});

// ---------- command history (up/down) ----------
let history = [];
let historyIndex = 0;

// ---------- tab completion ----------
let tabMatches = null;
let tabCycleIndex = 0;

cmdInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowUp") {
    e.preventDefault();
    if (history.length === 0) return;
    historyIndex = Math.max(0, historyIndex - 1);
    cmdInput.value = history[historyIndex] ?? "";
    tabMatches = null;
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    historyIndex = Math.min(history.length, historyIndex + 1);
    cmdInput.value = history[historyIndex] ?? "";
    tabMatches = null;
  } else if (e.key === "Tab") {
    e.preventDefault();
    const current = cmdInput.value;
    if (!tabMatches) {
      const partial = current.toLowerCase();
      if (!partial) return;
      tabMatches = Object.keys(commands).filter((name) => name.startsWith(partial));
      tabCycleIndex = 0;
      if (tabMatches.length === 0) { tabMatches = null; return; }
    } else {
      tabCycleIndex = (tabCycleIndex + 1) % tabMatches.length;
    }
    cmdInput.value = tabMatches[tabCycleIndex];
  } else {
    tabMatches = null;
  }
});

document.querySelector(".screen").addEventListener("click", () => cmdInput.focus());
cmdInput.focus();

// boot sequence
function bootSequence() {
  pushBlock([
    { text: "SYS400 BOOT v2.3", dim: true, delay: 60 },
    { text: "INITIALIZING TERMINAL SUBSYSTEM...", dim: true, delay: 60 },
    { text: "LOADING PHOSPHOR DRIVER... OK", dim: true, delay: 60 },
  ], 60);
  setTimeout(() => pushLine(LOGO_ASCII, { ascii: true }), 350);
  setTimeout(() => pushBlock(sections.home()), 500);
}

bootSequence();
