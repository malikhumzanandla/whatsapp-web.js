<div align="center">
    <br />
    <p>
        <a href="https://wwebjs.dev"><img src="https://github.com/wwebjs/logos/blob/main/4_Full%20Logo%20Lockup_Small/small_banner_blue.png?raw=true" title="whatsapp-web.js" alt="WWebJS Website" width="500" /></a>
    </p>
    <br />
    <h1>WhatsApp Web.js API Server</h1>
    <p>
        A multi-tenant WhatsApp API server based on the whatsapp-web.js library, designed for commercial use.
    </p>
    <p>
		<a href="https://www.npmjs.com/package/whatsapp-web.js"><img src="https://img.shields.io/npm/v/whatsapp-web.js.svg" alt="npm" /></a>
        <a href="https://depfu.com/github/pedroslopez/whatsapp-web.js?project_id=9765"><img src="https://badges.depfu.com/badges/4a65a0de96ece65fdf39e294e0c8dcba/overview.svg" alt="Depfu" /></a>
        <img src="https://img.shields.io/badge/WhatsApp_Web-2.3000.1017054665-brightgreen.svg" alt="WhatsApp_Web 2.2346.52" />
        <a href="https://discord.gg/H7DqQs4"><img src="https://img.shields.io/discord/698610475432411196.svg?logo=discord" alt="Discord server" /></a>
	</p>
    <br />
</div>

## Features

- Multi-tenant architecture supporting multiple WhatsApp clients
- API key-based authentication for secure access
- REST API for sending messages and managing WhatsApp sessions
- QR code generation for WhatsApp Web authentication
- MySQL database integration for client and API key management
- Migration system for database schema management

## Prerequisites

- Node.js v18 or higher
- MySQL database
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/whatsapp-web.js-api.git
   cd whatsapp-web.js-api
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Set up the database:
   ```bash
   # Option 1: Using the Node.js script (recommended)
   node migrate.js
   
   # Option 2: Using the MySQL command line
   mysql -u your_username -p your_database_name < migrations/000_create_migrations_table.sql
   mysql -u your_username -p your_database_name < migrations/001_create_tables.sql
   ```
   
   For detailed instructions, see the [Migration Guide](./docs/MIGRATION_GUIDE.md).

## Configuration

Edit the `.env` file with your configuration:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=whatsapp_web
SESSION_DIR=/path/to/sessions
ADMIN_API_KEY=your_secure_admin_key
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## Usage

1. Start the server:
   ```bash
   node server.js
   ```

2. Create an API key for a client:
   ```bash
   curl -X POST http://localhost:3001/api/admin/create-api-key \
     -H "x-admin-key: your_admin_key" \
     -H "Content-Type: application/json" \
     -d '{"clientId": "client001"}'
   ```

3. Initialize the client:
   ```bash
   curl -X POST http://localhost:3001/api/init \
     -H "x-api-key: client_api_key" \
     -H "Content-Type: application/json" \
     -d '{"clientId": "client001"}'
   ```

4. Get the QR code for authentication:
   ```bash
   curl -X GET http://localhost:3001/api/qr/client001 \
     -H "x-api-key: client_api_key"
   ```

5. Check client status:
   ```bash
   curl -X GET http://localhost:3001/api/status/client001 \
     -H "x-api-key: client_api_key"
   ```

6. Send a message:
   ```bash
   curl -X POST http://localhost:3001/api/sendmessage/client001 \
     -H "x-api-key: client_api_key" \
     -H "Content-Type: application/json" \
     -d '{"number": "1234567890", "message": "Hello from API!"}'
   ```

For more details, see the [API Documentation](./docs/API_DOCUMENTATION.md).

## Docker Deployment

A Dockerfile is provided for containerized deployment:

```bash
# Build the image
docker build -t whatsapp-api .

# Run the container
docker run -p 3001:3001 \
  -e DB_HOST=host.docker.internal \
  -e DB_USER=root \
  -e DB_PASSWORD=password \
  -e DB_NAME=whatsapp_web \
  -e ADMIN_API_KEY=your_admin_key \
  -v /path/to/sessions:/app/.wwebjs_auth \
  whatsapp-api
```

## About WhatsApp Web.js

This project uses the WhatsApp Web.js library, which works by launching the WhatsApp Web browser application and managing it using Puppeteer to create an instance of WhatsApp Web. This approach mitigates the risk of being blocked by accessing WhatsApp Web's internal functions, giving you access to nearly all the features available on WhatsApp Web.

