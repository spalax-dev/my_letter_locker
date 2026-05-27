# My Letter Locker

Create a private letter that only your recipient can open. Encrypt your message, share a single URL, and let them unlock it with their secret word. No sign-ups, no databases — just a link.

## Features

- **Zero storage** — messages exist only in the URL, never on a server
- **Password protection** — encrypt with a secret word only your recipient knows
- **Self-destructing** — read once and discard option available
- **Cross-platform** — works on any device with a browser
- **No sign-ups** — create and share instantly
- **Pattern detection** — automatically recognizes and formats dates, URLs, emails, and commands

## How It Works

1. **Write your letter** — compose your secret message in the editor
2. **Encrypt it** — set a secret word that only your recipient will know
3. **Share the link** — send the generated URL through any channel (email, chat, etc.)

## Pattern Detection System

The editor automatically detects and transforms certain text patterns for enhanced readability:

| Pattern | Format | Result |
|---------|--------|--------|
| Dates | `DD/MM/YYYY` or `YYYY-MM-DD` | Creates link to Google Calendar |
| URLs | Any valid web address | Auto-linked with TLD validation |
| Emails | `user@domain.com` | `mailto:` link with domain validation |
| Phone numbers | International format with country code | Clickable `tel:` links |
| Commands | `$bold$`, `$italic$`, `$title$`, `$title:N$`, `$pass$` | Styled output |
| Whitespace | `\n` (newline), `\t` (tab) | Proper rendering |

### Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `$bold$text$$` | Bold text | `$bold$Important$` → **Important** |
| `$italic$text$$` | Italic text | `$italic$Emphasis$` → *Emphasis* |
| `$title$text$$` | Title heading | `$title$Welcome$` → Title |
| `$title:N$text$$` | Title level N (1-6) | `$title:2$Section$` → Section |
| `$pass$secret$$` | Password field | `$pass$mykey$` → `[••••••]` |

### Date Format Examples

- `25/12/2024` → Links to Google Calendar event
- `2024-12-25` → ISO format also supported

## Technical Stack

- **Vite** — fast development build tool
- **TypeScript** — type-safe JavaScript
- **Tailwind CSS** — utility-first styling

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Docker Deployment

```bash
# Build the Docker image
docker build -t letter-locker .

# Run the container
docker run -p 8080:80 letter-locker
```

The application will be available at `http://localhost:8080`.