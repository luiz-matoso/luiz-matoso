const fs = require("fs");
const path = require("path");

const USERNAME = "luiz-matoso";
const API_URL = `https://github-contributions-api.jogruber.de/v4/${USERNAME}?y=last`;

const OUTPUT_PATH = path.join(__dirname, "../assets/activity.svg");

const CELL_SIZE = 20;
const CELL_GAP = 5;
const WEEK_GAP = CELL_SIZE + CELL_GAP;

const PADDING_X = 18;
const PADDING_Y = 18;

const COLORS = {
  0: "#111111",
  1: "#333333",
  2: "#666666",
  3: "#999999",
  4: "#ffffff",
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function main() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch contributions: ${response.status}`);
  }

  const data = await response.json();
  const contributions = data.contributions;

  if (!Array.isArray(contributions)) {
    throw new Error("Invalid API response: contributions not found.");
  }

  const weeks = [];

  for (const day of contributions) {
    const date = new Date(day.date);
    const dayOfWeek = date.getUTCDay();

    if (dayOfWeek === 0 || weeks.length === 0) {
      weeks.push([]);
    }

    weeks[weeks.length - 1].push(day);
  }

  const width = PADDING_X * 2 + weeks.length * WEEK_GAP;
  const height = PADDING_Y * 2 + 7 * WEEK_GAP;

  const cells = weeks
    .map((week, weekIndex) => {
      return week
        .map((day) => {
          const date = new Date(day.date);
          const dayOfWeek = date.getUTCDay();

          const x = PADDING_X + weekIndex * WEEK_GAP;
          const y = PADDING_Y + dayOfWeek * WEEK_GAP;

          const level = day.level ?? 0;
          const count = day.count ?? 0;
          const color = COLORS[level] || COLORS[0];

          return `
  <rect
    x="${x}"
    y="${y}"
    width="${CELL_SIZE}"
    height="${CELL_SIZE}"
    rx="2"
    fill="${color}"
  >
    <title>${escapeXml(day.date)}: ${count} contribution${count === 1 ? "" : "s"}</title>
  </rect>`;
        })
        .join("");
    })
    .join("");

  const svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
${cells}
</svg>
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, svg, "utf8");

  console.log(`Generated ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
