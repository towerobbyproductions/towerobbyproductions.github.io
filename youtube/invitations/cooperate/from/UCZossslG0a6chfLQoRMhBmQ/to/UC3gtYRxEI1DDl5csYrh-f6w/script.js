const API_KEY = "PASTE_YOUR_YOUTUBE_API_KEY_HERE";

// Optional proxy support:
// If you later create your own backend/proxy, replace this with your endpoint.
// Example: const API_BASE = "https://your-domain.com/youtube/channels";
const API_BASE = "https://www.googleapis.com/youtube/v3/channels";

const channels = [
  {
    id: "UCZossslG0a6chfLQoRMhBmQ",
    prefix: "me",
    fallbackTitle: "@kirill2314dgj",
    fallbackAvatar: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
  },
  {
    id: "UC3gtYRxEI1DDl5csYrh-f6w",
    prefix: "him",
    fallbackTitle: "@rehanroblox067",
    fallbackAvatar: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
  },
];

function formatCount(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("en-US").format(num);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function setImage(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

function setChannel(prefix, data, fallback) {
  const item = data && data.items && data.items[0];
  if (!item) {
    setText(`title-${prefix}`, fallback.fallbackTitle);
    setText(`subs-${prefix}`, "Unavailable");
    setText(`videos-${prefix}`, "Unavailable");
    setText(`views-${prefix}`, "Unavailable");
    setText(`desc-${prefix}`, "Could not load live channel data.");
    setImage(`avatar-${prefix}`, fallback.fallbackAvatar);
    return;
  }

  const snippet = item.snippet || {};
  const stats = item.statistics || {};

  setText(`title-${prefix}`, snippet.title || fallback.fallbackTitle);
  setText(`subs-${prefix}`, stats.hiddenSubscriberCount ? "Hidden" : formatCount(stats.subscriberCount));
  setText(`videos-${prefix}`, formatCount(stats.videoCount));
  setText(`views-${prefix}`, formatCount(stats.viewCount));
  setText(`desc-${prefix}`, snippet.description || "No description provided.");
  setImage(
    `avatar-${prefix}`,
    (snippet.thumbnails && (snippet.thumbnails.high || snippet.thumbnails.medium || snippet.thumbnails.default))?.url ||
      fallback.fallbackAvatar
  );
}

async function loadChannels() {
  const apiNote = document.getElementById("apiNote");

  if (!API_KEY || API_KEY === "PASTE_YOUR_YOUTUBE_API_KEY_HERE") {
    apiNote.textContent = "Add your YouTube Data API key in script.js to load live data.";
    channels.forEach((ch) => setChannel(ch.prefix, null, ch));
    return;
  }

  const ids = channels.map((c) => c.id).join(",");
  const url = `${API_BASE}?part=snippet,statistics&id=${encodeURIComponent(ids)}&key=${encodeURIComponent(API_KEY)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    channels.forEach((ch) => {
      const filtered = {
        items: (data.items || []).filter((item) => item.id === ch.id),
      };
      setChannel(ch.prefix, filtered, ch);
    });

    apiNote.textContent = "Live data loaded from YouTube Data API.";
  } catch (error) {
    channels.forEach((ch) => setChannel(ch.prefix, null, ch));
    apiNote.textContent = "Live data failed to load. Check your API key and project settings.";
    console.error("YouTube API error:", error);
  }
}

loadChannels();
