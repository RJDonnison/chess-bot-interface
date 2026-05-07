# Chess Bot Web Interface

A web interface for playing chess against bots. Play against the built-in Stockfish engine or challenge bots that follow the API spec.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/RJDonnison/chess-bot-interface.git
cd chess-bot-interface
npm install
```

### Running locally

```bash
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Adding a Host

A "host" is any chess engine exposed as an HTTP API.

### In the interface

2. Click **Add Host**
3. Enter a name and the URL of the bot's API (e.g. `https://my-chess-bot.dev`)
4. Click **Add**

The new host will appear in the dropdown and persist across sessions.

### Removing or editing a host

Click the pencil icon next to any host in the **Hosts** panel to edit its name or URL, or the trash icon to remove it.

> **Note:** The built-in host's cannot be removed.

---

## Hosting Your Own Bot

If you want to run your own engine and add it as a host, your server must implement the Chess Bot API spec defined in [`api_spec.yml`](./api_spec.yml).

### Quick summary

Your server needs a single endpoint:

```
GET /bestmove?fen=<fen-string>
```

It must return JSON in this shape:

```json
{ "bestmove": "e2e4" }
```

The move must be in **UCI notation**.

### FEN strings

The interface sends a complete [FEN string](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation) with every request. FEN encodes the full board state so each request is stateless.

### CORS

Your server must allow cross-origin requests from wherever the interface is hosted. At minimum, add this response header:

```
Access-Control-Allow-Origin: *
```

### Resources

- [Chess Programming Wiki](https://www.chessprogramming.org/Main_Page)
- [Sebastian Lague Chess Bot Series](https://youtube.com/playlist?list=PLFt_AvWsXl0cvHyu32ajwh2qU1i6hl77c&si=8QvuRh98jtMaYEhq)
- [My Chess Bot](https://github.com/RJDonnison/Chess-Bot)

---

## Built-in Stockfish Host

The interface ships with [Stockfish](https://stockfishchess.org/) running locally in the browser. You can adjust its strength via the **Depth** input and use it to test your bots.

---

## Contributing

Pull requests welcome. Please open an issue first for any significant changes.