> [!IMPORTANT]
> **It is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.**

### Supported WhatsApp Features

| Feature  | Status |
| ------------- | ------------- |
| Multi Device  | ✅  |
| Send messages  | ✅  |
| Receive messages  | ✅  |
| Send media (images/audio/documents)  | ✅  |
| Send media (video)  | ✅ [(requires Google Chrome)][google-chrome]  |
| Send stickers | ✅ |
| Receive media (images/audio/video/documents)  | ✅  |
| Send contact cards | ✅ |
| Send location | ✅ |
| Send buttons | ❌  [(DEPRECATED)][deprecated-video] |
| Send lists | ❌  [(DEPRECATED)][deprecated-video] |
| Receive location | ✅ | 
| Message replies | ✅ |
| Join groups by invite  | ✅ |
| Get invite for group  | ✅ |
| Modify group info (subject, description)  | ✅  |
| Modify group settings (send messages, edit info)  | ✅  |
| Add group participants  | ✅  |
| Kick group participants  | ✅  |
| Promote/demote group participants | ✅ |
| Mention users | ✅ |
| Mention groups | ✅ |
| Mute/unmute chats | ✅ |
| Block/unblock contacts | ✅ |
| Get contact info | ✅ |
| Get profile pictures | ✅ |
| Set user status message | ✅ |
| React to messages | ✅ |
| Create polls | ✅ |
| Vote in polls | 🔜 |
| Communities | 🔜 |
| Channels | 🔜 |

## Contributing

Feel free to open pull requests; we welcome contributions! However, for significant changes, it's best to open an issue beforehand. Make sure to review our [contribution guidelines][contributing] before creating a pull request. Before creating your own issue or pull request, always check to see if one already exists!

## Supporting the WhatsApp-Web.js Project

You can support the maintainer of the original WhatsApp-web.js project through the links below:

- [Support via GitHub Sponsors][gitHub-sponsors]
- [Support via PayPal][support-payPal]
- [Sign up for DigitalOcean][digitalocean] and get $200 in credit when you sign up (Referral)

## Links

* [WhatsApp-Web.js Website][website]
* [WhatsApp-Web.js Guide][guide] ([source][guide-source])
* [WhatsApp-Web.js Documentation][documentation] ([source][documentation-source])
* [WWebJS Discord][discord]
* [GitHub][gitHub]
* [npm][npm]

## Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at [whatsapp.com][whatsapp]. "WhatsApp" as well as related names, marks, emblems and images are registered trademarks of their respective owners. 

It is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe.

## License

### WhatsApp-Web.js API Server
[MIT](LICENSE)

### WhatsApp-Web.js Library
Copyright 2019 Pedro S Lopez  

Licensed under the Apache License, Version 2.0 (the "License");  
you may not use this project except in compliance with the License.  
You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.  

Unless required by applicable law or agreed to in writing, software  
distributed under the License is distributed on an "AS IS" BASIS,  
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  
See the License for the specific language governing permissions and  
limitations under the License.  


[website]: https://wwebjs.dev
[guide]: https://guide.wwebjs.dev/guide
[guide-source]: https://github.com/wwebjs/wwebjs.dev/tree/main
[documentation]: https://docs.wwebjs.dev/
[documentation-source]: https://github.com/pedroslopez/whatsapp-web.js/tree/main/docs
[discord]: https://discord.gg/H7DqQs4
[gitHub]: https://github.com/pedroslopez/whatsapp-web.js
[npm]: https://npmjs.org/package/whatsapp-web.js
[nodejs]: https://nodejs.org/en/download/
[examples]: https://github.com/pedroslopez/whatsapp-web.js/blob/master/example.js
[auth-strategies]: https://wwebjs.dev/guide/creating-your-bot/authentication.html
[google-chrome]: https://wwebjs.dev/guide/creating-your-bot/handling-attachments.html#caveat-for-sending-videos-and-gifs
[deprecated-video]: https://www.youtube.com/watch?v=hv1R1rLeVVE
[gitHub-sponsors]: https://github.com/sponsors/pedroslopez
[support-payPal]: https://www.paypal.me/psla/
[digitalocean]: https://m.do.co/c/73f906a36ed4
[contributing]: https://github.com/pedroslopez/whatsapp-web.js/blob/main/CODE_OF_CONDUCT.md
[whatsapp]: https://whatsapp.com
````
