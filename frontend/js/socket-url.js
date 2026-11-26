export function socketUrl(name) {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  const hostname = location.hostname || "127.0.0.1";
  const query = `player_name=${encodeURIComponent(name)}`;
  return `${protocol}//${hostname}:8000/ws?${query}`;
}
