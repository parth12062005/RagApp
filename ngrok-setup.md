# Quick HTTPS Setup with ngrok

## Option 2: Use ngrok for HTTPS tunneling

1. **Install ngrok on your EC2 instance:**
```bash
# Download ngrok
wget https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz
tar xvzf ngrok-v3-stable-linux-amd64.tgz
sudo mv ngrok /usr/local/bin/

# Sign up at https://ngrok.com and get your authtoken
ngrok config add-authtoken YOUR_AUTHTOKEN
```

2. **Start ngrok tunnel:**
```bash
# This will create an HTTPS tunnel to your local port 8000
ngrok http 8000
```

3. **Update your API_URL in App.jsx:**
```javascript
// Use the HTTPS URL that ngrok provides (e.g., https://abc123.ngrok.io)
const API_URL = 'https://your-ngrok-url.ngrok.io';
```

## Option 3: Use Cloudflare Tunnel (Free alternative)

1. **Install cloudflared:**
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

2. **Create tunnel:**
```bash
cloudflared tunnel --url http://localhost:8000
```

3. **Update API_URL with the Cloudflare tunnel URL**
